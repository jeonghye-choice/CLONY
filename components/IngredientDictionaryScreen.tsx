import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchCosmeticsIngredient, CosmeticsIngredient } from '../services/cosmeticsService';
import { API_URL } from '../config/api.config';

const IngredientDictionaryScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [apiResults, setApiResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Fallback Popular Ingredients
    const popularIngredients = [
        { id: '1', name: '정제수', nameEn: 'Water', category: '기본 성분', scanCount: 1540, effect: '보습, 용제', description: '화장품의 가장 기본이 되는 성분으로, 다른 성분들을 용해시키는 역할을 합니다.', goodFor: ['모든 피부'], caution: '특이사항 없음', synergy: [], conflict: [] },
        { id: '2', name: '글리세린', nameEn: 'Glycerin', category: '강력 보습', scanCount: 1280, effect: '보습, 피부 보호', description: '강력한 보습 효과로 피부를 촉촉하게 유지해주는 강력한 보습 성분입니다.', goodFor: ['건성 피부', '모든 피부'], caution: '고농도 사용 시 끈적임이나 개인에 따른 일시적 자극이 있을 수 있습니다.', synergy: [], conflict: [] },
        { id: '3', name: '나이아신아마이드', nameEn: 'Niacinamide', category: '미백/개선', scanCount: 980, effect: '미백, 장벽 강화', description: '비타민 B3의 일종으로 미백 효과와 피부 장벽 강화에 도움을 줍니다.', goodFor: ['모든 피부', '미백 필요'], caution: '고농도 사용 시 일시적 따가움이나 붉어짐이 있을 수 있습니다. 비타민 C와 혼용 시 자극에 주의하세요.', synergy: [], conflict: [] },
        { id: '4', name: '판테놀', nameEn: 'Panthenol', category: '진정/재생', scanCount: 850, effect: '진정, 재생', description: '피부에 흡수되면 비타민 B5로 변하여 진정과 보습, 장벽 강화에 도움을 줍니다.', goodFor: ['민감성 피부', '손상 피부'], caution: '드물게 가려움, 알레르기 반응이 있을 수 있으므로 민감성 피부는 패치 테스트를 권장합니다.', synergy: [], conflict: [] },
    ];

    const categories = ['전체', '보습', '미백', '진정', '주름개선', '피지조절'];

    // Static list removed in favor of API search
    // const ingredients = [...];

    // API Search Implementation
    useEffect(() => {
        const fetchIngredients = async () => {
            if (searchQuery.trim().length < 2) {
                setApiResults([]);
                setSearchError(null);
                return;
            }

            setIsSearching(true);
            setSearchError(null);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

            try {
                console.log(`[Ingredient] Searching for: ${searchQuery} at ${API_URL}`);
                // Use centralized API_URL
                const response = await fetch(`${API_URL}/ingredients/search?query=${encodeURIComponent(searchQuery)}`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('서버 연결 실패');

                const data = await response.json();

                if (data && data.length > 0) {
                    // Transform API data to match UI expected format
                    const transformed = data.map((item: any, index: number) => ({
                        id: `api-${index}`,
                        name: item.ingdName || item.name || '이름 없음',
                        nameEn: item.ingdEngName || item.name_en || item.casNo || '',
                        casNo: item.cas_no || item.casNo || '',
                        category: item.category || '공식 성분',
                        scanCount: item.scan_count || 0,
                        effect: item.originMjrKoraNm || item.effect || '정보 없음',
                        description: item.description || (item.effect ? `주요 기능: ${item.effect}` : '상세 설명이 없습니다.'),
                        goodFor: typeof item.good_for === 'string' ? JSON.parse(item.good_for) : (item.goodFor || []),
                        caution: item.caution || '',
                        synergy: typeof item.synergy === 'string' ? JSON.parse(item.synergy) : (item.synergy || []),
                        conflict: typeof item.conflict === 'string' ? JSON.parse(item.conflict) : (item.conflict || [])
                    }));
                    setApiResults(transformed);
                } else {
                    setApiResults([]);
                    setSearchError('공식 DB에 해당 성분이 없습니다.');
                }
            } catch (err: any) {
                clearTimeout(timeoutId);
                console.error('[Ingredient] Error:', err);
                if (err.name === 'AbortError') {
                    setSearchError('서버 응답 시간이 초과되었습니다.');
                } else {
                    setSearchError('성분 정보를 불러오지 못했습니다. 네트워크를 확인해주세요.');
                }
                setApiResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchIngredients();
        }, 500); // 500ms debounce

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Header */}
                <View className="px-6 pt-14 pb-6 bg-white">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">성분 사전</Text>
                    <Text className="text-sm text-gray-500">궁금한 성분을 검색하고 배워보세요</Text>
                </View>

                {/* Search Bar */}
                <View className="px-6 py-4 bg-white border-b border-gray-100">
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-2 text-base"
                            placeholder="성분명을 검색하세요 (예: 나이아신아마이드)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* API Search Results List (Main View) */}
                <View className="px-6 py-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-bold text-gray-900">
                            {searchQuery ? '검색 결과' : '검색 예시'}
                        </Text>
                        {isSearching && (
                            <ActivityIndicator size="small" color="#00D182" />
                        )}
                    </View>

                    {searchError && !isSearching && (
                        <View className="p-8 items-center">
                            <Text className="text-gray-500 text-center">{searchError}</Text>
                        </View>
                    )}

                    {!isSearching && apiResults.length === 0 && !searchQuery && (
                        <View>
                            <View className="flex-row items-center mb-4">
                                <Ionicons name="flame" size={20} color="#FF6B6B" />
                                <Text className="text-base font-bold text-gray-900 ml-2">인기 성분</Text>
                            </View>
                            {popularIngredients.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setSelectedIngredient(item)}
                                    className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
                                >
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-base font-bold text-gray-900">{item.name}</Text>
                                        <Text className="text-xs text-gray-400">{item.category}</Text>
                                    </View>
                                    <Text className="text-sm text-gray-500" numberOfLines={1}>{item.effect}</Text>
                                </TouchableOpacity>
                            ))}

                            <View className="items-center py-6 border-t border-gray-100 mt-2">
                                <Ionicons name="search-outline" size={32} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-2 text-center text-sm">
                                    더 많은 성분이 궁금하시다면 검색해보세요!
                                </Text>
                            </View>
                        </View>
                    )}

                    {!isSearching && apiResults.length > 0 && (
                        <View>
                            {apiResults.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedIngredient(item)}
                                    className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
                                >
                                    <View className="flex-row items-start justify-between mb-2">
                                        <View className="flex-1">
                                            <Text className="text-base font-bold text-gray-900 mb-1">
                                                {item.name}
                                            </Text>
                                            <Text className="text-xs text-clony-primary font-bold">
                                                {item.effect}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Local List Removed */}
            </ScrollView>

            {/* Ingredient Detail Modal */}
            <Modal
                visible={!!selectedIngredient}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedIngredient(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
                        <ScrollView>
                            {selectedIngredient && (
                                <View className="p-6">
                                    {/* Header */}
                                    <View className="flex-row items-start justify-between mb-6">
                                        <View className="flex-1">
                                            <Text className="text-2xl font-bold text-gray-900 mb-2">
                                                {selectedIngredient.name}
                                            </Text>
                                            <Text className="text-sm text-gray-400">{selectedIngredient.nameEn}</Text>
                                            {selectedIngredient.casNo && (
                                                <Text className="text-xs text-clony-primary mt-1">
                                                    CAS No: {selectedIngredient.casNo}
                                                </Text>
                                            )}
                                            {selectedIngredient.alias && (
                                                <Text className="text-xs text-gray-500 mt-1">
                                                    별칭: {selectedIngredient.alias}
                                                </Text>
                                            )}
                                        </View>
                                        <TouchableOpacity onPress={() => setSelectedIngredient(null)}>
                                            <Ionicons name="close" size={28} color="#374151" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Stats */}
                                    <View className="flex-row gap-3 mb-6">
                                        <View className="flex-1 bg-gray-50 p-3 rounded-xl">
                                            <Text className="text-xs text-gray-500 mb-1">카테고리</Text>
                                            <Text className="text-sm font-bold text-clony-primary">
                                                {selectedIngredient.category}
                                            </Text>
                                        </View>
                                        <View className="flex-1 bg-gray-50 p-3 rounded-xl">
                                            <Text className="text-xs text-gray-500 mb-1">스캔</Text>
                                            <Text className="text-sm font-bold text-gray-900">
                                                {selectedIngredient.scanCount || 0}회
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Description */}
                                    <View className="mb-6">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">📖 설명</Text>
                                        <Text className="text-sm text-gray-600 leading-6">
                                            {selectedIngredient.description}
                                        </Text>
                                    </View>

                                    {/* Effect */}
                                    <View className="mb-6">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">✨ 주요 효능</Text>
                                        <Text className="text-sm text-clony-primary font-bold">
                                            {selectedIngredient.effect}
                                        </Text>
                                    </View>

                                    {/* Good For */}
                                    <View className="mb-6">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">👍 추천 피부 타입</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {(selectedIngredient.goodFor || []).map((type: string, idx: number) => (
                                                <View key={idx} className="bg-green-50 px-3 py-1.5 rounded-lg">
                                                    <Text className="text-xs text-green-700">{type}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Caution */}
                                    <View className="mb-6">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">⚠️ 주의사항</Text>
                                        <View className="bg-orange-50 p-3 rounded-xl">
                                            <Text className="text-sm text-orange-700">
                                                {selectedIngredient.caution}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Synergy */}
                                    {selectedIngredient.synergy.length > 0 && (
                                        <View className="mb-6">
                                            <Text className="text-sm font-bold text-gray-900 mb-2">🤝 궁합 좋은 성분</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {(selectedIngredient.synergy || []).map((syn: string, idx: number) => (
                                                    <View key={idx} className="bg-blue-50 px-3 py-1.5 rounded-lg">
                                                        <Text className="text-xs text-blue-700">{syn}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Conflict */}
                                    {selectedIngredient.conflict.length > 0 && (
                                        <View className="mb-6">
                                            <Text className="text-sm font-bold text-gray-900 mb-2">⚡ 함께 사용 주의</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {(selectedIngredient.conflict || []).map((con: string, idx: number) => (
                                                    <View key={idx} className="bg-red-50 px-3 py-1.5 rounded-lg">
                                                        <Text className="text-xs text-red-700">{con}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default IngredientDictionaryScreen;
