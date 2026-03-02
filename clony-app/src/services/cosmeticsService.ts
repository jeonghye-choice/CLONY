import { buildCosmeticsApiUrl } from '../config/cosmetics-api.config';
import ingredientMappings from '../database/ingredients/ingredient_mapping.json';

/**
 * 화장품 원료 성분 정보 타입
 */
export interface CosmeticsIngredient {
    INGR_KOR_NAME?: string;           // 성분명 (한글)
    INGR_ENG_NAME?: string;           // 성분명 (영문)
    CAS_NO?: string;                  // CAS 번호
    ORIGIN_MAJOR_KOR_NAME?: string;   // 기원 (한글)
    INGR_SYNONYM?: string;            // 동의어
    DESCRIPTION?: string;             // 설명 (요약본)
    DESCRIPTION_ORIGIN?: string;      // 설명 원본 (전체 텍스트)
    FUNCTION?: string;                // 기능
    RESTRICTION?: string;             // 제한 사항 (CosIng)
    UPDATE_DATE?: string;              // 업데이트 날짜
    matchingScore?: number;           // 매칭 점수 (번역/유사도 기반)
    [key: string]: any;               // 기타 필드
}

/**
 * API 응답 타입
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
        totalCount?: number;
    };
}

/**
 * 문자열 유사도 측정 (Levenshtein Distance)
 */
const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
        Array.from({ length: b.length + 1 }, (_, j) => j)
    );
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[a.length][b.length];
};

/**
 * 한국어 성분명으로 최적의 매칭 (영문 명칭) 찾기
 */
export const translateKorToEng = (korName: string): { en: string; original: string; score: number } | null => {
    if (!korName) return null;

    const trimmed = korName.trim().replace(/\s+/g, '');
    let bestMatch = null;
    let minDistance = Infinity;

    // 사전형(Dictionary) 구조로 개편됨: { "한글": "영어" }
    for (const [ko, en] of Object.entries(ingredientMappings as Record<string, string>)) {
        const distance = getLevenshteinDistance(trimmed, ko);
        const threshold = Math.floor(ko.length * 0.4);

        if (distance <= threshold && distance < minDistance) {
            minDistance = distance;
            bestMatch = en;
        }

        if (distance === 0) return { en: en, original: ko, score: 100 };
    }

    if (bestMatch) {
        return { en: bestMatch, original: korName, score: Math.round((1 - minDistance / trimmed.length) * 100) };
    }

    return null;
};

/**
 * 한국어 성분명을 번역하고 상세 정보와 결합
 */
export const translateAndEnrich = async (korName: string): Promise<CosmeticsIngredient | null> => {
    const translation = translateKorToEng(korName);
    if (!translation) return null;

    // 외부 API 검색으로 fallback
    const results = await searchCosmeticsIngredient(translation.en, 1);
    if (results.length > 0) {
        return {
            ...results[0],
            INGR_KOR_NAME: korName,
            matchingScore: translation.score
        };
    }

    return {
        INGR_KOR_NAME: korName,
        INGR_ENG_NAME: translation.en,
        matchingScore: translation.score
    };
};

import popularIngredients from '../database/ingredients/popular_ingredients.json';

/**
 * 화장품 원료 성분 검색 (ingredient_mapping + 외부 API)
 */
export const searchCosmeticsIngredient = async (
    ingredientName: string,
    pageSize: number = 20
): Promise<CosmeticsIngredient[]> => {
    try {
        if (!ingredientName.trim()) return [];

        const searchTerm = ingredientName.toLowerCase();

        // 1. ingredient_mapping.json 에서 로컬 검색
        const localResults: CosmeticsIngredient[] = Object.entries(
            ingredientMappings as Record<string, string>
        )
            .filter(([ko, en]) =>
                ko.toLowerCase().includes(searchTerm) ||
                en.toLowerCase().includes(searchTerm)
            )
            .map(([ko, en]) => ({
                INGR_KOR_NAME: ko,
                INGR_ENG_NAME: en,
            }));

        // 2. 인기도 기반 정렬
        localResults.sort((a, b) => {
            const aName = a.INGR_ENG_NAME || '';
            const bName = b.INGR_ENG_NAME || '';
            const aIsPopular = popularIngredients.includes(aName.toUpperCase());
            const bIsPopular = popularIngredients.includes(bName.toUpperCase());
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            return 0;
        });

        const slicedResults = localResults.slice(0, pageSize);

        // 3. 외부 API 검색 (로컬 결과 부족 시)
        if (slicedResults.length >= pageSize) {
            return slicedResults;
        }

        try {
            const url = buildCosmeticsApiUrl(1, pageSize);
            const response = await fetch(url);
            if (response.ok) {
                const data: CosmeticsApiResponse = await response.json();
                const apiItems = data.body?.items?.item || [];

                const combined = [...localResults];
                apiItems.forEach(apiItem => {
                    if (!combined.some(l => l.INGR_ENG_NAME === apiItem.INGR_ENG_NAME)) {
                        combined.push(apiItem);
                    }
                });
                return combined.slice(0, pageSize);
            }
        } catch (apiError) {
            console.warn('External API search failed, returning local results only');
        }

        return localResults;
    } catch (error) {
        console.error('Error searching ingredients:', error);
        return [];
    }
};

/**
 * CAS 번호로 검색 (외부 API 위임)
 */
export const searchIngredientByCasNo = async (
    casNo: string
): Promise<CosmeticsIngredient | null> => {
    try {
        const results = await searchCosmeticsIngredient(casNo, 1);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        return null;
    }
};

export const getCosmeticsIngredientList = async (
    page: number = 1,
    pageSize: number = 10
): Promise<{ ingredients: CosmeticsIngredient[]; totalCount: number }> => {
    const entries = Object.entries(ingredientMappings as Record<string, string>);
    const start = (page - 1) * pageSize;
    const items: CosmeticsIngredient[] = entries
        .slice(start, start + pageSize)
        .map(([ko, en]) => ({ INGR_KOR_NAME: ko, INGR_ENG_NAME: en }));
    return {
        ingredients: items,
        totalCount: entries.length,
    };
};
