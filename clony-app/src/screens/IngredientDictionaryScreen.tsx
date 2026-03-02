import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    Modal, ActivityIndicator, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config/api.config';

// ─── 타입 ──────────────────────────────────────────────────────
interface IngredientItem {
    nameKo: string;
    nameEn: string;
    effect: string;
    skinType: string;
    concern: string;
    componentType: string;
    timeUse: string;
    conflicts: string[];
}

// ─── 효능 카테고리별 색상 ────────────────────────────────────────
const COMPONENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    Moisturizer: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    Calming: { bg: '#FFF1F2', text: '#BE123C', dot: '#FB7185' },
    Active: { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
    Barrier: { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
    Sunscreen: { bg: '#FEFCE8', text: '#A16207', dot: '#EAB308' },
    Preservative: { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
    Base: { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
    Solvent: { bg: '#F0FDF4', text: '#064E3B', dot: '#10B981' },
    default: { bg: '#F1F5F9', text: '#334155', dot: '#64748B' },
};

function getColor(componentType: string) {
    return COMPONENT_COLORS[componentType] ?? COMPONENT_COLORS.default;
}

// ─── 인기 성분 (검색 전 기본 표시) ─────────────────────────────
const POPULAR_INGREDIENTS: IngredientItem[] = [
    { nameKo: '글리세린', nameEn: 'Glycerin', effect: '보습', skinType: '건성', concern: '건조', componentType: 'Moisturizer', timeUse: 'Any', conflicts: [] },
    { nameKo: '나이아신아마이드', nameEn: 'Niacinamide', effect: '미백/피지 조절', skinType: '지성/복합성', concern: '칙칙함/피지', componentType: 'Active', timeUse: 'Any', conflicts: ['Vitamin C'] },
    { nameKo: '히알루론산', nameEn: 'Hyaluronic Acid', effect: '강력 보습', skinType: '건성', concern: '속건조', componentType: 'Moisturizer', timeUse: 'Any', conflicts: [] },
    { nameKo: '판테놀', nameEn: 'Panthenol', effect: '진정/보습', skinType: '민감성', concern: '자극', componentType: 'Calming', timeUse: 'Any', conflicts: [] },
    { nameKo: '병풀추출물', nameEn: 'Centella Asiatica Extract', effect: '진정', skinType: '민감성', concern: '자극', componentType: 'Calming', timeUse: 'Any', conflicts: [] },
    { nameKo: '아데노신', nameEn: 'Adenosine', effect: '주름 개선', skinType: '노화성', concern: '주름', componentType: 'Active', timeUse: 'Any', conflicts: [] },
    { nameKo: '레티놀', nameEn: 'Retinol', effect: '탄력/노화', skinType: '노화성', concern: '주름/탄력', componentType: 'Active', timeUse: 'Night', conflicts: ['Vitamin C', 'AHA/BHA'] },
    { nameKo: '살리실릭애씨드', nameEn: 'Salicylic Acid', effect: '각질/모공케어', skinType: '지성', concern: '여드름/모공', componentType: 'Active', timeUse: 'Night', conflicts: ['Retinol'] },
];

// ─── 성분 카드 컴포넌트 ─────────────────────────────────────────
const IngredientCard = ({ item, onPress }: { item: IngredientItem; onPress: () => void }) => {
    const color = getColor(item.componentType);
    const hasEffect = !!item.effect;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
            activeOpacity={0.75}
        >
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                    {/* 한국어 + 영어 한 줄 */}
                    <View className="flex-row items-center flex-wrap mb-2">
                        <Text className="text-[17px] font-bold text-gray-900">
                            {item.nameKo}
                        </Text>
                        <Text className="text-gray-300 mx-1.5 text-base">|</Text>
                        <Text className="text-[13px] font-semibold text-gray-400" numberOfLines={1}>
                            {item.nameEn}
                        </Text>
                    </View>
                    {/* 효능 태그 */}
                    {hasEffect && (
                        <View className="flex-row flex-wrap gap-1.5">
                            {item.effect.split('/').map((e, i) => (
                                <View key={i} style={{ backgroundColor: color.bg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                                    <Text style={{ color: color.text, fontSize: 11, fontWeight: '700' }}>{e.trim()}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                {/* 카테고리 dot */}
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.dot, marginTop: 6 }} />
            </View>
            {/* 피부 타입 */}
            {item.skinType && (
                <Text className="text-xs text-gray-400 mt-2">
                    ✦ {item.skinType} 피부에 적합
                </Text>
            )}
        </TouchableOpacity>
    );
};

// ─── 상세 모달 ─────────────────────────────────────────────────
const IngredientDetailModal = ({ item, onClose }: { item: IngredientItem | null; onClose: () => void }) => {
    if (!item) return null;
    const color = getColor(item.componentType);

    return (
        <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl" style={{ maxHeight: '88%' }}>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
                        {/* 헤더 */}
                        <View className="flex-row items-start justify-between mb-6">
                            <View className="flex-1 mr-4">
                                <Text className="text-2xl font-bold text-gray-900 mb-1">{item.nameKo}</Text>
                                <Text className="text-sm text-gray-400">{item.nameEn}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={28} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {/* 카테고리 뱃지 */}
                        {item.componentType && (
                            <View style={{ backgroundColor: color.bg, alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 20 }}>
                                <Text style={{ color: color.text, fontWeight: '700', fontSize: 12 }}>#{item.componentType}</Text>
                            </View>
                        )}

                        {/* 효능 */}
                        {item.effect ? (
                            <View className="mb-6 bg-gray-50 rounded-3xl p-5">
                                <Text className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wide">✨ 주요 효능</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {item.effect.split('/').map((e, i) => (
                                        <View key={i} style={{ backgroundColor: color.bg, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 }}>
                                            <Text style={{ color: color.text, fontWeight: '700', fontSize: 13 }}>{e.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View className="mb-6 bg-gray-50 rounded-3xl p-5">
                                <Text className="text-sm text-gray-400 text-center">효능 정보가 아직 준비 중입니다.</Text>
                            </View>
                        )}

                        {/* 피부 타입 & 고민 */}
                        {(item.skinType || item.concern) && (
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-gray-900 mb-3">💧 추천 피부 타입</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {item.skinType && item.skinType.split('/').map((s, i) => (
                                        <View key={i} className="bg-blue-50 px-4 py-2 rounded-2xl">
                                            <Text className="text-blue-700 text-sm font-medium">{s.trim()}</Text>
                                        </View>
                                    ))}
                                </View>
                                {item.concern && (
                                    <Text className="text-xs text-gray-400 mt-2">
                                        피부 고민: <Text className="font-bold text-gray-600">{item.concern}</Text>
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* 사용 시간대 */}
                        {item.timeUse && item.timeUse !== 'Any' && (
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-gray-900 mb-2">🕐 사용 시간대</Text>
                                <View className="bg-yellow-50 px-4 py-3 rounded-2xl border border-yellow-100">
                                    <Text className="text-yellow-700 text-sm font-medium">
                                        {item.timeUse === 'Day' ? '☀️ 낮 사용 권장' : '🌙 밤 사용 권장'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* 주의 성분 */}
                        {item.conflicts && item.conflicts.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-sm font-bold text-gray-900 mb-3">⚠️ 함께 사용 주의</Text>
                                <View className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                                    <Text className="text-orange-700 text-sm">
                                        {item.conflicts.join(', ')}와 동시 사용 시 자극이 발생할 수 있습니다.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ─── 필터 카테고리 정의 (effect 문자열 기반) ──────────────────────
// labelKey는 다국어 번역을 위한 키입니다.
const FILTERS: { key: string; labelKey: string; dot: string; effectKey: string }[] = [
    { key: '', labelKey: 'dictionary.filters.all', dot: '#6B7280', effectKey: '' },
    { key: 'moisturize', labelKey: 'dictionary.filters.moisturize', dot: '#3B82F6', effectKey: '보습' },
    { key: 'calming', labelKey: 'dictionary.filters.soothing', dot: '#FB7185', effectKey: '진정' },
    { key: 'whitening', labelKey: 'dictionary.filters.whitening', dot: '#F59E0B', effectKey: '미백' },
    { key: 'antiage', labelKey: 'dictionary.filters.anti_aging', dot: '#8B5CF6', effectKey: '주름' },
    { key: 'elastic', labelKey: 'dictionary.filters.firming', dot: '#EC4899', effectKey: '탄력' },
    { key: 'pore', labelKey: 'dictionary.filters.pore_care', dot: '#F97316', effectKey: '각질' },
    { key: 'barrier', labelKey: 'dictionary.filters.barrier', dot: '#22C55E', effectKey: '장벽' },
    { key: 'antibac', labelKey: 'dictionary.filters.antibacterial', dot: '#14B8A6', effectKey: '항균' },
    { key: 'sunscreen', labelKey: 'dictionary.filters.sunscreen', dot: '#EAB308', effectKey: '자외선' },
    { key: 'preserv', labelKey: 'dictionary.filters.preservative', dot: '#A78BFA', effectKey: '방부' },
];

// ─── 필터 버텀 시트 모달 ──────────────────────────────────────────
const FilterBottomSheet = ({
    visible,
    onClose,
    selectedFilter,
    onSelectFilter,
    t
}: {
    visible: boolean;
    onClose: () => void;
    selectedFilter: string | null;
    onSelectFilter: (key: string | null) => void;
    t: any;
}) => {
    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '70%' }}>
                    {/* 모달 핸들러 (디자인 요소) */}
                    <View className="items-center mb-4">
                        <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
                    </View>

                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold text-gray-900">{t('dictionary.filter_title', '효능 필터 선택')}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        <View className="flex-row flex-wrap justify-between">
                            {FILTERS.map((filter) => {
                                const active = filter.key === ''
                                    ? selectedFilter === null
                                    : selectedFilter === filter.key;
                                return (
                                    <TouchableOpacity
                                        key={filter.key || '__all__'}
                                        onPress={() => {
                                            onSelectFilter(filter.key === '' ? null : filter.key);
                                            onClose();
                                        }}
                                        style={{
                                            width: '48%',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: active ? `${filter.dot}20` : '#F9FAFB',
                                            paddingVertical: 14,
                                            paddingHorizontal: 16,
                                            borderRadius: 16,
                                            marginBottom: 12,
                                            borderWidth: 1.5,
                                            borderColor: active ? filter.dot : 'transparent',
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={{
                                            width: 10, height: 10, borderRadius: 5,
                                            backgroundColor: filter.dot,
                                            marginRight: 10,
                                        }} />
                                        <Text style={{
                                            fontSize: 15,
                                            fontWeight: active ? '700' : '500',
                                            color: active ? filter.dot : '#374151',
                                            flexShrink: 1,
                                        }} numberOfLines={1}>
                                            {t(filter.labelKey, filter.labelKey.split('.').pop())}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ─── 메인 스크린 ────────────────────────────────────────────────
const IngredientDictionaryScreen = () => {
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [results, setResults] = useState<IngredientItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedIngredient, setSelectedIngredient] = useState<IngredientItem | null>(null);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const fetchIngredients = useCallback(async (query: string) => {
        if (query.trim().length < 1) {
            setResults([]);
            setSearchError(null);
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            const res = await fetch(`${API_URL}/ingredient-search?query=${encodeURIComponent(query)}&limit=50`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data.results || []);
            if ((data.results || []).length === 0) {
                setSearchError(t('dictionary.no_results'));
            }
        } catch {
            setSearchError('검색 중 오류가 발생했습니다.');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [t]);

    useEffect(() => {
        const timer = setTimeout(() => fetchIngredients(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchIngredients]);

    const baseItems = searchQuery.trim() ? results : POPULAR_INGREDIENTS;
    const activeFilter = FILTERS.find(f => f.key === (selectedFilter ?? ''));
    const displayItems = (selectedFilter && activeFilter?.effectKey)
        ? baseItems.filter(item => item.effect.includes(activeFilter.effectKey))
        : baseItems;
    const filteredCount = (selectedFilter && activeFilter?.effectKey)
        ? baseItems.filter(item => item.effect.includes(activeFilter.effectKey)).length
        : null;

    return (
        <View className="flex-1 bg-gray-50">
            {/* 헤더 */}
            <View className="px-6 pt-14 pb-4 bg-white">
                <Text className="text-2xl font-bold text-gray-900 mb-1">{t('dictionary.title')}</Text>
                <Text className="text-sm text-gray-400">{t('dictionary.subtitle')}</Text>
            </View>

            {/* 검색창 & 필터 버튼 */}
            <View className="px-6 py-3 bg-white border-b border-gray-100 flex-row items-center">
                <View className="flex-1 flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mr-3">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        className="flex-1 ml-2 text-base"
                        placeholder={t('dictionary.search_placeholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {isSearching
                        ? <ActivityIndicator size="small" color="#0091ad" />
                        : searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )
                    }
                </View>

                {/* 필터 버튼 */}
                <TouchableOpacity
                    onPress={() => setIsFilterModalVisible(true)}
                    className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 relative"
                    activeOpacity={0.7}
                >
                    <Ionicons name="options-outline" size={22} color={selectedFilter ? '#0091ad' : '#4B5563'} />
                    {selectedFilter && (
                        <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#0091ad] rounded-full border-2 border-white" />
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={displayItems}
                keyExtractor={(item, i) => `${item.nameKo}-${i}`}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
                ListHeaderComponent={
                    <View className="flex-row items-center mb-4">
                        {!searchQuery && !selectedFilter && <Ionicons name="flame" size={18} color="#F97316" />}
                        <Text className="text-base font-bold text-gray-900 ml-1">
                            {selectedFilter
                                ? `${t(FILTERS.find(f => f.key === selectedFilter)?.labelKey || '', FILTERS.find(f => f.key === selectedFilter)?.labelKey?.split('.').pop() || '')} ${filteredCount}개`
                                : searchQuery ? `검색 결과 ${results.length}개` : '자주 찾는 성분'
                            }
                        </Text>
                        {selectedFilter && (
                            <TouchableOpacity onPress={() => setSelectedFilter(null)} className="ml-2">
                                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !isSearching ? (
                        <View className="items-center py-12">
                            <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                            <Text className="text-gray-400 mt-3 text-center text-sm">
                                {searchError || t('dictionary.empty_hint')}
                            </Text>
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <IngredientCard item={item} onPress={() => setSelectedIngredient(item)} />
                )}
            />

            <IngredientDetailModal
                item={selectedIngredient}
                onClose={() => setSelectedIngredient(null)}
            />

            {/* 필터 바텀 시트 */}
            <FilterBottomSheet
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                selectedFilter={selectedFilter}
                onSelectFilter={setSelectedFilter}
                t={t}
            />
        </View>
    );
};

export default IngredientDictionaryScreen;
