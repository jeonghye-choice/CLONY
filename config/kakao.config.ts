/**
 * 카카오 OAuth 설정
 * 
 * 사용 방법:
 * 1. https://developers.kakao.com 에서 앱 등록
 * 2. REST API 키 발급
 * 3. 아래 KAKAO_REST_API_KEY에 발급받은 키 입력
 */

// TODO: 카카오 개발자 콘솔에서 발급받은 REST API 키를 여기에 입력하세요
export const KAKAO_REST_API_KEY = 'YOUR_REST_API_KEY_HERE';

// 개발 환경 감지
export const isDevelopment = __DEV__;

// Redirect URI는 자동 생성됨
// 개발: https://auth.expo.io/@your-username/clony-mobile
// 프로덕션: 커스텀 스킴 사용 가능
