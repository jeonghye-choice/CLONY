import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Animated, SafeAreaView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InteractiveMap from '../components/InteractiveMap';
import { useCart } from '../contexts/CartContext';
import { useProduct, Product } from '../contexts/ProductContext';
import { OCRResultContainer } from '../components/OCRResultContainer';
import { API_URL } from '../config/api.config';
import { getNearbyStores, Store, isStoreOpen } from '../services/dutyFreeService';

interface HomeScreenProps {
    userName: string;
    skinCode: string;
    userScore: number;
    selectedCountry?: string;
    onViewAll: () => void;
    onCartPress: () => void;
    onViewAnalysis?: () => void;
    onRetakeSurvey?: () => void;
    onScanPress: () => void;
}

import trendingData from '../database/products/trending.json';

const HomeScreen: React.FC<HomeScreenProps> = ({
    userName,
    skinCode,
    userScore,
    selectedCountry,
    onViewAll,
    onCartPress,
    onScanPress,
    onViewAnalysis,
    onRetakeSurvey
}) => {
    const { t, i18n } = useTranslation();

    // --- Live Trend Data from database ---
    const MOCK_LIVE_TRENDING = trendingData.live_trending.map(item => ({
        ...item,
        name: t(`home.live_trend_items.${item.id}.name`),
        action: t(`home.live_trend_items.${item.id}.action`),
        warnings: [t(`home.live_trend_items.${item.id}.warning`)],
        reviews: t(`home.live_trend_items.${item.id}.review`),
        ingredientComment: t(`home.live_trend_items.${item.id}.comment`),
        // Handle local image adjustment if needed, but for now assuming require logic is complex in JSON
        imageUrl: item.id === 'trend_1' ? require('../assets/product_images/cream.png') :
            (item.id === 'trend_2' || item.id === 'trend_3') ? require('../assets/product_images/toner.png') : null
    }));


    const isKorean = i18n.language === 'ko';

    // --- Animation Values ---
    const reportScale = new Animated.Value(1);
    const scanScale = new Animated.Value(1);

    const handlePressIn = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 1.03,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10
        }).start();
    };

    const handlePressOut = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10
        }).start();
    };

    // Helper to get priority care focus based on Baumann
    const getCareFocusChips = (code: string) => {
        const chips: { label: string, emoji: string }[] = [];

        // Priority 1: Sensitivity (S)
        if (code.includes('S')) {
            chips.push({ label: t('home.care_focus.soothing'), emoji: '🌿' });
        }

        // Priority 2: Oiliness (O) vs Dryness (D)
        if (code.includes('O')) {
            chips.push({ label: t('home.care_focus.sebum'), emoji: '💧' });
        } else {
            chips.push({ label: t('home.care_focus.hydration'), emoji: '🐳' });
        }

        // Priority 3: Pigmentation (P)
        if (code.includes('P')) {
            chips.push({ label: t('home.care_focus.whitening'), emoji: '✨' });
        }

        // Priority 4: Wrinkle (W)
        if (code.includes('W')) {
            chips.push({ label: t('home.care_focus.firming'), emoji: '🧬' });
        }

        // Priority 5: Resilience (R) / Tightness (T) / Non-Pigmented (N) - Fillers
        if (chips.length < 3) {
            if (code.includes('R')) chips.push({ label: t('home.care_focus.barrier'), emoji: '🛡️' });
            if (code.includes('T') && !chips.some(c => c.label === t('home.care_focus.firming'))) chips.push({ label: t('home.care_focus.elasticity'), emoji: '🆙' });
            if (code.includes('N') && !chips.some(c => c.label === t('home.care_focus.whitening'))) chips.push({ label: t('home.care_focus.clear'), emoji: '💎' });
        }

        // Fallback for safety
        if (chips.length === 0) {
            return [
                { label: t('home.care_focus.sebum'), emoji: '💧' },
                { label: t('home.care_focus.soothing'), emoji: '🌿' },
                { label: t('home.care_focus.whitening'), emoji: '✨' },
            ];
        }

        return chips;
    };

    const skinDescription = t(`home.cabinet.skin_types.${skinCode}`, { defaultValue: t('home.cabinet.skin_types.unknown') });
    const careFocusChips = getCareFocusChips(skinCode);

    // ─── Skin Report Card Theme (피부 타입별 색상/아이콘) ─────────────────────
    const getSkinTheme = (code: string) => {
        const isUnknown = code === 'unknown' || !code;

        // Unknown / 미진단
        if (isUnknown) return {
            bg: '#F8F9FA',
            border: '#DEE2E6',
            badge: '#E9ECEF',
            badgeText: '#6C757D',
            titleColor: '#495057',
            linkColor: '#6C757D',
            iconName: 'help-circle-outline' as const,
            iconColor1: '#CED4DA',
            iconColor2: '#ADB5BD',
            iconColor3: '#F1F3F5',
            shadow: 'shadow-gray-200/60',
            dashed: true,
        };

        // O = Oily 지성 → 앰버/노랑
        if (code.includes('O') && !code.includes('D')) return {
            bg: '#FFFBEB',
            border: '#FDE68A',
            badge: '#FEF3C7',
            badgeText: '#92400E',
            titleColor: '#78350F',
            linkColor: '#D97706',
            iconName: 'sunny-outline' as const,
            iconColor1: '#FCD34D',
            iconColor2: '#F59E0B',
            iconColor3: '#FFFBEB',
            shadow: 'shadow-yellow-200/60',
            dashed: false,
        };

        // D = Dry 건성 → 파랑/스카이
        if (code.includes('D') && !code.includes('O')) return {
            bg: '#EFF6FF',
            border: '#BFDBFE',
            badge: '#DBEAFE',
            badgeText: '#1E40AF',
            titleColor: '#1E3A8A',
            linkColor: '#2563EB',
            iconName: 'water-outline' as const,
            iconColor1: '#93C5FD',
            iconColor2: '#3B82F6',
            iconColor3: '#EFF6FF',
            shadow: 'shadow-blue-200/60',
            dashed: false,
        };

        // S = Sensitive 민감성 → 핑크/로즈
        if (code.includes('S')) return {
            bg: '#FFF1F2',
            border: '#FECDD3',
            badge: '#FFE4E6',
            badgeText: '#9F1239',
            titleColor: '#881337',
            linkColor: '#E11D48',
            iconName: 'heart-outline' as const,
            iconColor1: '#FDA4AF',
            iconColor2: '#FB7185',
            iconColor3: '#FFF1F2',
            shadow: 'shadow-rose-200/60',
            dashed: false,
        };

        // R = Resistant 저항성 / 복합성 → 그린
        return {
            bg: '#F0FDF4',
            border: '#BBF7D0',
            badge: '#DCFCE7',
            badgeText: '#14532D',
            titleColor: '#14532D',
            linkColor: '#16A34A',
            iconName: 'leaf-outline' as const,
            iconColor1: '#86EFAC',
            iconColor2: '#22C55E',
            iconColor3: '#F0FDF4',
            shadow: 'shadow-green-200/60',
            dashed: false,
        };
    };

    const skinTheme = getSkinTheme(skinCode);

    const { getItemCount, addToCart } = useCart();
    const cartItemCount = getItemCount();
    const { recentScans, wishlist, toggleWishlist, isWishlisted, cabinet, addToCabinet, removeRecentScan } = useProduct();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [nearbyStores, setNearbyStores] = useState<Store[]>([]);

    const [isStoresLoading, setIsStoresLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            setIsStoresLoading(true);
            try {
                const stores = await getNearbyStores();
                setNearbyStores(stores);
            } finally {
                setIsStoresLoading(false);
            }
        };
        fetchStores();
    }, []);
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

    const openDirections = (store: any) => {
        const address = encodeURIComponent(store.address || store.name);
        const lat = store.lat;
        const lng = store.lng;
        let url: string;
        if (Platform.OS === 'ios') {
            // Apple Maps
            url = lat && lng
                ? `maps://?daddr=${lat},${lng}&dirflg=d`
                : `maps://?q=${address}`;
        } else {
            // Google Maps
            url = lat && lng
                ? `google.navigation:q=${lat},${lng}`
                : `https://www.google.com/maps/search/?api=1&query=${address}`;
        }
        Linking.openURL(url).catch(() => {
            // fallback to web Google Maps
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
        });
    };

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 140 }}>
            <View className="flex-row justify-between items-center px-6 pt-14 pb-6 bg-white">
                <Text className="text-2xl font-bold text-gray-900">
                    Hi, <Text className="text-clony-primary">{userName}</Text>
                </Text>
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

                {/* Top Insights Section (UX 3) */}
                <View className="bg-white/60 border border-white/80 rounded-3xl p-4 mb-6 shadow-sm flex-row items-center gap-4">
                    <View className="w-10 h-10 bg-clony-primary/10 rounded-2xl items-center justify-center">
                        <Ionicons name="bulb-outline" size={22} color="#0091ad" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-sm mb-0.5">{t('home.top_insights.title')}</Text>
                        <Text className="text-gray-500 text-xs leading-5" numberOfLines={2}>
                            {t('home.top_insights.desc')}
                        </Text>
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-5">
                        <Text className="text-clony-primary">{t('home.report_title', { userName })}</Text>
                    </Text>

                    {/* Compact Skin Type Card (Micro-interaction) */}
                    <Animated.View style={{ transform: [{ scale: reportScale }] }}>
                        <TouchableOpacity
                            onPressIn={() => handlePressIn(reportScale)}
                            onPressOut={() => handlePressOut(reportScale)}
                            onPress={skinCode === 'unknown' ? onRetakeSurvey : onViewAnalysis}
                            activeOpacity={1}
                            style={{
                                backgroundColor: skinTheme.bg,
                                borderColor: skinTheme.border,
                                borderWidth: skinTheme.dashed ? 2 : 1.5,
                                borderStyle: skinTheme.dashed ? 'dashed' : 'solid',
                                borderRadius: 24,
                                borderTopLeftRadius: 60,
                                borderBottomRightRadius: 60,
                                paddingHorizontal: 24,
                                paddingVertical: 20,
                                marginBottom: 20,
                                position: 'relative',
                                overflow: 'hidden',
                                minHeight: 160,
                            }}
                        >
                            <View className="flex-1 z-10">
                                {/* Skin Code Badge */}
                                <View style={{ backgroundColor: skinTheme.badge, alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999, marginBottom: 8 }}>
                                    <Text style={{ color: skinTheme.badgeText, fontSize: 13, fontWeight: '700' }}>#{skinCode}</Text>
                                </View>

                                {/* Main Title */}
                                <Text style={{ fontSize: 22, fontWeight: '700', color: skinTheme.titleColor, marginBottom: 8, lineHeight: 28 }}>
                                    {skinDescription}
                                </Text>

                                {/* View Detail Link */}
                                <Text style={{ color: skinTheme.linkColor, fontWeight: '900', fontSize: 16 }}>
                                    {skinCode === 'unknown' ? '진단 시작하기 →' : t('home.view_detail')}
                                </Text>
                            </View>

                            {/* Background Icon */}
                            <View style={{ position: 'absolute', right: -15, top: 0, opacity: 0.5 }}>
                                <Ionicons name={skinTheme.iconName} size={160} color={skinTheme.iconColor1} style={{ position: 'absolute' }} />
                                <Ionicons name={skinTheme.iconName} size={161} color={skinTheme.iconColor2} style={{ position: 'absolute', opacity: 0.4 }} />
                                <Ionicons name={skinTheme.iconName} size={160} color={skinTheme.iconColor3} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

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

                    {/* Compact Scan Card (Micro-interaction) */}
                    <Animated.View style={{ transform: [{ scale: scanScale }] }}>
                        <TouchableOpacity
                            onPressIn={() => handlePressIn(scanScale)}
                            onPressOut={() => handlePressOut(scanScale)}
                            onPress={onScanPress}
                            activeOpacity={1}
                            className="rounded-[36px] overflow-hidden shadow-2xl shadow-black"
                        >
                            <LinearGradient
                                colors={['#014f86', '#0091ad', '#00A676']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="px-6 py-6 flex-row items-center justify-center gap-4"
                            >
                                <View className="flex-col items-start pr-4 border-r border-white/20">
                                    <Text className="text-white/60 font-black text-[10px] mb-1.5 uppercase tracking-widest">{t('home.scan.title')}</Text>
                                    <Text className="text-white font-bold text-xl mb-1 tracking-tight">
                                        {selectedCountry === 'us' ? 'Check cosmetics' : t('home.scan.subtitle')}
                                    </Text>
                                    <Text className="text-white/60 text-xs font-medium">{t('home.scan.hint')}</Text>
                                </View>
                                <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center border border-white/30 shrink-0 shadow-sm">
                                    <Ionicons name="scan-outline" size={26} color="white" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900">
                            {t('home.sections.recent_scans')}
                        </Text>
                    </View>

                    {recentScans.length === 0 ? (
                        <TouchableOpacity
                            onPress={onScanPress}
                            className="bg-white border-2 border-dashed border-gray-100 rounded-[24px] p-5 items-center justify-center mb-2"
                        >
                            <View className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center mb-2">
                                <Ionicons name="camera-outline" size={24} color="#CBD5E1" />
                            </View>
                            <Text className="text-gray-900 font-bold text-base mb-1">{t('home.empty_scans.title')}</Text>
                            <Text className="text-gray-400 text-[11px] text-center mb-3 leading-5 px-4">{t('home.empty_scans.desc')}</Text>
                            <View className="bg-[#0091ad]/10 px-6 py-2.5 rounded-full border border-[#0091ad]/20">
                                <Text className="text-[#0091ad] font-bold text-sm">{t('home.empty_scans.button')}</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                            <View className="flex-row gap-3">
                                {recentScans.map((product: Product) => (
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
                                            <Text className="text-white text-[10px] font-bold">{t('home.match_score', { score: product.matchingScore })}</Text>
                                        </View>
                                        <Text className="text-[10px] text-gray-400 mb-1">{product.brand}</Text>
                                        <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>
                                            {product.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>


                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-900">{t('home.sections.live_trending')}</Text>
                        <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center gap-1 shadow-sm">
                            <View className="w-1.5 h-1.5 bg-white rounded-full" />
                            <Text className="text-white text-[10px] font-bold">{t('home.live_trend.live')}</Text>
                        </View>
                    </View>

                    {/* Skeleton Loading State or Content */}
                    {recommendedProducts.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="-mx-6 px-6"
                            contentContainerStyle={{ paddingRight: 40, gap: 12 }}
                        >
                            {recommendedProducts.map((product: Product, index: number) => (
                                <TouchableOpacity
                                    key={product.id}
                                    className="bg-white rounded-[24px] p-4 w-60 border border-gray-100 shadow-sm"
                                    onPress={() => setSelectedProduct(product)}
                                >
                                    {/* Top Row: Ranking & Users */}
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="bg-gray-900 w-6 h-6 rounded-full items-center justify-center">
                                            <Text className="text-white text-[11px] font-black">{index + 1}</Text>
                                        </View>
                                        <View className="bg-red-50 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                                            <Ionicons name="people" size={10} color="#EF4444" />
                                            <Text className="text-[10px] text-red-500 font-bold">{(product as any).scanCount || 100}</Text>
                                        </View>
                                    </View>

                                    {/* Image Container - Increased height to ensure full visibility */}
                                    <View className="w-full h-36 bg-gray-50 rounded-2xl mb-3 items-center justify-center overflow-hidden p-3">
                                        {getImageSource(product) ? (
                                            <Image
                                                source={getImageSource(product)}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <Ionicons name="image-outline" size={32} color="#CBD5E1" />
                                        )}
                                    </View>

                                    {/* Brand & Name */}
                                    <View className="mb-2">
                                        <Text className="text-[11px] text-gray-400 mb-0.5">{product.brand}</Text>
                                        <Text className="text-[15px] font-bold text-gray-900 leading-tight h-10" numberOfLines={2}>
                                            {product.name}
                                        </Text>
                                    </View>

                                    {/* Match & Action Info */}
                                    <View className="flex-row items-center mb-3">
                                        <View className={`${getMatchBadgeColor(product.matchingScore)} px-2 py-0.5 rounded-lg mr-2`}>
                                            <Text className="text-white text-[10px] font-black">{product.matchingScore}%</Text>
                                        </View>
                                        <Text className="text-[11px] text-clony-primary font-bold flex-1" numberOfLines={1}>
                                            {(product as any).action || t('ocr_result.ai_detected')}
                                        </Text>
                                    </View>

                                    {/* Bottom Row: Price & Cart Button */}
                                    <View className="flex-row items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                        <View>
                                            <Text className="text-gray-900 font-black text-base">
                                                ₩{(product.price || 0).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(product);
                                                }}
                                                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
                                            >
                                                <Ionicons
                                                    name={isWishlisted(product.id || (product as any).product_id) ? "heart" : "heart-outline"}
                                                    size={20}
                                                    color={isWishlisted(product.id || (product as any).product_id) ? "#FF4757" : "#9CA3AF"}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    addToCart({
                                                        productId: parseInt(product.id.replace('trend_', '')),
                                                        brand: product.brand,
                                                        name: product.name,
                                                        image: getImageSource(product),
                                                        price: product.price || 0,
                                                        quantity: 1,
                                                        matchingScore: product.matchingScore
                                                    });
                                                }}
                                                className="w-10 h-10 bg-clony-primary rounded-full items-center justify-center shadow-lg shadow-green-200"
                                            >
                                                <Ionicons name="cart" size={18} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
                        <Text className="text-gray-400 text-sm font-medium">{t('home.live_trend.view_more')} {'>'}</Text>
                    </TouchableOpacity>
                </View>

                {/* 내 주변 K-뷰티 매장 (Global Feature) */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="map" size={20} color="#00D182" />
                            <Text className="text-xl font-bold text-gray-900">{t('home.nearby_stores.title')}</Text>
                        </View>
                    </View>

                    <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                        {/* Interactive Map View */}
                        <View className="h-48 bg-gray-100 relative">
                            <InteractiveMap
                                stores={nearbyStores}
                                language={i18n.language}
                            />
                            <View className="absolute inset-0 items-center justify-center pointer-events-none">
                                <View className="bg-white/90 px-4 py-2 rounded-full border border-clony-primary/20 shadow-sm flex-row items-center gap-2">
                                    <Ionicons name="location" size={16} color="#00D182" />
                                    <Text className="text-xs font-bold text-gray-700">
                                        {nearbyStores.length > 0 ? t('home.nearby_stores.recommended') : t('home.nearby_stores.myeongdong')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="p-4">
                            {nearbyStores.length > 0 ? (
                                nearbyStores.slice(0, 3).map((store: any) => (
                                    <View key={store.id} className="flex-row items-center justify-between mb-4 last:mb-0">
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${store.type === 'OliveYoung' ? 'bg-green-50' :
                                                store.type === 'DutyFree' ? 'bg-blue-50' : 'bg-orange-50'
                                                }`}>
                                                <Ionicons
                                                    name={store.type === 'OliveYoung' ? 'basket' : 'airplane'}
                                                    size={20}
                                                    color={store.type === 'OliveYoung' ? '#00A676' : '#3B82F6'}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-1.5 mb-0.5">
                                                    <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={1}>
                                                        {i18n.language === 'en' ? (store.nameEn || store.name) : store.name}
                                                    </Text>
                                                    <View className={`w-2 h-2 rounded-full ${isStoreOpen(store) ? 'bg-green-500' : 'bg-gray-300'} shrink-0 mb-1`} />
                                                </View>
                                                <Text className="text-[10px] text-gray-500" numberOfLines={2}>
                                                    {i18n.language === 'en' ? (store.addressEn || store.address) : store.address}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <View className={`px-2 py-1 rounded-lg ${store.distance?.includes('m') ? 'bg-clony-primary/10' : 'bg-gray-50'}`}>
                                                <Text className={`text-[10px] font-black ${store.distance?.includes('m') ? 'text-clony-primary' : 'text-gray-500'}`}>
                                                    {store.distance || '0.2km'}
                                                </Text>
                                            </View>
                                            <TouchableOpacity className="mt-1" onPress={() => openDirections(store)}>
                                                <Text className="text-[9px] text-clony-primary underline font-bold">{t('home.nearby_stores.directions')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="items-center py-6">
                                    {isStoresLoading ? (
                                        <ActivityIndicator color="#00D182" />
                                    ) : (
                                        <Text className="text-gray-400 text-xs">{t('home.nearby_stores.none_nearby', { defaultValue: 'No stores within 30km' })}</Text>
                                    )}
                                </View>
                            )}
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
                    <View className="flex-row items-center justify-between px-6 mb-6">
                        <Text className="text-2xl font-bold text-gray-900">{t('home.sections.live_trending')}</Text>
                        <View className="flex-row items-center gap-4">
                            <View className="bg-red-500 px-2.5 py-1 rounded-full flex-row items-center gap-1.5 shadow-sm">
                                <View className="w-1.5 h-1.5 bg-white rounded-full" />
                                <Text className="text-white text-[11px] font-black">{t('home.live_trend.live')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowFullList(false)}>
                                <Ionicons name="close" size={28} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
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
                                                    : (product.keyIngredients[0].name || product.keyIngredients[0].nameKo))
                                                : t('ocr_result.ai_detected')}
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
                            <Text className="text-xl font-bold text-gray-900">{t('home.buttons.add')}</Text>
                            <TouchableOpacity onPress={() => setIsCabinetSearchModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <View className="px-6 mb-4">
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                <Ionicons name="search" size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-2 text-base"
                                    placeholder={t('home.search_placeholder')}
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
                                    <Text className="text-gray-400">{t('home.cabinet.empty_results')}</Text>
                                </View>
                            ) : (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">{t('home.cabinet.search_hint')}</Text>
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
