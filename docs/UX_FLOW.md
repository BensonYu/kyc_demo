# KYC Demo UX Flow

## 1. UX Principles

- Keep the first screen focused on one action: start KYC.
- Make privacy and permissions understandable before requesting system prompts.
- Use camera guidance that helps users recover quickly.
- Do not overstate trust. The app is running local demo checks.
- Every failure state must have a clear next action.

## 2. Screen Map

| Screen | Purpose | Primary Action |
| --- | --- | --- |
| Home | Start the flow. | 开始 KYC |
| Consent | Explain local capture and demo use. | 同意并继续 |
| Permissions | Request camera and microphone access. | 授权 |
| Camera Capture | Align face, capture photo, record video. | 开始拍摄 |
| Biometric Check | Optional system authentication. | 继续 |
| Liveness Challenge | Complete action challenge. | 完成动作 |
| Processing | Run local checks and scoring. | None |
| Result Pass | Show successful demo result. | 完成 |
| Result Retry | Explain issue and retry. | 重新验证 |
| Result Review | Show manual-review style outcome. | 重新验证 / 结束 |

## 3. Detailed Flow

### Home

Content:

- App title: "KYC Demo"
- One-sentence description: "用自拍照、5 秒自拍视频和本地活体检查完成演示验证。"
- Primary button: "开始 KYC"

Behavior:

- Tap starts a new local session and navigates to Consent.

### Consent

Content:

- Explain that the app will use camera and microphone.
- Explain that photo/video are used for local demo checks.
- Explain that no backend upload occurs in MVP.
- Explain that system biometric authentication may be requested if supported.

Primary action:

- "同意并继续"

Secondary action:

- "返回"

### Permissions

Required system permissions:

- Camera.
- Microphone.

Optional:

- Local authentication prompt happens later and should not be presented as a normal permission.

States:

- Not requested: show why access is needed.
- Granted: continue to camera.
- Denied: explain how to enable access in Settings.
- Limited/unavailable: show recovery copy.

### Camera Capture

Layout:

- Full-screen front camera preview.
- Face alignment guide.
- Recording progress indicator.
- Minimal status text.
- Capture/record action button.

Happy path:

1. User aligns face.
2. App captures photo.
3. App starts 5-second video recording.
4. Progress reaches 5 seconds.
5. App stops recording and continues.

Recovery states:

- Face not centered: "请将脸部移到框内。"
- Too dark: "光线较暗，请移动到更明亮的位置。"
- Too blurry: "请保持手机稳定。"
- Multiple faces: "请确保画面中只有本人。"
- Recording interrupted: "录制被中断，请重新开始。"

### Biometric Check

Purpose:

- Add optional confidence that the device owner approved the session.

Copy:

- "如果设备支持，我们会请求一次本机生物认证作为辅助信号。"

Outcomes:

- Authenticated: continue to liveness with positive signal.
- Failed: continue to liveness with weak signal.
- Canceled: continue to liveness with neutral/weak signal.
- Unsupported/not enrolled: continue to liveness without penalty.

The user should never be blocked only because biometric authentication is unavailable.

### Liveness Challenge

Challenge examples:

- "请眨眼。"
- "请向左再向右转头。"
- "请张嘴。"

Behavior:

- Show one or two challenges.
- Use a visible countdown.
- Mark pass/fail at the challenge level.
- On failure, allow retry.

MVP note:

- If real-time gesture detection is not implemented yet, use timed prompts and deterministic demo controls while preserving the final interface contract.

### Processing

Content:

- Short loading state such as "正在进行本地演示校验..."
- Optional checklist animation:
  - 照片质量
  - 视频完整性
  - 活体动作
  - 风险评分

Behavior:

- Run local checks.
- Generate deterministic result.
- Navigate to result screen.

### Result Pass

Content:

- Title: "本地演示校验通过"
- Show risk score.
- Show primary reasons:
  - 自拍照已采集。
  - 5 秒自拍视频已采集。
  - 活体动作已完成。
  - 风险评分在通过范围内。

Primary action:

- "完成"

### Result Retry

Content:

- Title: "需要重新验证"
- Show most actionable reason first.
- Show risk score if available.

Primary action:

- "重新验证"

Secondary action:

- "返回首页"

### Result Review

Content:

- Title: "建议人工复核"
- Explain that local demo signals are mixed.
- Show risk score and reasons.

Primary action:

- "重新验证"

Secondary action:

- "结束"

## 4. Edge Cases

| Case | UX Response |
| --- | --- |
| Camera permission denied | Show settings guidance and retry permission check. |
| Microphone permission denied | Explain video recording needs microphone access; allow retry. |
| Camera unavailable | Show device limitation and return home. |
| User cancels biometric prompt | Continue to liveness. |
| Biometric unsupported | Continue to liveness. |
| Video shorter than 5 seconds | Show retry with clear reason. |
| Multiple faces detected | Ask user to retry alone in frame. |
| App backgrounded during capture | Cancel current recording and ask user to retry. |
| TrueDepth unavailable | Continue normal flow without mentioning technical failure. |

## 5. Copy Guidelines

Use:

- "本地演示校验"
- "风险评分"
- "辅助信号"
- "建议人工复核"
- "重新验证"

Avoid:

- "真实身份已认证"
- "合规 KYC 已完成"
- "Face ID 已验证此人身份"
- "防欺诈检测准确"

## 6. Acceptance Criteria

- A user can complete the happy path from Home to Result Pass.
- A user can recover from denied permissions.
- A user can retry after capture or liveness failure.
- Biometric failure does not block the whole flow.
- Result screens clearly explain pass, retry, and review.
- The UX never claims production-grade KYC or regulatory compliance.
