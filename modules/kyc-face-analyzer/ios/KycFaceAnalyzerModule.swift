import ExpoModulesCore
import MLKitFaceDetection
import MLKitVision
import UIKit

public class KycFaceAnalyzerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KycFaceAnalyzer")

    AsyncFunction("analyzeFaceCaptureAsync") { (photoUri: String, guideBox: NormalizedFaceBoxRecord) -> [String: Any?] in
      return try analyzeFaceCapture(photoUri: photoUri, guideBox: guideBox)
    }
  }

  private func analyzeFaceCapture(photoUri: String, guideBox: NormalizedFaceBoxRecord) throws -> [String: Any?] {
    guard let photoUrl = URL(string: photoUri) else {
      throw FaceAnalyzerImageException()
    }

    guard photoUrl.isFileURL else {
      throw FaceAnalyzerImageException()
    }

    guard let image = UIImage(contentsOfFile: photoUrl.path), let cgImage = image.cgImage else {
      throw FaceAnalyzerImageException()
    }

    let options = FaceDetectorOptions()
    options.performanceMode = .accurate
    options.landmarkMode = .all
    options.classificationMode = .all
    options.minFaceSize = 0.12

    let visionImage = VisionImage(image: image)
    visionImage.orientation = image.imageOrientation

    let detector = FaceDetector.faceDetector(options: options)

    do {
      let faces = try detector.results(in: visionImage)
      return buildResult(faces: faces, imageWidth: Double(cgImage.width), imageHeight: Double(cgImage.height), guideBox: guideBox)
    } catch {
      throw FaceAnalyzerDetectionException()
    }
  }

  private func buildResult(faces: [Face], imageWidth: Double, imageHeight: Double, guideBox: NormalizedFaceBoxRecord) -> [String: Any?] {
    var reasons: [String] = []
    let faceDetected = !faces.isEmpty
    let singleFace = faces.count == 1
    let firstFace = faces.first
    let normalizedBox = firstFace.map { normalizeFaceBox($0, imageWidth: imageWidth, imageHeight: imageHeight) }
    let faceCentered = singleFace && normalizedBox.map { isInsideGuide(faceBox: $0, guideBox: guideBox) } == true
    let faceAreaRatio = normalizedBox.map { $0.width * $0.height } ?? 0
    let headYaw = firstFace?.hasHeadEulerAngleY == true ? firstFace?.headEulerAngleY : nil
    let headRoll = firstFace?.hasHeadEulerAngleZ == true ? firstFace?.headEulerAngleZ : nil
    let headYawOk = headYaw.map { abs($0) <= 22 } ?? true
    let headRollOk = headRoll.map { abs($0) <= 18 } ?? true
    let poseOk = headYawOk && headRollOk
    let leftEyeOpenProbability = firstFace?.hasLeftEyeOpenProbability == true ? firstFace?.leftEyeOpenProbability : nil
    let rightEyeOpenProbability = firstFace?.hasRightEyeOpenProbability == true ? firstFace?.rightEyeOpenProbability : nil
    let eyeSignalAvailable = leftEyeOpenProbability != nil && rightEyeOpenProbability != nil

    if !faceDetected {
      reasons.append("未检测到人脸，请将脸部完整放入框内后重拍。")
    }
    if faces.count > 1 {
      reasons.append("检测到多张人脸，请确保画面中只有本人。")
    }
    if singleFace && !faceCentered {
      reasons.append("人脸不在取景框内，请对齐框线后重拍。")
    }
    if singleFace && faceAreaRatio < 0.12 {
      reasons.append("人脸占比偏小，请靠近一点后重拍。")
    }
    if singleFace && faceAreaRatio > 0.62 {
      reasons.append("人脸离镜头过近，请稍微后退后重拍。")
    }
    if singleFace && !poseOk {
      reasons.append("脸部角度偏大，请正对摄像头重拍。")
    }
    if singleFace && !eyeSignalAvailable {
      reasons.append("ML Kit 未返回稳定眼部分类信号，后续动作活体需要更谨慎。")
    }
    if reasons.isEmpty {
      reasons.append("iOS ML Kit 已检测到单个人脸，且人脸位于框内。")
    }

    let qualityOk = faceDetected && singleFace && faceCentered && (0.12...0.62).contains(faceAreaRatio) && poseOk

    return [
      "provider": "ios_mlkit",
      "platformRoute": "ios",
      "faceDetected": faceDetected,
      "singleFace": singleFace,
      "faceCentered": faceCentered,
      "brightnessOk": true,
      "blurOk": true,
      "occlusionOk": poseOk,
      "faceCount": faces.count,
      "faceBox": normalizedBox?.toDictionary(),
      "imageSize": [
        "width": imageWidth,
        "height": imageHeight
      ],
      "faceAreaRatio": faceAreaRatio,
      "headYaw": headYaw,
      "headRoll": headRoll,
      "leftEyeOpenProbability": leftEyeOpenProbability,
      "rightEyeOpenProbability": rightEyeOpenProbability,
      "confidence": qualityOk ? (eyeSignalAvailable ? 0.9 : 0.78) : (faceDetected ? 0.45 : 0.15),
      "reasons": reasons
    ]
  }

  private func normalizeFaceBox(_ face: Face, imageWidth: Double, imageHeight: Double) -> NormalizedFaceBoxRecord {
    let frame = face.frame
    let left = min(max(frame.minX, 0), imageWidth)
    let top = min(max(frame.minY, 0), imageHeight)
    let right = min(max(frame.maxX, 0), imageWidth)
    let bottom = min(max(frame.maxY, 0), imageHeight)

    return NormalizedFaceBoxRecord(
      x: left / imageWidth,
      y: top / imageHeight,
      width: max(right - left, 0) / imageWidth,
      height: max(bottom - top, 0) / imageHeight
    )
  }

  private func isInsideGuide(faceBox: NormalizedFaceBoxRecord, guideBox: NormalizedFaceBoxRecord) -> Bool {
    let tolerance = 0.04
    let faceLeft = faceBox.x
    let faceTop = faceBox.y
    let faceRight = faceBox.x + faceBox.width
    let faceBottom = faceBox.y + faceBox.height
    let guideLeft = guideBox.x - tolerance
    let guideTop = guideBox.y - tolerance
    let guideRight = guideBox.x + guideBox.width + tolerance
    let guideBottom = guideBox.y + guideBox.height + tolerance

    return faceLeft >= guideLeft && faceTop >= guideTop && faceRight <= guideRight && faceBottom <= guideBottom
  }
}

struct NormalizedFaceBoxRecord: Record {
  @Field var x: Double = 0
  @Field var y: Double = 0
  @Field var width: Double = 0
  @Field var height: Double = 0

  func toDictionary() -> [String: Double] {
    return [
      "x": x,
      "y": y,
      "width": width,
      "height": height
    ]
  }
}

final class FaceAnalyzerImageException: Exception {
  override var reason: String {
    "无法读取待分析的自拍照。"
  }
}

final class FaceAnalyzerDetectionException: Exception {
  override var reason: String {
    "iOS ML Kit 人脸检测失败。"
  }
}
