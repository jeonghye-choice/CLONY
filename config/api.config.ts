/**
 * API 설정
 */

// 개발 시 로컬 PC의 IP 주소로 수정하세요 (예: 172.30.1.87)
const DEV_IP = '192.168.45.136';

// 프로덕션 서버 주소 (상용 서버 도메인이 결정되면 여기에 입력하세요)
const PROD_DOMAIN = 'https://clony-api.example.com';

export const API_URL = __DEV__
    ? `http://${DEV_IP}:8000`
    : PROD_DOMAIN;

export default {
    API_URL,
};
