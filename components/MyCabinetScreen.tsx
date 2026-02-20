import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MyCabinetScreenProps {
    onScanPress: () => void;
    onBack?: () => void;
}

const MyCabinetScreen: React.FC<MyCabinetScreenProps> = ({ onScanPress, onBack }) => {
    const { cabinet, addToCabinet, removeFromCabinet, updateProduct } = require('../contexts/ProductContext').useProduct();
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const categories = ['전체', '토너/스킨', '세럼/앰플', '크림/로션', '선케어', '기타'];

    const calculateDDay = (expiryDate: string) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate.replace(/\./g, '-'));
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const expiringSoonCount = cabinet.filter((p: any) => {
        const dDay = calculateDDay(p.expiryDate);
        return dDay !== null && dDay <= 30 && dDay >= 0;
    }).length;

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.trim().length > 0) {
            try {
                // productService에서 새로 추가한 API 검색 함수 사용
                const { apiSearchProducts } = require('../services/productService');
                const results = await apiSearchProducts(text);
                setSearchResults(results);
            } catch (error) {
                console.error("Search fetch failed", error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const addProductToCabinet = (product: any) => {
        addToCabinet({
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl: product.imageUrl || product.image,
            price: product.price || 0,
            matchingScore: product.matchingScore || 0,
            skinType: product.skinType || 'Unknown',
            keyIngredients: product.ingredients || [],
            warnings: [],
            reviews: ''
        });
        setIsSearchModalVisible(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const filteredProducts = selectedCategory === '전체'
        ? cabinet
        : cabinet.filter((p: any) => p.category === selectedCategory);

    const [activeRoutine, setActiveRoutine] = useState<'Morning' | 'Night'>('Morning');

    // Standard Routine Framework mapping based on Categories
    const getProductForStep = (categories: string[]) => {
        return cabinet.find((p: any) => categories.includes(p.category)) || null;
    };

    const routineSteps = {
        Morning: [
            { step: 1, type: "Cleansing", label: "세안", product: getProductForStep(['기타']), guide: "미온수로 가볍게 물세안 해주세요.", missing: false },
            { step: 2, type: "Prep", label: "정돈", product: getProductForStep(['토너/스킨']), guide: "화장솜에 묻혀 결을 정돈해주세요.", missing: !getProductForStep(['토너/스킨']) },
            { step: 3, type: "Active", label: "활성", product: getProductForStep(['세럼/앰플']), guide: "영양 성분을 피부 깊숙이 흡수시켜요.", missing: !getProductForStep(['세럼/앰플']) },
            { step: 4, type: "Moisturize", label: "보습", product: getProductForStep(['크림/로션']), guide: "얇게 펴 발라 수분을 충전하세요.", missing: !getProductForStep(['크림/로션']) },
            { step: 5, type: "Protect", label: "보호", product: getProductForStep(['선케어']), guide: "외출 전 자외선 차단제는 필수! ☀️", missing: !getProductForStep(['선케어']) }
        ],
        Night: [
            { step: 1, type: "Cleansing", label: "세안", product: getProductForStep(['기타']), guide: "꼼꼼한 이중 세안이 중요해요.", missing: false },
            { step: 2, type: "Prep", label: "정돈", product: getProductForStep(['토너/스킨']), guide: "기초를 탄탄히 다지는 단계입니다.", missing: !getProductForStep(['토너/스킨']) },
            { step: 3, type: "Active", label: "활성", product: getProductForStep(['세럼/앰플']), guide: "밤사이 피부가 쉴 수 있게 영양을 듬뿍!", missing: !getProductForStep(['세럼/앰플']) },
            { step: 4, type: "Moisturize", label: "보습", product: getProductForStep(['크림/로션']), guide: "도톰하게 올려 수면팩처럼 활용해보세요.", missing: !getProductForStep(['크림/로션']) }
        ]
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 pt-14 pb-6 bg-white flex-row justify-between items-center z-10">
                <View className="flex-row items-center gap-4">
                    {onBack && (
                        <TouchableOpacity onPress={onBack}>
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">내 화장대 루틴</Text>
                        <Text className="text-sm text-gray-500">제품 관리와 루틴을 한눈에 확인하세요</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setIsSearchModalVisible(true)} className="w-10 h-10 bg-clony-primary/10 rounded-full items-center justify-center">
                    <Ionicons name="search" size={20} color="#00D182" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Daily Routine Suggestion (NEW Integration) */}
                <View className="px-6 py-6 bg-white rounded-b-[40px] shadow-sm mb-6">
                    <Text className="text-clony-primary font-bold text-xs tracking-widest mb-4">DAILY ROUTINE ENGINE</Text>

                    {/* Toggle */}
                    <View className="flex-row bg-gray-100 p-1 rounded-2xl mb-6">
                        <TouchableOpacity
                            onPress={() => setActiveRoutine('Morning')}
                            className={`flex-1 py-3 items-center rounded-xl ${activeRoutine === 'Morning' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`font-bold ${activeRoutine === 'Morning' ? 'text-clony-primary' : 'text-gray-400'}`}>☀️ 아침 루틴</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveRoutine('Night')}
                            className={`flex-1 py-3 items-center rounded-xl ${activeRoutine === 'Night' ? 'bg-gray-800 shadow-sm' : ''}`}
                        >
                            <Text className={`font-bold ${activeRoutine === 'Night' ? 'text-white' : 'text-gray-400'}`}>🌙 밤 루틴</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Steps List */}
                    <View className="gap-3">
                        {routineSteps[activeRoutine].map((step, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                    if (step.product) {
                                        setEditingProduct(step.product);
                                        setIsDetailModalVisible(true);
                                    } else if (step.missing) {
                                        setIsSearchModalVisible(true);
                                    }
                                }}
                                className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100"
                            >
                                <View className={`w-8 h-8 rounded-full items-center justify-center ${activeRoutine === 'Night' ? 'bg-gray-800' : 'bg-clony-primary'}`}>
                                    <Text className="text-white font-bold text-xs">{step.step}</Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center gap-2 mb-0.5">
                                        <Text className={`text-[10px] font-bold ${activeRoutine === 'Night' ? 'text-gray-400' : 'text-clony-primary'}`}>{step.label}</Text>
                                        {step.product && (
                                            <View className="bg-green-100 px-1.5 py-0.5 rounded-md">
                                                <Text className="text-[8px] text-green-700 font-bold">MATCH</Text>
                                            </View>
                                        )}
                                    </View>
                                    {step.product ? (
                                        <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>{step.product.name}</Text>
                                    ) : (
                                        <Text className="font-bold text-gray-400 text-sm">{step.missing ? '제품 추가 필요' : '보습제 단계'}</Text>
                                    )}
                                </View>
                                {step.product && (
                                    <View className="w-10 h-10 bg-white rounded-lg border border-gray-100 items-center justify-center overflow-hidden">
                                        <Image
                                            source={typeof step.product.imageUrl === 'number' ? step.product.imageUrl : { uri: step.product.imageUrl || step.product.image }}
                                            className="w-8 h-8"
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                                {step.missing && (
                                    <View className="w-10 h-10 bg-gray-200/50 rounded-lg border border-dashed border-gray-300 items-center justify-center">
                                        <Ionicons name="search" size={16} color="#9CA3AF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cabinet Section Header */}
                <View className="px-6 flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-xl font-bold text-gray-900">전체 제품 관리</Text>
                        <Text className="text-xs text-gray-500">내 화장대의 모든 제품들 ({cabinet.length})</Text>
                    </View>
                    <View className="bg-red-50 px-3 py-1 rounded-full flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#EF4444" />
                        <Text className="text-red-500 text-xs font-bold">만료 {expiringSoonCount}</Text>
                    </View>
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4">
                    <View className="flex-row gap-2">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full border ${selectedCategory === cat
                                    ? 'bg-gray-900 border-gray-900'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className={`text-sm font-bold ${selectedCategory === cat ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Product Grid */}
                <View className="px-6 flex-row flex-wrap justify-between">
                    {filteredProducts.map((product: any) => (
                        <TouchableOpacity
                            key={product.id}
                            onPress={() => {
                                setEditingProduct(product);
                                setIsDetailModalVisible(true);
                            }}
                            className="w-[48%] bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className={`px-2 py-0.5 rounded-md ${(product as any).isOpened ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    <Text className={`text-[10px] font-bold ${(product as any).isOpened ? 'text-green-600' : 'text-gray-500'}`}>
                                        {(product as any).isOpened ? '사용중' : '미개봉'}
                                    </Text>
                                </View>
                                {(product as any).isOpened && (
                                    <Text className="text-[10px] font-bold text-clony-primary">D-{calculateDDay(product.expiryDate)}</Text>
                                )}
                            </View>

                            <View className="w-20 h-20 items-center justify-center mb-3 overflow-hidden">
                                {typeof ((product as any).imageSafe || (product as any).image) === 'string' && ((product as any).imageSafe || (product as any).image).length < 4 ? (
                                    <Text className="text-4xl">{(product as any).imageSafe || (product as any).image}</Text>
                                ) : (
                                    <Image
                                        source={typeof ((product as any).imageSafe || (product as any).image) === 'string' ? { uri: ((product as any).imageSafe || (product as any).image) } : ((product as any).imageSafe || (product as any).image)}
                                        className="w-20 h-20"
                                        resizeMode="contain"
                                    />
                                )}
                            </View>

                            <Text className="text-xs text-gray-400 mb-0.5">{product.brand}</Text>
                            <Text className="text-sm font-bold text-gray-900 mb-2" numberOfLines={1}>{product.name}</Text>

                            <View className="bg-gray-50 px-2 py-1.5 rounded-lg">
                                <Text className="text-[10px] text-gray-500 text-center">
                                    ~ {product.expiryDate} 까지
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Add Button */}
                    <TouchableOpacity
                        onPress={() => setIsSearchModalVisible(true)}
                        className="w-[48%] bg-gray-50 p-4 rounded-2xl mb-4 border-2 border-dashed border-gray-200 items-center justify-center min-h-[180px]"
                    >
                        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-2 shadow-sm">
                            <Ionicons name="search" size={24} color="#00D182" />
                        </View>
                        <Text className="text-sm font-bold text-gray-400">제품 검색해서 추가</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Search Modal */}
            <Modal
                visible={isSearchModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsSearchModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl h-[80%] pt-4">
                        {/* Modal Header */}
                        <View className="px-6 flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-900">제품 검색</Text>
                            <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View className="px-6 mb-4">
                            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                <Ionicons name="search" size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-2 text-base"
                                    placeholder="브랜드나 제품명을 입력하세요"
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                    autoFocus={true}
                                />
                            </View>
                        </View>

                        {/* Search Results */}
                        <ScrollView className="px-6">
                            {searchResults.length > 0 ? (
                                searchResults.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => addProductToCabinet(item)}
                                        className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm"
                                    >
                                        <View className="w-14 h-14 bg-gray-50 rounded-lg mr-4 items-center justify-center overflow-hidden">
                                            {typeof (item.imageUrl || item.image) === 'string' && (item.imageUrl || item.image).length < 4 ? (
                                                <Text className="text-2xl">{item.imageUrl || item.image}</Text>
                                            ) : (
                                                <Image
                                                    source={typeof (item.imageUrl || item.image) === 'string' ? { uri: (item.imageUrl || item.image) } : (item.imageUrl || item.image)}
                                                    className="w-10 h-10"
                                                    resizeMode="contain"
                                                />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-xs text-gray-400 mb-1">{item.brand}</Text>
                                            <Text className="text-sm font-bold text-gray-900">{item.name}</Text>
                                        </View>
                                        <Ionicons name="add-circle" size={24} color="#00D182" />
                                    </TouchableOpacity>
                                ))
                            ) : searchQuery.length > 0 ? (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">검색 결과가 없습니다.</Text>
                                </View>
                            ) : (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">찾으시는 화장품을 검색해보세요.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Product Detail & Expiry Management Modal */}
            <Modal
                visible={isDetailModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsDetailModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[40px] p-8 pb-12">
                        {editingProduct && (
                            <View>
                                <View className="flex-row justify-between items-center mb-6">
                                    <View>
                                        <Text className="text-xs text-gray-400 font-bold mb-1">{editingProduct.brand}</Text>
                                        <Text className="text-2xl font-bold text-gray-900">{editingProduct.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsDetailModalVisible(false)}>
                                        <Ionicons name="close" size={28} color="#374151" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row gap-6 mb-8">
                                    <View className="w-24 h-24 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                                        <Image
                                            source={typeof (editingProduct.imageUrl || editingProduct.image) === 'string' ? { uri: (editingProduct.imageUrl || editingProduct.image) } : (editingProduct.imageUrl || editingProduct.image)}
                                            className="w-16 h-16"
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View className="flex-1 justify-center">
                                        <View className="flex-row items-center gap-2 mb-2">
                                            <View className={`px-2 py-1 rounded-md ${editingProduct.isOpened ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Text className={`text-xs font-bold ${editingProduct.isOpened ? 'text-green-700' : 'text-gray-600'}`}>
                                                    {editingProduct.isOpened ? '사용 시작' : '미개봉 상태'}
                                                </Text>
                                            </View>
                                            {editingProduct.isOpened && (
                                                <Text className="text-clony-primary font-bold">D-{calculateDDay(editingProduct.expiryDate)}</Text>
                                            )}
                                        </View>
                                        <Text className="text-gray-500 text-xs">유통기한: {editingProduct.expiryDate || '미설정'}</Text>
                                    </View>
                                </View>

                                <View className="space-y-4 mb-8">
                                    <View>
                                        <Text className="text-sm font-bold text-gray-900 mb-2">개봉 여부</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                const now = new Date();
                                                const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
                                                updateProduct(editingProduct.id, {
                                                    isOpened: !editingProduct.isOpened,
                                                    openedDate: !editingProduct.isOpened ? dateStr : undefined
                                                });
                                                setEditingProduct({ ...editingProduct, isOpened: !editingProduct.isOpened });
                                            }}
                                            className={`w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 border-2 ${editingProduct.isOpened ? 'bg-white border-gray-200' : 'bg-green-50 border-clony-primary'}`}
                                        >
                                            <Ionicons name={editingProduct.isOpened ? "hand-right-outline" : "color-wand-outline"} size={20} color={editingProduct.isOpened ? "#6B7280" : "#00D182"} />
                                            <Text className={`font-bold ${editingProduct.isOpened ? 'text-gray-600' : 'text-clony-primary'}`}>
                                                {editingProduct.isOpened ? '사용 완료로 표시' : '지금 개봉하기'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="mt-4">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">유통기한 수정</Text>
                                        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                                            <TextInput
                                                className="flex-1 ml-3 font-bold text-gray-700"
                                                placeholder="YYYY.MM.DD"
                                                defaultValue={editingProduct.expiryDate}
                                                onSubmitEditing={(e) => {
                                                    updateProduct(editingProduct.id, { expiryDate: e.nativeEvent.text });
                                                    setEditingProduct({ ...editingProduct, expiryDate: e.nativeEvent.text });
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        removeFromCabinet(editingProduct.id);
                                        setIsDetailModalVisible(false);
                                    }}
                                    className="w-full py-4 items-center"
                                >
                                    <Text className="text-red-500 font-bold">화장대에서 삭제하기</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default MyCabinetScreen;
