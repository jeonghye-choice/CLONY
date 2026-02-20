# 카카오 REST API 키 발급 가이드 🔑

실제 주소 검색 기능을 사용하기 위해 카카오 REST API 키를 발급받는 방법입니다.

## 1. 카카오 개발자 콘솔 접속
- [카카오 개발자 서비스 (Kakao Developers)](https://developers.kakao.com/)에 접속하여 로그인합니다.

## 2. 애플리케이션 등록
1. 상단 메뉴의 **[내 애플리케이션]**을 클릭합니다.
2. **[애플리케이션 추가하기]** 버튼을 클릭합니다.
   - **앱 이름**: `Clony` (사용자가 원하는 이름 입력)
   - **사업자명**: `개인` 또는 `Clony` (임의 입력 가능)
3. 생성된 앱 카드를 클릭하여 상세 페이지로 이동합니다.
4. 왼쪽 메뉴에서 **[앱 권한]** 등을 설정할 필요 없이 바로 다음 단계로 넘어가셔도 됩니다.

## 3. REST API 키 확인
1. 왼쪽 메뉴의 **[요약 정보]** 페이지에서 **앱 키** 항목을 찾습니다.
2. **REST API 키** 값을 복사합니다. (이 키가 우리가 사용할 키입니다!)

## 4. 로컬/도메인 보안 설정
1. 왼쪽 메뉴의 **[플랫폼]**을 클릭합니다.
2. **[Web 플랫폼 등록]**을 선택합니다.
3. **사이트 도메인**에 아래 내용을 추가합니다 (개발용):
   - `http://localhost:19000` (Expo 개발용 도메인)
   - `https://auth.expo.io` (Expo Auth용)

## 5. 프로젝트에 적용
- 복사한 **REST API 키**를 `clony-mobile/config/kakao.config.ts` 파일의 `KAKAO_REST_API_KEY` 변수에 붙여넣으세요.

```typescript
// clony-mobile/config/kakao.config.ts
export const KAKAO_REST_API_KEY = '여기에_복사한_키를_넣으세요';
```
