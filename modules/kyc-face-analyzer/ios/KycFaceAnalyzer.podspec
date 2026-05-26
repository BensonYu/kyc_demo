Pod::Spec.new do |s|
  s.name           = 'KycFaceAnalyzer'
  s.version        = '1.0.0'
  s.summary        = 'KYC demo post-capture face analyzer'
  s.description    = 'Local iOS ML Kit face detection bridge for the KYC demo.'
  s.author         = 'BensonYu'
  s.homepage       = 'https://github.com/BensonYu/kyc_demo'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/FaceDetection'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
