import { buildCosmeticsApiUrl } from '../config/cosmetics-api.config';

/**
 * 화장품 원료 성분 정보 타입 (공공데이터포털 실제 API 응답 형식)
 */
export interface CosmeticsIngredient {
    INGR_KOR_NAME?: string;           // 성분명 (한글)
    INGR_ENG_NAME?: string;           // 성분명 (영문)
    CAS_NO?: string;                  // CAS 번호
    ORIGIN_MAJOR_KOR_NAME?: string;   // 기원 (한글)
    INGR_SYNONYM?: string;            // 동의어
    [key: string]: any;               // 기타 필드
}

/**
 * API 응답 타입 (공공데이터포털 표준 형식)
 */
export interface CosmeticsApiResponse {
    header?: {
        resultCode: string;
        resultMsg: string;
    };
    body?: {
        items?: {
            item?: CosmeticsIngredient[];
        };
        numOfRows?: number;
        pageNo?: number;
        totalCount?: number;
    };
}

/**
 * 화장품 원료 성분 검색
 * @param ingredientName 검색할 성분명 (한글 또는 영문)
 * @param pageSize 페이지 크기 (기본값: 20)
 * @returns 검색 결과
 */
export const searchCosmeticsIngredient = async (
    ingredientName: string,
    pageSize: number = 20
): Promise<CosmeticsIngredient[]> => {
    try {
        // 검색어가 비어있으면 빈 배열 반환
        if (!ingredientName.trim()) {
            return [];
        }

        // API URL 생성
        const url = buildCosmeticsApiUrl(1, pageSize);

        console.log('Fetching cosmetics ingredient data:', url);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return [];
        }

        // 응답 텍스트 먼저 확인
        const text = await response.text();
        console.log('API Response (first 200 chars):', text.substring(0, 200));

        // JSON 파싱 시도
        let data: CosmeticsApiResponse;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response was not valid JSON. First 500 chars:', text.substring(0, 500));
            return [];
        }

        // 응답 헤더 확인
        if (data.header?.resultCode !== '00') {
            console.error('API Error:', data.header?.resultMsg);
            return [];
        }

        // body.items.item 데이터가 없으면 빈 배열 반환
        if (!data.body?.items?.item || !Array.isArray(data.body.items.item)) {
            console.log('No items in response');
            return [];
        }

        // 검색어로 필터링 (한글 또는 영문)
        const results = data.body.items.item.filter((item) => {
            const korNameMatch = item.INGR_KOR_NAME?.toLowerCase().includes(ingredientName.toLowerCase());
            const engNameMatch = item.INGR_ENG_NAME?.toLowerCase().includes(ingredientName.toLowerCase());
            const synonymMatch = item.INGR_SYNONYM?.toLowerCase().includes(ingredientName.toLowerCase());

            return korNameMatch || engNameMatch || synonymMatch;
        });

        console.log(`Found ${results.length} matching ingredients`);
        return results;
    } catch (error) {
        console.error('Error fetching cosmetics ingredient data:', error);
        return [];
    }
};

/**
 * CAS 번호로 화장품 원료 검색
 * @param casNo CAS 번호
 * @returns 검색 결과
 */
export const searchIngredientByCasNo = async (
    casNo: string
): Promise<CosmeticsIngredient | null> => {
    try {
        const url = buildCosmeticsApiUrl(1, 100);
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const text = await response.text();
        const data: CosmeticsApiResponse = JSON.parse(text);

        if (!data.body?.items?.item) {
            return null;
        }

        const result = data.body.items.item.find((item) => item.CAS_NO === casNo);
        return result || null;
    } catch (error) {
        console.error('Error fetching ingredient by CAS No:', error);
        return null;
    }
};

/**
 * 전체 화장품 원료 목록 가져오기 (페이징)
 * @param page 페이지 번호 (1부터 시작)
 * @param pageSize 페이지 크기
 * @returns 원료 목록
 */
export const getCosmeticsIngredientList = async (
    page: number = 1,
    pageSize: number = 10
): Promise<{ ingredients: CosmeticsIngredient[]; totalCount: number }> => {
    try {
        const url = buildCosmeticsApiUrl(page, pageSize);
        const response = await fetch(url);

        if (!response.ok) {
            return { ingredients: [], totalCount: 0 };
        }

        const text = await response.text();
        const data: CosmeticsApiResponse = JSON.parse(text);

        if (!data.body?.items?.item) {
            return { ingredients: [], totalCount: 0 };
        }

        return {
            ingredients: data.body.items.item,
            totalCount: data.body.totalCount || 0,
        };
    } catch (error) {
        console.error('Error fetching cosmetics ingredient list:', error);
        return { ingredients: [], totalCount: 0 };
    }
};
