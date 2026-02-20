import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useCart } from '../contexts/CartContext';
import { useProduct, Product } from '../contexts/ProductContext';
import { OCRResultContainer } from './OCRResultContainer';
import { WeatherLocationPicker, CITIES, getWeatherSkinCareAdvice } from './WeatherLocationPicker';
import { API_URL } from '../config/api.config';

interface HomeScreenProps {
    userName: string;
    skinCode: string;
    userScore: number;
    onViewAll: () => void;
    onCartPress: () => void;
    onScanPress?: () => void;
    onViewAnalysis?: () => void;
    onRetakeSurvey?: () => void;
}

// --- Live Trend Mock Data ---
const MOCK_LIVE_TRENDING = [
    {
        id: 'trend_1',
        name: '레드 블레미쉬 클리어 수딩 크림',
        brand: '닥터지',
        matchingScore: 98,
        price: 38000,
        imageUrl: require('../assets/product_images/cream.png'),
        scanCount: 1240,
        action: '진정 성분 분석 중..',
        skinType: 'OSNW',
        keyIngredients: [
            { name: 'Centella Asiatica', nameKo: '시카', benefit: '피부 진정' },
            { name: 'Madecassoside', nameKo: '마데카소사이드', benefit: '장벽 강화' }
        ],
        warnings: ['특이 체질인 경우 성분을 확인하세요.'],
        reviews: "진정 효과가 정말 뛰어나요. 끈적임 없이 흡수되어서 지성 피부에도 부담 없습니다.",
        ingredientComment: "민감성 피부를 위한 진정 성분이 가득해요."
    },
    {
        id: 'trend_2',
        name: '어성초 77 수딩 토너',
        brand: '아누아',
        matchingScore: 95,
        price: 30500,
        imageUrl: require('../assets/product_images/toner.png'),
        scanCount: 856,
        action: '지성 피부 적합도 확인',
        skinType: 'ORPT',
        keyIngredients: [
            { name: 'Houttuynia Cordata', nameKo: '어성초', benefit: '트러블 케어' },
            { name: 'Hyaluronic Acid', nameKo: '히알루론산', benefit: '수분 공급' }
        ],
        warnings: [],
        reviews: "트러블이 많이 들어갔어요. 닦토로 쓰기 딱 좋습니다.",
        ingredientComment: "피지 조절과 수분 공급 밸런스가 좋아요."
    },
    {
        id: 'trend_3',
        name: '1025 독도 토너',
        brand: '라운드랩',
        matchingScore: 92,
        price: 24000,
        imageUrl: require('../assets/product_images/toner.png'),
        scanCount: 643,
        action: '순한 성분 체크 중',
        skinType: 'DRNT',
        keyIngredients: [
            { name: 'Deep Sea Water', nameKo: '해양심층수', benefit: '미네랄 공급' },
            { name: 'Panthenol', nameKo: '판테놀', benefit: '피부 보호' }
        ],
        warnings: ['눈에 들어갔을 때 즉시 씻어내세요.'],
        reviews: "자극 없이 순해서 매일 쓰기 좋아요. 각질 정돈도 되는 것 같아요.",
        ingredientComment: "자극적인 성분이 거의 없는 순한 토너입니다."
    },
    {
        id: 'trend_4',
        name: '어드밴스드 나이트 리페어',
        brand: '에스티로더',
        matchingScore: 88,
        price: 157000,
        imageUrl: null,
        scanCount: 420,
        action: '노화 방지 성분 분석',
        skinType: 'DRNW',
        keyIngredients: [
            { name: 'Bifida Ferment Lysate', nameKo: '비피다 발효 용해물', benefit: '안티에이징' }
        ],
        warnings: [],
        reviews: "비싸지만 확실히 효과가 있어요. 피부결이 달라집니다.",
        ingredientComment: "고기능성 안티에이징 성분이 함유되어 있습니다."
    },
    {
        id: 'trend_5',
        name: '시카플라스트 밤 B5',
        brand: '라로슈포제',
        matchingScore: 90,
        price: 32000,
        imageUrl: null,
        scanCount: 380,
        action: '피부 장벽 강화 확인',
        skinType: 'DSPT',
        keyIngredients: [
            { name: 'Panthenol', nameKo: '판테놀', benefit: '장벽 강화' },
            { name: 'Madecassoside', nameKo: '마데카소사이드', benefit: '손상 케어' }
        ],
        warnings: ['상처가 있는 부위 등에는 사용을 자제하세요.'],
        reviews: "피부 뒤집어졌을 때 바르면 금방 가라앉아요. 필수템입니다.",
        ingredientComment: "손상된 피부 장벽 회복에 최적화된 성분입니다."
    },
    {
        id: 'trend_6',
        name: '다이브인 저분자 히알루론산 세럼',
        brand: '토리든',
        matchingScore: 96,
        price: 22000,
        imageUrl: null,
        scanCount: 1520,
        action: '속보습 충전 완료',
        skinType: 'ORNT',
        keyIngredients: [
            { name: 'Hyaluronic Acid', nameKo: '히알루론산', benefit: '수분 공급' },
            { name: 'Panthenol', nameKo: '판테놀', benefit: '진정' }
        ],
        warnings: [],
        reviews: "속건조 잡는데 최고예요. 끈적임 없어서 좋아요.",
        ingredientComment: "저분자 히알루론산으로 흡수력이 뛰어납니다."
    },
    {
        id: 'trend_7',
        name: '그린티 씨드 히알루론산 세럼',
        brand: '이니스프리',
        matchingScore: 94,
        price: 31000,
        imageUrl: null,
        scanCount: 980,
        action: '수분 밸런스 분석 중',
        skinType: 'OSNT',
        keyIngredients: [
            { name: 'Green Tea Seed', nameKo: '녹차씨', benefit: '항산화' },
            { name: 'Probiotics', nameKo: '프로바이오틱스', benefit: '장벽 보호' }
        ],
        warnings: [],
        reviews: "수분감이 아주 좋아요. 산뜻하게 마무리됩니다.",
        ingredientComment: "피부 수분 통로를 열어주는 역할을 합니다."
    },
    {
        id: 'trend_8',
        name: '퍼스트 케어 액티베이팅 세럼',
        brand: '설화수',
        matchingScore: 89,
        price: 105000,
        imageUrl: null,
        scanCount: 560,
        action: '영양 성분 고농축 확인',
        skinType: 'DRNW',
        keyIngredients: [
            { name: 'Ginseng', nameKo: '인삼', benefit: '활력 부여' },
            { name: 'Peptide', nameKo: '펩타이드', benefit: '탄력 개선' }
        ],
        warnings: [],
        reviews: "피부 결이 정돈되고 다음 단계 흡수가 잘 돼요.",
        ingredientComment: "한방 성분의 조화로 피부 자생력을 높여줍니다."
    },
    {
        id: 'trend_9',
        name: '비타 C 그린티 엔자임 잡티 토닝 세럼',
        brand: '이니스프리',
        matchingScore: 91,
        price: 38000,
        imageUrl: null,
        scanCount: 710,
        action: '잡티 케어 효능 분석',
        skinType: 'OSPW',
        keyIngredients: [
            { name: 'Vitamin C', nameKo: '비타민C', benefit: '미백' },
            { name: 'Green Tea Enzyme', nameKo: '녹차 엔자임', benefit: '각질 케어' }
        ],
        warnings: ['낮 사용 시 선크림을 함께 사용하세요.'],
        reviews: "잡티가 연해지는 게 보여요. 자극적이지 않아서 좋아요.",
        ingredientComment: "미백 성분과 각질 케어 성분이 동시에 작용합니다."
    },
    {
        id: 'trend_10',
        name: '크림 스킨 로션',
        brand: '라네즈',
        matchingScore: 93,
        price: 28000,
        imageUrl: null,
        scanCount: 890,
        action: '고보습 레이어링 체크',
        skinType: 'DRNT',
        keyIngredients: [
            { name: 'White Tea Leaf Water', nameKo: '백차수', benefit: '보습 기능' },
            { name: 'Ceramide', nameKo: '세라마이드', benefit: '장벽 강화' }
        ],
        warnings: [],
        reviews: "하나만 발라도 충분할 정도로 촉촉해요. 겨울철 필수품!",
        ingredientComment: "크림 한 통을 녹여낸 듯한 고보습 스킨입니다."
    }
];

const HomeScreen: React.FC<HomeScreenProps> = ({
    userName,
    skinCode,
    userScore,
    onViewAll,
    onCartPress,
    onScanPress,
    onViewAnalysis,
    onRetakeSurvey,
}) => {
    // --- Dynamic Skin Type Labels ---
    const skinTypeLabels: Record<string, string> = {
        "OSPT": "트러블 유목민 지성",
        "OSNT": "겉은 번들, 속은 예민",
        "OSPW": "자극 약한 어른 지성",
        "OSNW": "예민하고 거친 지성",
        "ORPT": "천하무적 건강 지성",
        "ORNT": "축복받은 꿀광 지성",
        "ORPW": "잡티 고민 튼튼 지성",
        "ORNW": "관리 편한 노화 지성",
        "DSPT": "잡티 많은 민감 건성",
        "DSNT": "수분이 필요한 사막 피부",
        "DSPW": "심술궂은 종합 고민형",
        "DSNW": "주름 깊은 민감 건성",
        "DRPT": "잡티 주의 건강 건성",
        "DRNT": "매끄러운 중건성",
        "DRPW": "잡티/주름 건강 건성",
        "DRNW": "탄력 저하 건강 건성",
    };

    // Helper to get priority care focus based on Baumann
    const getCareFocusChips = (code: string) => {
        const chips: { label: string, emoji: string }[] = [];

        // Priority 1: Sensitivity (S)
        if (code.includes('S')) {
            chips.push({ label: '진정 케어', emoji: '🌿' });
        }

        // Priority 2: Oiliness (O) vs Dryness (D)
        if (code.includes('O')) {
            chips.push({ label: '피지 조절', emoji: '💧' });
        } else {
            chips.push({ label: '수분 공급', emoji: '🐳' });
        }

        // Priority 3: Pigmentation (P)
        if (code.includes('P')) {
            chips.push({ label: '미백 관리', emoji: '✨' });
        }

        // Priority 4: Wrinkle (W)
        if (code.includes('W')) {
            chips.push({ label: '탄력/주름', emoji: '🧬' });
        }

        // Priority 5: Resilience (R) / Tightness (T) / Non-Pigmented (N) - Fillers
        if (chips.length < 3) {
            if (code.includes('R')) chips.push({ label: '장벽 강화', emoji: '🛡️' });
            if (code.includes('T') && !chips.some(c => c.label === '탄력/주름')) chips.push({ label: '탄력 유지', emoji: '🆙' });
            if (code.includes('N') && !chips.some(c => c.label === '미백 관리')) chips.push({ label: '맑은 피부', emoji: '💎' });
        }

        // Fallback for safety
        if (chips.length === 0) {
            return [
                { label: '피지 조절', emoji: '💧' },
                { label: '진정 케어', emoji: '🌿' },
                { label: '미백 관리', emoji: '✨' },
            ];
        }

        return chips;
    };

    const skinDescription = skinTypeLabels[skinCode] || "분석이 필요한 피부";
    const careFocusChips = getCareFocusChips(skinCode);

    const { getItemCount } = useCart();
    const cartItemCount = getItemCount();
    const { recentScans, wishlist, toggleWishlist, isWishlisted, cabinet, addToCabinet, removeRecentScan } = useProduct();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFullList, setShowFullList] = useState(false);
    const [isCabinetSearchModalVisible, setIsCabinetSearchModalVisible] = useState(false);
    const [cabinetSearchQuery, setCabinetSearchQuery] = useState("");
    const [cabinetSearchResults, setCabinetSearchResults] = useState<any[]>([]);
    const [isCabinetSearching, setIsCabinetSearching] = useState(false);

    // 날씨 state
    const [weatherMessage, setWeatherMessage] = useState('날씨 정보를 불러오는 중...');
    const [weatherIcon, setWeatherIcon] = useState<any>('cloud-outline');
    const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
    const [weatherCity, setWeatherCity] = useState('현재 위치');
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    const fetchWeather = async (lat: number, lon: number, cityName: string) => {
        try {
            setIsWeatherLoading(true);
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
            );
            const data = await res.json();
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const { message, icon } = getWeatherSkinCareAdvice(temp, code, cityName);
            setWeatherTemp(temp);
            setWeatherMessage(message);
            setWeatherIcon(icon);
        } catch {
            setWeatherMessage(`${cityName} 날씨 정보를 불러올 수 없어요`);
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const handleSelectCity = async (cityName: string) => {
        setWeatherCity(cityName);
        if (cityName === '현재 위치') {
            // GPS 위치 사용
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setWeatherMessage('위치 권한이 필요합니다');
                setIsWeatherLoading(false);
                return;
            }
            const loc = await ExpoLocation.getCurrentPositionAsync({});
            const geo = await ExpoLocation.reverseGeocodeAsync(loc.coords);
            const name = geo[0]?.city || geo[0]?.district || '현재 위치';
            setWeatherCity(name);
            await fetchWeather(loc.coords.latitude, loc.coords.longitude, name);
        } else {
            const city = CITIES.find(c => c.name === cityName);
            if (city && city.lat && city.lon) {
                await fetchWeather(city.lat, city.lon, cityName);
            }
        }
    };

    // 최초 로드: GPS 자동 감지
    useEffect(() => {
        (async () => {
            try {
                const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await ExpoLocation.getCurrentPositionAsync({});
                    const geo = await ExpoLocation.reverseGeocodeAsync(loc.coords);
                    const name = geo[0]?.city || geo[0]?.district || '현재 위치';
                    setWeatherCity(name);
                    await fetchWeather(loc.coords.latitude, loc.coords.longitude, name);
                } else {
                    // 권한 거부 시 서울 기본
                    setWeatherCity('서울');
                    await fetchWeather(37.5665, 126.9780, '서울');
                }
            } catch {
                setWeatherCity('서울');
                await fetchWeather(37.5665, 126.9780, '서울');
            }
        })();
    }, []);


    // API URL - Centralized in config/api.config.ts

    React.useEffect(() => {
        const fetchRecommendations = async () => {
            // Mock Data for "Real-time" feel
            setRecommendedProducts(MOCK_LIVE_TRENDING);
        };
        fetchRecommendations();
    }, []);

    // Search Handler
    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}/products/search?query=${encodeURIComponent(text)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (e) {
            // Silently handle network errors
        } finally {
            setIsSearching(false);
        }
    };

    // Cabinet Search Handler
    const handleCabinetSearch = async (text: string) => {
        setCabinetSearchQuery(text);
        if (text.length < 2) {
            setCabinetSearchResults([]);
            setIsCabinetSearching(false);
            return;
        }

        setIsCabinetSearching(true);
        try {
            const response = await fetch(`${API_URL}/products/search?query=${encodeURIComponent(text)}`);
            if (response.ok) {
                const data = await response.json();
                setCabinetSearchResults(data);
            }
        } catch (e) {
            // Silently handle
        } finally {
            setIsCabinetSearching(false);
        }
    };

    const addProductToCabinet = (product: any) => {
        addToCabinet({
            id: product.product_id || product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl: product.image || product.imageUrl,
            price: product.price || 0,
            matchingScore: product.matchingScore || 0,
            skinType: product.skinType || 'General',
            keyIngredients: product.ingredients || [],
            warnings: [],
            reviews: ''
        });
        setIsCabinetSearchModalVisible(false);
        setCabinetSearchQuery('');
        setCabinetSearchResults([]);
    };





    const getMatchBadgeColor = (score: number) => {
        if (score >= 95) return 'bg-green-500';
        if (score >= 90) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getImageSource = (product: Product | any) => {
        if (!product.imageUrl) return undefined;
        if (typeof product.imageUrl === 'string') {
            return { uri: product.imageUrl };
        }
        return product.imageUrl; // require(...) result
    };

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 140 }}>
            <View className="flex-row justify-between items-center px-6 pt-14 pb-6 bg-white">
                <Text className="text-2xl font-bold text-clony-primary">Clony</Text>
                <TouchableOpacity onPress={onCartPress} className="relative">
                    <Ionicons name="cart-outline" size={28} color="#374151" />
                    {cartItemCount > 0 && (
                        <View className="absolute -top-2 -right-2 bg-clony-primary rounded-full w-5 h-5 items-center justify-center">
                            <Text className="text-white text-xs font-bold">{cartItemCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View className="px-6 pt-4">
                {/* Weather Section - Icon on the right */}
                <View className="flex-row justify-between items-center mb-6 mt-2">
                    <View className="flex-1 pr-4">
                        {isWeatherLoading ? (
                            <ActivityIndicator size="small" color="#00D182" style={{ marginBottom: 8 }} />
                        ) : (
                            <TouchableOpacity onPress={() => setShowLocationPicker(true)} className="flex-row items-center gap-1 mb-2">
                                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                                <Text className="text-gray-400 text-xs font-bold">{weatherCity} · {weatherTemp !== null ? `${weatherTemp}°C` : '4°C'}</Text>
                                <Ionicons name="chevron-down" size={12} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                        <Text className="text-gray-500 font-bold text-base leading-relaxed">추워요 ❄️ 보습 크림으로 피부 장벽 강화</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowLocationPicker(true)} className="bg-[#FFF5E9] w-16 h-16 rounded-full items-center justify-center">
                        <Ionicons name="snow-outline" size={36} color="#FDBA74" />
                    </TouchableOpacity>
                </View>

                <View className="mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-5">
                        <Text className="text-clony-primary">{userName}님</Text>의 피부 리포트
                    </Text>

                    {/* Compact Skin Type Card */}
                    <TouchableOpacity
                        onPress={onViewAnalysis}
                        className="bg-[#EEF6FF] rounded-[30px] rounded-tl-[80px] rounded-br-[80px] px-10 py-5 mb-5 relative overflow-hidden border border-[#D5E6F7] shadow-sm shadow-blue-100/30"
                    >
                        <View className="flex-1 z-10">
                            {/* Skin Code Badge */}
                            <View className="bg-white self-start px-5 py-1.5 rounded-full mb-2 border border-[#E8F2FB]">
                                <Text className="text-[#64748B] text-sm font-bold">#{skinCode}</Text>
                            </View>

                            {/* Main Title */}
                            <Text className="text-[26px] font-bold text-[#1F2937] mb-2 tracking-tight leading-tight">
                                {skinDescription}
                            </Text>

                            {/* View Detail Link */}
                            <Text className="text-[#00D182] font-semibold text-[16px]">자세히 보기</Text>
                        </View>

                        {/* Background Sparkles (Layered for varying outline thickness) */}
                        <View className="absolute right-[-15] top-0 opacity-60">
                            {/* 1. Underlying light outline for all stars (Thin feel) */}
                            <Ionicons name="sparkles-outline" size={160} color="#7FB5FF" style={{ position: 'absolute' }} />

                            {/* 2. Extra dark stroke specifically for the big star's depth (Thicker feel) */}
                            <Ionicons name="sparkles-outline" size={161} color="#3182CE" style={{ position: 'absolute', opacity: 0.4 }} />

                            {/* 3. Main white fill */}
                            <Ionicons name="sparkles" size={160} color="white" />
                        </View>
                    </TouchableOpacity>

                    {/* Scrollable Care Focus Chips - Minimalist & Compact */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="-mx-6 mb-5"
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
                    >
                        {careFocusChips.map((chip, idx) => (
                            <View key={idx} className="bg-white px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-sm border border-gray-50 justify-center">
                                <Text className="text-[13px] text-[#4A5568] font-bold">{chip.label}</Text>
                                <Text className="text-sm">{chip.emoji}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Compact Scan Card */}
                    <TouchableOpacity
                        onPress={onScanPress}
                        className="bg-[#111827] rounded-[36px] px-7 py-5 flex-row items-center justify-between shadow-2xl shadow-black"
                    >
                        <View className="flex-1">
                            <Text className="text-[#00D182] font-bold text-xs mb-1">AI 성분 분석</Text>
                            <Text className="text-white font-bold text-xl mb-0.5 tracking-tight">새로운 화장품 스캔하기</Text>
                            <Text className="text-gray-400 text-xs">카메라로 성분표를 찍어보세요</Text>
                        </View>
                        <View className="w-14 h-14 bg-[#00D182] rounded-full items-center justify-center">
                            <Ionicons name="scan-outline" size={28} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900">
                            최근 <Text className="text-clony-primary">스캔한 제품</Text>
                        </Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                        <View className="flex-row gap-3">
                            {recentScans.length === 0 ? (
                                <View className="flex-1 py-10 items-center justify-center">
                                    <Text className="text-gray-400 text-lg">아직 스캔한 제품이 없습니다.</Text>
                                </View>
                            ) : (
                                recentScans.map((product: Product) => (
                                    <TouchableOpacity
                                        key={product.id}
                                        onPress={() => setSelectedProduct(product)}
                                        className="w-40 bg-white rounded-2xl p-3 border border-gray-100 relative"
                                    >
                                        {/* Delete Button */}
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                removeRecentScan(product.id);
                                            }}
                                            className="absolute top-2 right-2 z-20 bg-black/5 rounded-full p-1"
                                        >
                                            <Ionicons name="close" size={14} color="#9CA3AF" />
                                        </TouchableOpacity>

                                        <Image
                                            source={typeof product.imageUrl === 'string' ? { uri: product.imageUrl } : product.imageUrl}
                                            className="w-full h-32 rounded-xl bg-gray-50 mb-2"
                                            resizeMode="contain"
                                        />
                                        <View className={`${getMatchBadgeColor(product.matchingScore)} self-start px-2 py-0.5 rounded-md mb-2`}>
                                            <Text className="text-white text-[10px] font-bold">{product.matchingScore}% 일치</Text>
                                        </View>
                                        <Text className="text-[10px] text-gray-400 mb-1">{product.brand}</Text>
                                        <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                                            {product.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </ScrollView>
                </View>


                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl font-bold text-gray-900">실시간 <Text className="text-clony-primary">분석 TOP 10</Text></Text>
                            <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center gap-1 shadow-sm">
                                <View className="w-1.5 h-1.5 bg-white rounded-full" />
                                <Text className="text-white text-[10px] font-bold">LIVE</Text>
                            </View>
                        </View>
                        <Text className="text-xs text-gray-400 font-bold">1,240명 접속 중</Text>
                    </View>

                    {/* Skeleton Loading State */}
                    {recommendedProducts.length > 0 ? (
                        recommendedProducts.slice(0, 3).map((product: Product, index: number) => (
                            <TouchableOpacity
                                key={product.id}
                                className="bg-white rounded-[20px] p-5 mb-3 border border-gray-100 shadow-sm flex-row items-center"
                                onPress={() => setSelectedProduct(product)}
                            >
                                {/* Ranking Badge */}
                                <Text className={`text-lg font-black w-8 text-center mr-2 text-gray-900`}>{index + 1}</Text>

                                {getImageSource(product) ? (
                                    <Image
                                        source={getImageSource(product)}
                                        className="w-14 h-14 rounded-xl bg-gray-50 mr-4"
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View className="w-14 h-14 rounded-xl bg-gray-100 mr-4 items-center justify-center">
                                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                                    </View>
                                )}

                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-xs text-gray-400 mb-0.5">{product.brand}</Text>
                                        <View className="bg-red-50 px-1.5 py-0.5 rounded flex-row items-center gap-1">
                                            <Ionicons name="people" size={10} color="#EF4444" />
                                            <Text className="text-[9px] text-red-500 font-bold">{(product as any).scanCount || 100}명</Text>
                                        </View>
                                    </View>

                                    <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={1}>
                                        {product.name}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <View className={`${getMatchBadgeColor(product.matchingScore)} px-1.5 py-0.5 rounded mr-2`}>
                                            <Text className="text-white text-[10px] font-bold">{product.matchingScore}%</Text>
                                        </View>
                                        <Text className="text-xs text-clony-primary font-bold" numberOfLines={1}>{(product as any).action || '성분 분석 중..'}</Text>
                                    </View>
                                </View>
                                {/* Wishlist Toggle */}
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                    }}
                                    className="p-2 -mr-1"
                                >
                                    <Ionicons
                                        name={isWishlisted(product.id || (product as any).product_id) ? "heart" : "heart-outline"}
                                        size={22}
                                        color={isWishlisted(product.id || (product as any).product_id) ? "#FF4757" : "#D1D5DB"}
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="gap-3">
                            {[1, 2, 3].map((i) => (
                                <View key={i} className="flex-row items-center bg-white p-5 rounded-[20px] border border-gray-100">
                                    <View className="w-8 h-6 bg-gray-200 rounded-md mr-2 opacity-50" />
                                    <View className="w-14 h-14 bg-gray-200 rounded-xl mr-4 opacity-50" />
                                    <View className="flex-1 gap-2">
                                        <View className="w-20 h-3 bg-gray-200 rounded opacity-50" />
                                        <View className="w-40 h-5 bg-gray-200 rounded opacity-50" />
                                        <View className="flex-row gap-2">
                                            <View className="w-10 h-4 bg-gray-200 rounded opacity-50" />
                                            <View className="w-16 h-4 bg-gray-200 rounded opacity-50" />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* View More Button - Opens Modal */}
                    <TouchableOpacity
                        onPress={() => setShowFullList(true)}
                        className="self-center py-3 px-6 mt-1"
                    >
                        <Text className="text-gray-400 text-sm font-medium">인기 화장품 더보기 {'>'}</Text>
                    </TouchableOpacity>
                </View>

                {/* 내 화장대 미리보기 */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="albums" size={20} color="#00D182" />
                            <Text className="text-xl font-bold text-gray-900">내 화장대</Text>
                        </View>
                        <TouchableOpacity onPress={onViewAll}>
                            <Text className="text-xs text-gray-400">전체보기 {'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-3">
                        <View className="flex-row gap-3">
                            {cabinet.slice(0, 5).map((product) => (
                                <TouchableOpacity
                                    key={product.id}
                                    onPress={() => {
                                        setSelectedProduct(product);
                                        // Detail modal might be needed here or just navigation
                                    }}
                                    className="w-24 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                                >
                                    <View className="w-full h-16 mb-2 items-center justify-center overflow-hidden">
                                        {getImageSource(product) ? (
                                            <Image source={getImageSource(product)} className="w-full h-full" resizeMode="contain" />
                                        ) : (
                                            <Ionicons name="image-outline" size={32} color="#E5E7EB" />
                                        )}
                                    </View>
                                    <Text className="text-xs text-gray-900 font-bold" numberOfLines={1}>{product.name}</Text>
                                    <Text className="text-[10px] text-gray-400" numberOfLines={1}>{product.brand}</Text>
                                    <View className="bg-green-50 px-1.5 py-0.5 rounded mt-1">
                                        <Text className="text-[9px] text-green-600 font-bold">안심 사용</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => setIsCabinetSearchModalVisible(true)}
                                className="w-24 bg-gray-50 p-3 rounded-xl border-2 border-dashed border-gray-200 items-center justify-center"
                            >
                                <Ionicons name="search" size={24} color="#9CA3AF" />
                                <Text className="text-[10px] text-gray-400 mt-1">검색 추가</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View className="flex-row gap-2">
                        <View className="flex-1 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                            <Text className="text-xs text-gray-500">총 제품</Text>
                            <Text className="text-lg font-bold text-gray-900">{cabinet.length}<Text className="text-sm font-normal text-gray-500">개</Text></Text>
                        </View>
                        <View className="flex-1 bg-red-50 border border-red-100 p-3 rounded-xl">
                            <Text className="text-xs text-red-500">만료 임박</Text>
                            <Text className="text-lg font-bold text-red-600">0<Text className="text-sm font-normal text-red-400">개</Text></Text>
                        </View>
                    </View>
                </View>
            </View>



            {/* Product Detail Modal */}
            <Modal
                visible={!!selectedProduct}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedProduct(null)}
            >
                {selectedProduct && (
                    <OCRResultContainer
                        product={selectedProduct}
                        onAddToCart={() => {
                            setSelectedProduct(null);
                            onCartPress(); // Go to cart or just close? User plan said "show feedback". For now, just close or go to cart context.
                            // Actually, let's keep it simple: Close
                        }}
                        onClose={() => setSelectedProduct(null)}
                        onCartPress={() => {
                            setSelectedProduct(null);
                            onCartPress();
                        }}
                    />
                )}
            </Modal>

            {/* Full Screen Product List Modal */}
            <Modal
                visible={showFullList}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFullList(false)}
            >
                <View className="flex-1 bg-white pt-6">
                    {/* Header */}
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 mb-6">
                        <View>
                            <Text className="text-2xl font-bold text-gray-900">실시간 분석 TOP 10</Text>
                            <Text className="text-gray-500 text-sm">지금 다른 사용자들이 궁금해하는 제품</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowFullList(false)}>
                            <Ionicons name="close" size={28} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    {/* Product List */}
                    <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
                        {recommendedProducts.slice(0, 10).map((product: Product, index: number) => (
                            <TouchableOpacity
                                key={product.id}
                                className="bg-white rounded-[20px] p-5 mb-3 border border-gray-100 shadow-sm flex-row items-center"
                                onPress={() => setSelectedProduct(product)}
                            >
                                {/* Ranking Badge */}
                                <Text className={`text-lg font-black w-8 text-center mr-2 ${index < 3 ? 'text-gray-900' : 'text-gray-300'}`}>{index + 1}</Text>

                                {getImageSource(product) ? (
                                    <Image
                                        source={getImageSource(product)}
                                        className="w-14 h-14 rounded-xl bg-gray-50 mr-4"
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View className="w-14 h-14 rounded-xl bg-gray-100 mr-4 items-center justify-center">
                                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                                    </View>
                                )}

                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400 mb-0.5">{product.brand}</Text>
                                    <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={1}>
                                        {product.name}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <View className={`${getMatchBadgeColor(product.matchingScore)} px-1.5 py-0.5 rounded mr-2`}>
                                            <Text className="text-white text-[10px] font-bold">{product.matchingScore}%</Text>
                                        </View>
                                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                                            {product.keyIngredients && product.keyIngredients[0]
                                                ? (typeof product.keyIngredients[0] === 'string'
                                                    ? product.keyIngredients[0]
                                                    : (product.keyIngredients[0].nameKo || product.keyIngredients[0].name))
                                                : '맞춤 추천'}
                                        </Text>
                                    </View>
                                </View>
                                {/* Wishlist Toggle in Trend Modal */}
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(product);
                                    }}
                                    className="p-2"
                                >
                                    <Ionicons
                                        name={isWishlisted(product.id || (product as any).product_id) ? "heart" : "heart-outline"}
                                        size={22}
                                        color={isWishlisted(product.id || (product as any).product_id) ? "#FF4757" : "#D1D5DB"}
                                    />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>


            <WeatherLocationPicker
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onSelectCity={handleSelectCity}
                selectedCity={weatherCity}
            />

            {/* Cabinet Search Modal */}
            <Modal
                visible={isCabinetSearchModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsCabinetSearchModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl h-[80%] pt-4">
                        <View className="px-6 flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-900">내 화장대에 추가</Text>
                            <TouchableOpacity onPress={() => setIsCabinetSearchModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <View className="px-6 mb-4">
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                <Ionicons name="search" size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-2 text-base"
                                    placeholder="브랜드나 제품명을 입력하세요"
                                    value={cabinetSearchQuery}
                                    onChangeText={handleCabinetSearch}
                                    autoFocus={true}
                                />
                                {isCabinetSearching && <ActivityIndicator size="small" color="#00D182" />}
                            </View>
                        </View>

                        <ScrollView className="px-6">
                            {cabinetSearchResults.length > 0 ? (
                                cabinetSearchResults.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => addProductToCabinet(item)}
                                        className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm"
                                    >
                                        <View className="w-14 h-14 bg-gray-50 rounded-lg mr-4 items-center justify-center overflow-hidden">
                                            {getImageSource(item) ? (
                                                <Image source={getImageSource(item)} className="w-10 h-10" resizeMode="contain" />
                                            ) : (
                                                <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-xs text-gray-400 mb-1">{item.brand}</Text>
                                            <Text className="text-sm font-bold text-gray-900">{item.name}</Text>
                                        </View>
                                        <Ionicons name="add-circle" size={24} color="#00D182" />
                                    </TouchableOpacity>
                                ))
                            ) : cabinetSearchQuery.length > 1 ? (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">검색 결과가 없습니다.</Text>
                                </View>
                            ) : (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">찾으시는 제품을 입력해 보세요.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

export default HomeScreen;
