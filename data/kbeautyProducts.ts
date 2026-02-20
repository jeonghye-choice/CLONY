// 실제 K-beauty 제품 데이터 (성분 정보 포함)
// 데이터 출처: 각 브랜드 공식 웹사이트 및 오픈 소스 화장품 DB

export interface ProductIngredient {
    name: string;
    benefits: string[];
    goodFor: string[]; // skin types/concerns
}

export interface RealProduct {
    id: number;
    brand: string;
    name: string;
    category: string;
    tags: string[];
    image: string;

    // Real ingredient data
    keyIngredients: ProductIngredient[];
    fullIngredientList?: string[];

    // Skin type compatibility (based on ingredients)
    suitableForSkinTypes: ('oily' | 'dry' | 'combination' | 'sensitive' | 'normal')[];
    targetConcerns: string[];

    // For matching algorithm
    matchScore?: number;
    matchGrade?: string;
    analysis?: string;
}

// 실제 K-beauty 제품 데이터베이스
export const KBEAUTY_PRODUCTS: RealProduct[] = [
    // COSRX 브랜드
    {
        id: 1,
        brand: 'COSRX',
        name: 'Advanced Snail 96 Mucin Power Essence',
        category: '에센스',
        tags: ['수분', '피부재생', '베스트셀러'],
        image: '🐌',
        keyIngredients: [
            {
                name: 'Snail Secretion Filtrate (96%)',
                benefits: ['보습', '피부 재생', '탄력'],
                goodFor: ['dry', 'combination', 'sensitive', 'normal']
            }
        ],
        suitableForSkinTypes: ['dry', 'combination', 'sensitive', 'normal'],
        targetConcerns: ['건조', '수분부족', '피부결', '민감'],
    },
    {
        id: 2,
        brand: 'COSRX',
        name: 'BHA Blackhead Power Liquid',
        category: '각질제거',
        tags: ['BHA', '블랙헤드', '모공'],
        image: '💧',
        keyIngredients: [
            {
                name: 'Betaine Salicylate (BHA)',
                benefits: ['각질제거', '모공청소', '피지조절'],
                goodFor: ['oily', 'combination']
            },
            {
                name: 'Willow Bark Water',
                benefits: ['진정', '항염'],
                goodFor: ['oily', 'combination', 'sensitive']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination'],
        targetConcerns: ['블랙헤드', '모공', '피지', '각질'],
    },
    {
        id: 3,
        brand: 'COSRX',
        name: 'Low pH Good Morning Gel Cleanser',
        category: '클렌저',
        tags: ['약산성', '순한클렌징', '데일리'],
        image: '🧼',
        keyIngredients: [
            {
                name: 'Tea Tree Oil',
                benefits: ['진정', '항균', '피지조절'],
                goodFor: ['oily', 'combination', 'sensitive']
            },
            {
                name: 'BHA',
                benefits: ['각질제거', '모공케어'],
                goodFor: ['oily', 'combination']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'normal', 'sensitive'],
        targetConcerns: ['피지', '모공', '트러블'],
    },

    // Anua 브랜드
    {
        id: 4,
        brand: 'Anua',
        name: 'Heartleaf 77% Soothing Toner',
        category: '토너',
        tags: ['진정', '어성초', '민감성'],
        image: '🌿',
        keyIngredients: [
            {
                name: 'Houttuynia Cordata Extract (77%)',
                benefits: ['진정', '항염', '수분'],
                goodFor: ['sensitive', 'oily', 'combination', 'normal']
            }
        ],
        suitableForSkinTypes: ['sensitive', 'oily', 'combination', 'normal'],
        targetConcerns: ['민감', '트러블', '홍조', '진정'],
    },
    {
        id: 5,
        brand: 'Anua',
        name: 'Peach 77% Niacin Essence Toner',
        category: '토너',
        tags: ['미백', '나이아신아마이드', '모공'],
        image: '🍑',
        keyIngredients: [
            {
                name: 'Peach Extract (77%)',
                benefits: ['보습', '비타민', '피부결'],
                goodFor: ['dry', 'combination', 'normal']
            },
            {
                name: 'Niacinamide',
                benefits: ['미백', '모공축소', '피지조절'],
                goodFor: ['oily', 'combination', 'normal']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'dry', 'normal'],
        targetConcerns: ['모공', '피부톤', '칙칙함', '수분'],
    },

    // VT Cosmetics 브랜드
    {
        id: 6,
        brand: 'VT',
        name: 'Reedle Shot 100 Essence',
        category: '에센스',
        tags: ['시카', '모공', '품절대란'],
        image: '💉',
        keyIngredients: [
            {
                name: 'Cica Reedle (Silica)',
                benefits: ['흡수촉진', '각질케어', '피부결'],
                goodFor: ['oily', 'combination', 'normal']
            },
            {
                name: 'Centella Asiatica Extract',
                benefits: ['진정', '재생', '항염'],
                goodFor: ['sensitive', 'oily', 'combination', 'normal']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'normal'],
        targetConcerns: ['모공', '피부결', '흡수력'],
    },
    {
        id: 7,
        brand: 'VT',
        name: 'Cica Sleeping Mask',
        category: '마스크팩',
        tags: ['시카', '수면팩', '진정'],
        image: '😴',
        keyIngredients: [
            {
                name: 'Centella Asiatica Extract',
                benefits: ['진정', '재생', '보습'],
                goodFor: ['sensitive', 'dry', 'combination', 'normal']
            },
            {
                name: 'Madecassoside',
                benefits: ['진정', '항염', '피부보호'],
                goodFor: ['sensitive', 'all']
            }
        ],
        suitableForSkinTypes: ['sensitive', 'dry', 'combination', 'normal'],
        targetConcerns: ['민감', '건조', '진정', '수분'],
    },

    // TIRTIR 브랜드
    {
        id: 8,
        brand: 'TIRTIR',
        name: 'Mask Fit Red Cushion',
        category: '메이크업',
        tags: ['쿠션', '커버력', '지속력'],
        image: '💄',
        keyIngredients: [
            {
                name: 'Niacinamide',
                benefits: ['미백', '피부톤개선'],
                goodFor: ['all']
            },
            {
                name: 'Hyaluronic Acid',
                benefits: ['보습', '수분'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'normal'],
        targetConcerns: ['커버', '피부톤', '지속력'],
    },

    // Dear Klairs 브랜드
    {
        id: 9,
        brand: 'Dear Klairs',
        name: 'Supple Preparation Facial Toner',
        category: '토너',
        tags: ['보습', '순한토너', '민감성'],
        image: '💙',
        keyIngredients: [
            {
                name: 'Hyaluronic Acid',
                benefits: ['보습', '수분충전'],
                goodFor: ['dry', 'sensitive', 'combination', 'normal']
            },
            {
                name: 'Beta-Glucan',
                benefits: ['진정', '보습', '민감피부'],
                goodFor: ['sensitive', 'dry', 'normal']
            }
        ],
        suitableForSkinTypes: ['dry', 'sensitive', 'combination', 'normal'],
        targetConcerns: ['건조', '민감', '수분'],
    },
    {
        id: 10,
        brand: 'Dear Klairs',
        name: 'Freshly Juiced Vitamin Drop',
        category: '세럼',
        tags: ['비타민C', '미백', '항산화'],
        image: '🍊',
        keyIngredients: [
            {
                name: 'Ascorbic Acid (Vitamin C, 5%)',
                benefits: ['미백', '항산화', '피부톤'],
                goodFor: ['normal', 'combination', 'oily']
            },
            {
                name: 'Centella Asiatica Extract',
                benefits: ['진정', '항염'],
                goodFor: ['sensitive', 'all']
            }
        ],
        suitableForSkinTypes: ['normal', 'combination', 'oily', 'sensitive'],
        targetConcerns: ['칙칙함', '피부톤', '잡티'],
    },

    // Round Lab 브랜드
    {
        id: 11,
        brand: '라운드랩',
        name: '1025 독도 토너',
        category: '토너',
        tags: ['각질', '저자극', '데일리'],
        image: '⛰️',
        keyIngredients: [
            {
                name: 'Ulleungdo Deep Sea Water',
                benefits: ['미네랄', '보습', '진정'],
                goodFor: ['sensitive', 'all']
            },
            {
                name: 'Panthenol',
                benefits: ['진정', '보습', '피부장벽'],
                goodFor: ['sensitive', 'dry', 'normal']
            }
        ],
        suitableForSkinTypes: ['sensitive', 'oily', 'combination', 'dry', 'normal'],
        targetConcerns: ['각질', '민감', '수분'],
    },
    {
        id: 12,
        brand: '라운드랩',
        name: '자작나무 수분 선크림 SPF50+',
        category: '선크림',
        tags: ['자외선차단', '수분', '올영1위'],
        image: '☀️',
        keyIngredients: [
            {
                name: 'Birch Tree Sap',
                benefits: ['수분', '진정', '미네랄'],
                goodFor: ['dry', 'sensitive', 'combination', 'normal']
            },
            {
                name: 'Hyaluronic Acid',
                benefits: ['보습', '수분'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['dry', 'sensitive', 'combination', 'normal'],
        targetConcerns: ['자외선', '수분', '건조'],
    },

    // Innisfree 브랜드
    {
        id: 13,
        brand: 'Innisfree',
        name: '제주 화산송이 모공 클렌징 폼',
        category: '클렌저',
        tags: ['모공', '피지', '클렌징'],
        image: '🌋',
        keyIngredients: [
            {
                name: 'Jeju Volcanic Scoria',
                benefits: ['피지흡착', '모공케어', '각질제거'],
                goodFor: ['oily', 'combination']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination'],
        targetConcerns: ['모공', '피지', '블랙헤드'],
    },
    {
        id: 14,
        brand: 'Innisfree',
        name: '그린티 씨드 세럼',
        category: '세럼',
        tags: ['녹차', '항산화', '수분'],
        image: '🍵',
        keyIngredients: [
            {
                name: 'Green Tea Extract (Jeju)',
                benefits: ['항산화', '보습', '진정'],
                goodFor: ['all']
            },
            {
                name: 'Green Tea Seed Oil',
                benefits: ['영양', '수분', '피부결'],
                goodFor: ['dry', 'normal', 'combination']
            }
        ],
        suitableForSkinTypes: ['dry', 'normal', 'combination', 'sensitive'],
        targetConcerns: ['건조', '수분', '피부결'],
    },

    // Dr.Jart+ 브랜드
    {
        id: 15,
        brand: 'Dr.Jart+',
        name: 'Cicapair Tiger Grass Color Correcting Treatment',
        category: 'BB크림',
        tags: ['시카', '색보정', '진정'],
        image: '🐯',
        keyIngredients: [
            {
                name: 'Centella Asiatica (Tiger Grass)',
                benefits: ['진정', '홍조완화', '민감피부'],
                goodFor: ['sensitive', 'combination', 'normal']
            }
        ],
        suitableForSkinTypes: ['sensitive', 'combination', 'normal'],
        targetConcerns: ['홍조', '민감', '커버'],
    },
    {
        id: 16,
        brand: 'Dr.Jart+',
        name: 'Ceramidin Cream',
        category: '크림',
        tags: ['세라마이드', '장벽강화', '수분'],
        image: '🛡️',
        keyIngredients: [
            {
                name: 'Ceramide',
                benefits: ['피부장벽', '보습', '수분보호'],
                goodFor: ['dry', 'sensitive', 'normal']
            },
            {
                name: '5-Cera Complex',
                benefits: ['장벽강화', '수분', '진정'],
                goodFor: ['dry', 'sensitive']
            }
        ],
        suitableForSkinTypes: ['dry', 'sensitive', 'normal'],
        targetConcerns: ['건조', '민감', '장벽약화'],
    },

    // Some By Mi 브랜드
    {
        id: 17,
        brand: 'Some By Mi',
        name: 'AHA BHA PHA 30 Days Miracle Toner',
        category: '토너',
        tags: ['각질', '트러블', '복합산'],
        image: '✨',
        keyIngredients: [
            {
                name: 'AHA, BHA, PHA',
                benefits: ['각질제거', '모공케어', '피부결'],
                goodFor: ['oily', 'combination']
            },
            {
                name: 'Tea Tree Leaf Water (10,000ppm)',
                benefits: ['진정', '항균', '트러블'],
                goodFor: ['oily', 'combination', 'sensitive']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination'],
        targetConcerns: ['트러블', '각질', '모공', '피부결'],
    },
    {
        id: 18,
        brand: 'Some By Mi',
        name: 'Retinol Intense Reactivating Serum',
        category: '세럼',
        tags: ['레티놀', '주름', '탄력'],
        image: '🔄',
        keyIngredients: [
            {
                name: 'Retinol (0.1%)',
                benefits: ['주름개선', '탄력', '피부재생'],
                goodFor: ['normal', 'combination', 'oily']
            },
            {
                name: 'Truecica™',
                benefits: ['진정', '자극완화'],
                goodFor: ['sensitive', 'all']
            }
        ],
        suitableForSkinTypes: ['normal', 'combination', 'oily'],
        targetConcerns: ['주름', '탄력', '노화'],
    },

    // Laneige 브랜드
    {
        id: 19,
        brand: 'Laneige',
        name: 'Water Sleeping Mask',
        category: '마스크팩',
        tags: ['수면팩', '수분', '베스트셀러'],
        image: '💤',
        keyIngredients: [
            {
                name: 'Hydro Ionized Mineral Water',
                benefits: ['수분충전', '보습', '피부결'],
                goodFor: ['dry', 'normal', 'combination']
            },
            {
                name: 'Hunza Apricot & Evening Primrose',
                benefits: ['영양', '피부정화', '광채'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['dry', 'normal', 'combination', 'sensitive'],
        targetConcerns: ['건조', '수분', '피부결'],
    },
    {
        id: 20,
        brand: 'Laneige',
        name: 'Lip Sleeping Mask',
        category: '립케어',
        tags: ['입술', '각질', '나이트케어'],
        image: '👄',
        keyIngredients: [
            {
                name: 'Berry Mix Complex',
                benefits: ['항산화', '영양', '보습'],
                goodFor: ['all']
            },
            {
                name: 'Hyaluronic Acid',
                benefits: ['수분', '탱탱함'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['dry', 'normal', 'combination', 'sensitive', 'oily'],
        targetConcerns: ['입술각질', '입술건조', '입술보습'],
    },

    // Beauty of Joseon 브랜드
    {
        id: 21,
        brand: 'Beauty of Joseon',
        name: 'Dynasty Cream',
        category: '크림',
        tags: ['한방', '영양', '고보습'],
        image: '👑',
        keyIngredients: [
            {
                name: 'Rice Bran Water',
                benefits: ['영양', '미백', '보습'],
                goodFor: ['dry', 'normal', 'combination']
            },
            {
                name: 'Ginseng Water',
                benefits: ['항산화', '탄력', '영양'],
                goodFor: ['dry', 'normal']
            }
        ],
        suitableForSkinTypes: ['dry', 'normal', 'combination'],
        targetConcerns: ['건조', '영양', '탄력'],
    },
    {
        id: 22,
        brand: 'Beauty of Joseon',
        name: 'Relief Sun: Rice + Probiotics SPF50+',
        category: '선크림',
        tags: ['자외선차단', '쌀', '프로바이오틱스'],
        image: '🌞',
        keyIngredients: [
            {
                name: 'Rice Extract (30%)',
                benefits: ['보습', '진정', '영양'],
                goodFor: ['dry', 'sensitive', 'normal']
            },
            {
                name: 'Grain Fermented Extracts',
                benefits: ['항산화', '피부결'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['dry', 'sensitive', 'normal', 'combination'],
        targetConcerns: ['자외선', '수분', '민감'],
    },

    // Isntree 브랜드
    {
        id: 23,
        brand: 'Isntree',
        name: 'Hyaluronic Acid Watery Sun Gel SPF50+',
        category: '선크림',
        tags: ['히알루론산', '수분선크림', '젤타입'],
        image: '💎',
        keyIngredients: [
            {
                name: 'Hyaluronic Acid (8 types)',
                benefits: ['수분', '보습', '진정'],
                goodFor: ['all']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'normal', 'sensitive'],
        targetConcerns: ['자외선', '수분', '번들거림없이'],
    },
    {
        id: 24,
        brand: 'Isntree',
        name: 'Green Tea Fresh Toner',
        category: '토너',
        tags: ['녹차', '진정', '수분'],
        image: '🍃',
        keyIngredients: [
            {
                name: 'Green Tea Extract (80%)',
                benefits: ['항산화', '진정', '수분'],
                goodFor: ['all']
            },
            {
                name: 'Centella Asiatica',
                benefits: ['진정', '민감피부'],
                goodFor: ['sensitive', 'all']
            }
        ],
        suitableForSkinTypes: ['oily', 'combination', 'sensitive', 'normal'],
        targetConcerns: ['진정', '수분', '민감'],
    },

    // Torriden 브랜드
    {
        id: 25,
        brand: 'Torriden',
        name: 'DIVE-IN Low Molecular Hyaluronic Acid Serum',
        category: '세럼',
        tags: ['저분자', '히알루론산', '수분'],
        image: '🌊',
        keyIngredients: [
            {
                name: 'Low Molecular Hyaluronic Acid (5D)',
                benefits: ['깊은수분', '흡수력', '보습'],
                goodFor: ['all']
            },
            {
                name: 'D-Panthenol',
                benefits: ['진정', '수분', '장벽강화'],
                goodFor: ['sensitive', 'all']
            }
        ],
        suitableForSkinTypes: ['dry', 'oily', 'combination', 'normal', 'sensitive'],
        targetConcerns: ['건조', '수분부족', '속건조'],
    },
];

export default KBEAUTY_PRODUCTS;
