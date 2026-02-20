# Google OAuth 로그인 설정 가이드 🌐

## 🎯 개요
Expo 앱에서 Google 로그인을 구현하기 위해 Google Cloud Console 설정이 필요합니다.

## ✅ 1단계: Google Cloud 프로젝트 생성 (3분)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 -> "새 프로젝트" 클릭
3. 프로젝트 이름 (예: `Clony-App`) 입력 후 생성

## 🔑 2단계: OAuth 동의 화면 설정 (2분)
1. "API 및 서비스" -> "OAuth 동의 화면" 클릭
2. User Type: **외부 (External)** 선택 후 만들기
3. 앱 정보 입력:
   - 앱 이름: `Clony`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. "저장 및 계속" (범위 설정은 기본값으로 진행)

## ⚙️ 3단계: 사용자 인증 정보 생성 (가장 중요!)
1. "API 및 서비스" -> "사용자 인증 정보" -> "사용자 인증 정보 만들기" -> "OAuth 클라이언트 ID" 클릭
2. 애플리케이션 유형: **웹 애플리케이션** 선택 (가장 쉽고 확실한 방법!)
3. 이름: `Clony-Web`
4. **승인된 리디렉션 URI** 추가:
   - `https://auth.expo.io/@your-expo-username/clony-mobile` (본인의 Expo 계정명 입력)
   - 또는 테스트용으로 `https://auth.expo.io` 입력
5. "만들기" 버튼 클릭 후 생성된 **클라이언트 ID**를 복사하세요.

> [!TIP]
> **Android/iOS용 인증 정보는 나중에 만드셔도 됩니다.**
> Expo Go 앱에서 테스트할 때는 '웹 애플리케이션' 타입의 ID 하나만 있어도 구글 로그인이 작동합니다. SHA-1 지문 같은 복잡한 설정 없이도 바로 시작할 수 있어요!

## 💻 4단계: 앱 설정 (2분)

**파일**: `clony-mobile/config/google.config.ts`

```typescript
export const GOOGLE_CONFIG = {
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
};
```

---
**완료!** 🎊 설정을 마치면 구글 로그인이 정상 동작합니다.
