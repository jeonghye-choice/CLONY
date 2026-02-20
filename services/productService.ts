import KBEAUTY_PRODUCTS, { RealProduct } from '../data/kbeautyProducts';

// 피부 타입 정의
export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';

// 피부 고민 키워드 매핑
const CONCERN_KEYWORDS: Record<string, string[]> = {
    '모공': ['모공', 'pore', '블랙헤드', 'blackhead'],
    '수분': ['수분', '보습', 'hydration', '건조', 'dry'],
    '트러블': ['트러블', '여드름', 'acne', '진정', 'soothing'],
    '미백': ['미백', '톤', '칙칙', 'brightening', '잡티'],
    '주름': ['주름', '탄력', 'wrinkle', '노화', 'anti-aging'],
    '민감': ['민감', '진정', 'sensitive', 'calming'],
    '피지': ['피지', '유분', 'sebum', 'oil control'],
    '각질': ['각질', 'exfoliation', '피부결'],
};

// 성분 기반 피부 타입 점수 계산
const INGREDIENT_SKIN_TYPE_SCORES: Record<string, Partial<Record<SkinType, number>>> = {
    // 수분/보습 성분
    'hyaluronic acid': { dry: 10, sensitive: 8, normal: 8, combination: 6 },
    'ceramide': { dry: 10, sensitive: 10, normal: 7 },
    'glycerin': { dry: 9, sensitive: 8, normal: 8, combination: 7, oily: 5 },
    'panthenol': { dry: 8, sensitive: 9, normal: 7 },

    // 피지조절/각질 성분
    'salicylic acid': { oily: 10, combination: 9, normal: 5 },
    'bha': { oily: 10, combination: 9 },
    'niacinamide': { oily: 9, combination: 9, normal: 8, sensitive: 6 },
    'tea tree': { oily: 9, combination: 8, sensitive: 7 },

    // 진정 성분
    'centella asiatica': { sensitive: 10, oily: 7, combination: 7, normal: 8 },
    'cica': { sensitive: 10, normal: 8 },
    'madecassoside': { sensitive: 10, normal: 7 },
    'aloe': { sensitive: 9, dry: 7, normal: 7 },

    // 항산화/비타민
    'vitamin c': { normal: 9, combination: 8, oily: 7 },
    'retinol': { oily: 8, combination: 7, normal: 9 },
    'green tea': { oily: 8, combination: 8, sensitive: 7, normal: 8 },

    // 영양/오일 성분
    'squalane': { dry: 9, normal: 8, sensitive: 7 },
    'shea butter': { dry: 10, normal: 6 },
    'jojoba oil': { dry: 9, normal: 7, combination: 5 },

    // 클레이/흡착 성분
    'kaolin': { oily: 9, combination: 8 },
    'volcanic ash': { oily: 10, combination: 8 },
    'charcoal': { oily: 9, combination: 7 },
};

/**
 * 사용자 피부 타입에 맞는 제품을 추천하고 점수를 계산합니다
 */
export function matchProductsToSkinType(
    skinType: SkinType,
    concerns: string[] = [],
    limit: number = 20
): RealProduct[] {
    const scoredProducts = KBEAUTY_PRODUCTS.map(product => {
        let score = 0;

        // 1. 피부 타입 기본 호환성 점수 (최대 40점)
        if (product.suitableForSkinTypes.includes(skinType)) {
            score += 40;

            // 피부 타입이 첫 번째에 있으면 보너스
            if (product.suitableForSkinTypes[0] === skinType) {
                score += 10;
            }
        }

        // 2. 성분 기반 점수 (최대 30점)
        let ingredientScore = 0;
        product.keyIngredients.forEach(ingredient => {
            const ingredientName = ingredient.name.toLowerCase();

            // 성분 점수 테이블에서 매칭
            Object.keys(INGREDIENT_SKIN_TYPE_SCORES).forEach(key => {
                if (ingredientName.includes(key)) {
                    const typeScore = INGREDIENT_SKIN_TYPE_SCORES[key][skinType];
                    if (typeScore) {
                        ingredientScore += typeScore;
                    }
                }
            });

            // 성분이 해당 피부 타입에 좋다고 명시된 경우
            if (ingredient.goodFor.includes(skinType) || ingredient.goodFor.includes('all')) {
                ingredientScore += 5;
            }
        });
        score += Math.min(30, ingredientScore); // 최대 30점

        // 3. 사용자 고민사항 매칭 점수 (최대 30점)
        let concernScore = 0;
        concerns.forEach(userConcern => {
            // 제품의 타겟 고민사항과 직접 매칭
            product.targetConcerns.forEach(productConcern => {
                if (productConcern.includes(userConcern) || userConcern.includes(productConcern)) {
                    concernScore += 10;
                }
            });

            // 키워드 기반 매칭
            Object.keys(CONCERN_KEYWORDS).forEach(concernKey => {
                const keywords = CONCERN_KEYWORDS[concernKey];
                if (keywords.some(kw => userConcern.includes(kw) || kw.includes(userConcern))) {
                    if (product.targetConcerns.some(pc => pc.includes(concernKey))) {
                        concernScore += 5;
                    }
                }
            });
        });
        score += Math.min(30, concernScore); // 최대 30점

        // 점수를 0-100 범위로 정규화
        const normalizedScore = Math.min(100, Math.round(score));

        // 등급 산정
        let grade = 'Good';
        if (normalizedScore >= 90) grade = 'Perfect';
        else if (normalizedScore >= 80) grade = 'Excellent';
        else if (normalizedScore >= 70) grade = 'Great';

        // 분석 메시지 생성
        const analysis = generateAnalysisMessage(product, skinType, concerns);

        return {
            ...product,
            matchScore: normalizedScore,
            matchGrade: grade,
            analysis,
        };
    });

    // 점수순으로 정렬하고 상위 N개 반환
    return scoredProducts
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, limit);
}

/**
 * 제품별 맞춤 분석 메시지 생성
 */
function generateAnalysisMessage(
    product: RealProduct,
    skinType: SkinType,
    concerns: string[]
): string {
    const skinTypeKorean: Record<SkinType, string> = {
        oily: '지성',
        dry: '건성',
        combination: '복합성',
        sensitive: '민감성',
        normal: '정상',
    };

    const mainIngredient = product.keyIngredients[0];
    const mainConcern = product.targetConcerns[0];

    // 피부 타입과 주요 성분을 기반으로 개인화된 메시지 생성
    const messages = [
        `${skinTypeKorean[skinType]} 피부에 ${mainIngredient.name} 성분이 ${mainIngredient.benefits[0]} 효과를 제공합니다.`,
        `${mainConcern} 고민 해결에 특화된 제품으로, ${skinTypeKorean[skinType]} 피부에 안심하고 사용할 수 있습니다.`,
        `${product.keyIngredients.length}가지 핵심 성분이 ${skinTypeKorean[skinType]} 피부의 균형을 맞춰줍니다.`,
    ];

    // 고민사항과 매칭되는 경우 특별 메시지
    if (concerns.length > 0 && product.targetConcerns.some(tc => concerns.some(c => tc.includes(c)))) {
        return `${concerns[0]} 고민에 딱 맞는 ${mainIngredient.name} 성분이 함유되어 효과적으로 케어해줍니다.`;
    }

    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 검색 기능 (기존 로직 유지하면서 실제 데이터 사용)
 */
export function searchProducts(query: string): RealProduct[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase();

    return KBEAUTY_PRODUCTS.filter(product => {
        // 브랜드, 제품명, 태그, 고민사항에서 검색
        return (
            product.brand.toLowerCase().includes(normalizedQuery) ||
            product.name.toLowerCase().includes(normalizedQuery) ||
            product.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
            product.targetConcerns.some(concern => concern.includes(query)) ||
            product.keyIngredients.some(ing => ing.name.toLowerCase().includes(normalizedQuery))
        );
    });
}

/**
 * 특정 피부 타입에 맞는 베스트 제품 가져오기
 */
export function getBestProductsForSkinType(skinType: SkinType, limit: number = 5): RealProduct[] {
    return matchProductsToSkinType(skinType, [], limit);
}

/**
 * 카테고리별 제품 가져오기
 */
export function getProductsByCategory(category: string): RealProduct[] {
    return KBEAUTY_PRODUCTS.filter(product => product.category === category);
}

export default {
    matchProductsToSkinType,
    searchProducts,
    getBestProductsForSkinType,
    getProductsByCategory,
};
