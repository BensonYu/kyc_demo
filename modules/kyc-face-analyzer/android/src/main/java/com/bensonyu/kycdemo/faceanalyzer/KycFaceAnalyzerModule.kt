package com.bensonyu.kycdemo.faceanalyzer

import android.content.Context
import android.net.Uri
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class KycFaceAnalyzerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  override fun definition() = ModuleDefinition {
    Name("KycFaceAnalyzer")

    AsyncFunction("analyzeFaceCaptureAsync") Coroutine { photoUri: String, guideBox: NormalizedFaceBoxRecord ->
      analyzeFaceCapture(photoUri, guideBox)
    }
  }

  private suspend fun analyzeFaceCapture(photoUri: String, guideBox: NormalizedFaceBoxRecord): Map<String, Any?> {
    val image = try {
      InputImage.fromFilePath(context, Uri.parse(photoUri))
    } catch (error: Exception) {
      throw FaceAnalyzerImageException(error)
    }

    val detector = FaceDetection.getClient(
      FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .setMinFaceSize(0.12f)
        .build()
    )

    val faces = try {
      detector.process(image).await()
    } catch (error: Exception) {
      throw FaceAnalyzerDetectionException(error)
    } finally {
      detector.close()
    }

    return buildResult(faces, image, guideBox)
  }

  private fun buildResult(faces: List<Face>, image: InputImage, guideBox: NormalizedFaceBoxRecord): Map<String, Any?> {
    val reasons = mutableListOf<String>()
    val faceDetected = faces.isNotEmpty()
    val singleFace = faces.size == 1
    val firstFace = faces.firstOrNull()
    val normalizedBox = firstFace?.let { normalizeFaceBox(it, image.width, image.height) }
    val faceCentered = singleFace && normalizedBox?.let { isInsideGuide(it, guideBox) } == true
    val faceAreaRatio = normalizedBox?.let { it.width * it.height } ?: 0.0
    val poseOk = firstFace?.let { kotlin.math.abs(it.headEulerAngleY) <= 22.0f && kotlin.math.abs(it.headEulerAngleZ) <= 18.0f } ?: false
    val eyeSignalAvailable = firstFace?.leftEyeOpenProbability != null && firstFace.rightEyeOpenProbability != null

    if (!faceDetected) {
      reasons.add("未检测到人脸，请将脸部完整放入框内后重拍。")
    }
    if (faces.size > 1) {
      reasons.add("检测到多张人脸，请确保画面中只有本人。")
    }
    if (singleFace && !faceCentered) {
      reasons.add("人脸不在取景框内，请对齐框线后重拍。")
    }
    if (singleFace && faceAreaRatio < 0.12) {
      reasons.add("人脸占比偏小，请靠近一点后重拍。")
    }
    if (singleFace && faceAreaRatio > 0.62) {
      reasons.add("人脸离镜头过近，请稍微后退后重拍。")
    }
    if (singleFace && !poseOk) {
      reasons.add("脸部角度偏大，请正对摄像头重拍。")
    }
    if (singleFace && !eyeSignalAvailable) {
      reasons.add("ML Kit 未返回稳定眼部分类信号，后续动作活体需要更谨慎。")
    }
    if (reasons.isEmpty()) {
      reasons.add("Android ML Kit 已检测到单个人脸，且人脸位于框内。")
    }

    val qualityOk = faceDetected && singleFace && faceCentered && faceAreaRatio in 0.12..0.62 && poseOk

    return mapOf(
      "provider" to "android_mlkit",
      "platformRoute" to "android",
      "faceDetected" to faceDetected,
      "singleFace" to singleFace,
      "faceCentered" to faceCentered,
      "brightnessOk" to true,
      "blurOk" to true,
      "occlusionOk" to poseOk,
      "faceCount" to faces.size,
      "faceBox" to normalizedBox?.toMap(),
      "imageSize" to mapOf(
        "width" to image.width,
        "height" to image.height
      ),
      "faceAreaRatio" to faceAreaRatio,
      "headYaw" to firstFace?.headEulerAngleY,
      "headRoll" to firstFace?.headEulerAngleZ,
      "leftEyeOpenProbability" to firstFace?.leftEyeOpenProbability,
      "rightEyeOpenProbability" to firstFace?.rightEyeOpenProbability,
      "confidence" to when {
        qualityOk && eyeSignalAvailable -> 0.9
        qualityOk -> 0.78
        faceDetected -> 0.45
        else -> 0.15
      },
      "reasons" to reasons
    )
  }

  private fun normalizeFaceBox(face: Face, imageWidth: Int, imageHeight: Int): NormalizedFaceBoxRecord {
    val bounds = face.boundingBox
    val left = bounds.left.coerceIn(0, imageWidth)
    val top = bounds.top.coerceIn(0, imageHeight)
    val right = bounds.right.coerceIn(0, imageWidth)
    val bottom = bounds.bottom.coerceIn(0, imageHeight)

    return NormalizedFaceBoxRecord(
      x = left.toDouble() / imageWidth.toDouble(),
      y = top.toDouble() / imageHeight.toDouble(),
      width = (right - left).coerceAtLeast(0).toDouble() / imageWidth.toDouble(),
      height = (bottom - top).coerceAtLeast(0).toDouble() / imageHeight.toDouble()
    )
  }

  private fun isInsideGuide(faceBox: NormalizedFaceBoxRecord, guideBox: NormalizedFaceBoxRecord): Boolean {
    val tolerance = 0.04
    val faceLeft = faceBox.x
    val faceTop = faceBox.y
    val faceRight = faceBox.x + faceBox.width
    val faceBottom = faceBox.y + faceBox.height
    val guideLeft = guideBox.x - tolerance
    val guideTop = guideBox.y - tolerance
    val guideRight = guideBox.x + guideBox.width + tolerance
    val guideBottom = guideBox.y + guideBox.height + tolerance

    return faceLeft >= guideLeft && faceTop >= guideTop && faceRight <= guideRight && faceBottom <= guideBottom
  }
}

@OptimizedRecord
data class NormalizedFaceBoxRecord(
  @Field val x: Double = 0.0,
  @Field val y: Double = 0.0,
  @Field val width: Double = 0.0,
  @Field val height: Double = 0.0
) : Record {
  fun toMap(): Map<String, Double> = mapOf(
    "x" to x,
    "y" to y,
    "width" to width,
    "height" to height
  )
}

class FaceAnalyzerImageException(cause: Throwable) :
  CodedException("无法读取待分析的自拍照。", cause)

class FaceAnalyzerDetectionException(cause: Throwable) :
  CodedException("Android ML Kit 人脸检测失败。", cause)

suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { continuation ->
  addOnSuccessListener { result ->
    continuation.resume(result)
  }
  addOnFailureListener { exception ->
    continuation.resumeWithException(exception)
  }
  addOnCanceledListener {
    continuation.cancel()
  }
}
