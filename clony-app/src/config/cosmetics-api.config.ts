// 화장품 원료성분정보 API 설정
// 공공데이터포털 - 식품의약품안전처

export const COSMETICS_API_CONFIG = {
    // API 인증키 (공공데이터포털에서 발급)
    API_KEY: '1e21b6e85e900ad61362755eb97c595b60d86b4e19b51958a9b39345323b613a',

    // API 기본 URL - 공공데이터포털 표준
    BASE_URL: 'https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01',

    // 엔드포인트
    ENDPOINT: '/getCsmtcsIngdCpntList', // 화장품 원료 성분 목록 조회

    // 응답 형식
    DATA_TYPE: 'json', // 'json' 또는 'xml'

    // 기본 페이지 크기
    DEFAULT_PAGE_SIZE: 10,

    // 최대 페이지 크기
    MAX_PAGE_SIZE: 100,
};

/**
 * API 요청 URL 생성
 * 형식: https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntList?serviceKey={key}&pageNo={page}&numOfRows={rows}&type={type}
 * 
 * @param pageNo 페이지 번호 (1부터 시작)
 * @param numOfRows 한 페이지 결과 수
 * @param searchParams 검색 파라미터 (선택)
 * @returns 완성된 API URL
 */
export const buildCosmeticsApiUrl = (
    pageNo: number = 1,
    numOfRows: number = COSMETICS_API_CONFIG.DEFAULT_PAGE_SIZE,
    searchParams?: Record<string, string>
): string => {
    const { API_KEY, BASE_URL, ENDPOINT, DATA_TYPE } = COSMETICS_API_CONFIG;

    // 공공데이터포털 API는 serviceKey를 인코딩하지 않고 그대로 사용
    // URLSearchParams는 자동으로 인코딩하므로 수동으로 URL 구성
    const params = [
        `serviceKey=${API_KEY}`,
        `pageNo=${pageNo}`,
        `numOfRows=${numOfRows}`,
        `type=${DATA_TYPE}`,
    ];

    // 추가 검색 파라미터
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            params.push(`${key}=${encodeURIComponent(value)}`);
        });
    }

    const url = `${BASE_URL}${ENDPOINT}?${params.join('&')}`;

    console.log('Built API URL:', url);
    return url;
};
