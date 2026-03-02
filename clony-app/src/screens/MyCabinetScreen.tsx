import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface MyCabinetScreenProps {
    onScanPress: () => void;
    onBack?: () => void;
}

const MyCabinetScreen: React.FC<MyCabinetScreenProps> = ({ onScanPress, onBack }) => {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const { cabinet, addToCabinet, removeFromCabinet, updateProduct } = require('../contexts/ProductContext').useProduct();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const categoryMap = [
        { key: 'all', label: t('analysis.categories.all') },
        { key: 'toner', label: t('analysis.categories.toner') },
        { key: 'serum', label: t('analysis.categories.serum') },
        { key: 'moisturizing', label: t('analysis.categories.moisturizing') },
        { key: 'suncare', label: t('analysis.categories.suncare') },
        { key: 'other', label: t('analysis.categories.other') }
    ];

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

    const filteredProducts = selectedCategory === 'all'
        ? cabinet
        : cabinet.filter((p: any) => p.category === selectedCategory);

    const [activeRoutine, setActiveRoutine] = useState<'Morning' | 'Night'>('Morning');

    const getProductForStep = (cats: string[]) => {
        return cabinet.find((p: any) => cats.includes(p.category)) || null;
    };

    const routineSteps = {
        Morning: [
            { step: 1, type: "Cleansing", label: t('cabinet.routine_steps.cleansing.label'), product: getProductForStep(['cleansing', 'other']), guide: t('cabinet.routine_steps.cleansing.guide_morning'), missing: false },
            { step: 2, type: "Prep", label: t('cabinet.routine_steps.prep.label'), product: getProductForStep(['toner']), guide: t('cabinet.routine_steps.prep.guide_morning'), missing: !getProductForStep(['toner']) },
            { step: 3, type: "Active", label: t('cabinet.routine_steps.active.label'), product: getProductForStep(['serum']), guide: t('cabinet.routine_steps.active.guide_morning'), missing: !getProductForStep(['serum']) },
            { step: 4, type: "Moisturize", label: t('cabinet.routine_steps.moisturize.label'), product: getProductForStep(['moisturizing']), guide: t('cabinet.routine_steps.moisturize.guide_morning'), missing: !getProductForStep(['moisturizing']) },
            { step: 5, type: "Protect", label: t('cabinet.routine_steps.protect.label'), product: getProductForStep(['suncare']), guide: t('cabinet.routine_steps.protect.guide_morning'), missing: !getProductForStep(['suncare']) }
        ],
        Night: [
            { step: 1, type: "Cleansing", label: t('cabinet.routine_steps.cleansing.label'), product: getProductForStep(['cleansing', 'other']), guide: t('cabinet.routine_steps.cleansing.guide_night'), missing: false },
            { step: 2, type: "Prep", label: t('cabinet.routine_steps.prep.label'), product: getProductForStep(['toner']), guide: t('cabinet.routine_steps.prep.guide_night'), missing: !getProductForStep(['toner']) },
            { step: 3, type: "Active", label: t('cabinet.routine_steps.active.label'), product: getProductForStep(['serum']), guide: t('cabinet.routine_steps.active.guide_night'), missing: !getProductForStep(['serum']) },
            { step: 4, type: "Moisturize", label: t('cabinet.routine_steps.moisturize.label'), product: getProductForStep(['moisturizing']), guide: t('cabinet.routine_steps.moisturize.guide_night'), missing: !getProductForStep(['moisturizing']) }
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
                        <Text className="text-2xl font-bold text-gray-900">{t('cabinet.routine_title')}</Text>
                        <Text className="text-sm text-gray-500">{t('cabinet.routine_subtitle')}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setIsSearchModalVisible(true)} className="w-10 h-10 bg-clony-primary/10 rounded-full items-center justify-center">
                    <Ionicons name="search" size={20} color="#00D182" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Daily Routine Suggestion */}
                <View className="px-6 py-6 bg-white rounded-b-[40px] shadow-sm mb-6">
                    <Text className="text-clony-primary font-bold text-xs tracking-widest mb-4">{t('cabinet.daily_routine_engine')}</Text>

                    {/* Toggle */}
                    <View className="flex-row bg-gray-100 p-1 rounded-2xl mb-6">
                        <TouchableOpacity
                            onPress={() => setActiveRoutine('Morning')}
                            className={`flex-1 py-3 items-center rounded-xl ${activeRoutine === 'Morning' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`font-bold ${activeRoutine === 'Morning' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('cabinet.morning_routine')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveRoutine('Night')}
                            className={`flex-1 py-3 items-center rounded-xl ${activeRoutine === 'Night' ? 'bg-gray-800 shadow-sm' : ''}`}
                        >
                            <Text className={`font-bold ${activeRoutine === 'Night' ? 'text-white' : 'text-gray-400'}`}>{t('cabinet.night_routine')}</Text>
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
                                                <Text className="text-[8px] text-green-700 font-bold">{t('cabinet.match_badge')}</Text>
                                            </View>
                                        )}
                                    </View>
                                    {step.product ? (
                                        <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
                                            {t(step.product.name, { defaultValue: step.product.name })}
                                        </Text>
                                    ) : (
                                        <Text className="font-bold text-gray-400 text-sm">
                                            {step.missing ? t('cabinet.routine_steps.missing') : t('cabinet.routine_steps.moisturizer_step')}
                                        </Text>
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
                        <Text className="text-xl font-bold text-gray-900">{t('cabinet.all_products_title')}</Text>
                        <Text className="text-xs text-gray-500">{t('cabinet.total_products', { count: cabinet.length })}</Text>
                    </View>
                    <View className="bg-red-50 px-3 py-1 rounded-full flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#EF4444" />
                        <Text className="text-red-500 text-xs font-bold">{t('cabinet.expiring_soon', { count: expiringSoonCount })}</Text>
                    </View>
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4">
                    <View className="flex-row gap-2">
                        {categoryMap.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => setSelectedCategory(cat.key)}
                                className={`px-4 py-2 rounded-full border ${selectedCategory === cat.key
                                    ? 'bg-gray-900 border-gray-900'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className={`text-sm font-bold ${selectedCategory === cat.key ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {cat.label}
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
                                <View className={`px-2 py-0.5 rounded-md ${product.isOpened ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    <Text className={`text-[10px] font-bold ${product.isOpened ? 'text-green-600' : 'text-gray-500'}`}>
                                        {product.isOpened ? t('cabinet.opened_status') : t('cabinet.not_opened_status')}
                                    </Text>
                                </View>
                                {product.isOpened && (
                                    <Text className="text-[10px] font-bold text-clony-primary">{t('cabinet.d_day', { count: calculateDDay(product.expiryDate) ?? undefined })}</Text>
                                )}
                            </View>

                            <View className="w-20 h-20 items-center justify-center mb-3 overflow-hidden">
                                {typeof (product.imageSafe || product.image) === 'string' && (product.imageSafe || product.image).length < 4 ? (
                                    <Text className="text-4xl">{product.imageSafe || product.image}</Text>
                                ) : (
                                    <Image
                                        source={typeof (product.imageSafe || product.image) === 'string' ? { uri: (product.imageSafe || product.image) } : (product.imageSafe || product.image)}
                                        className="w-20 h-20"
                                        resizeMode="contain"
                                    />
                                )}
                            </View>

                            <Text className="text-xs text-gray-400 mb-0.5">{product.brand}</Text>
                            <Text className="text-sm font-bold text-gray-900 mb-2" numberOfLines={1}>
                                {t(product.name, { defaultValue: product.name })}
                            </Text>

                            <View className="bg-gray-50 px-2 py-1.5 rounded-lg">
                                <Text className="text-[10px] text-gray-500 text-center">
                                    {t('cabinet.expiry_until', { date: product.expiryDate || 'N/A' })}
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
                        <Text className="text-sm font-bold text-gray-400 text-center">{t('cabinet.add_search_btn')}</Text>
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
                            <Text className="text-xl font-bold text-gray-900">{t('cabinet.search_title')}</Text>
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
                                    placeholder={t('home.cabinet.search_placeholder')}
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
                                            <Text className="text-sm font-bold text-gray-900">
                                                {t(item.name, { defaultValue: item.name })}
                                            </Text>
                                        </View>
                                        <Ionicons name="add-circle" size={24} color="#00D182" />
                                    </TouchableOpacity>
                                ))
                            ) : searchQuery.length > 0 ? (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">{t('home.cabinet.empty_results')}</Text>
                                </View>
                            ) : (
                                <View className="items-center py-10">
                                    <Text className="text-gray-400">{t('cabinet.search_hint_empty')}</Text>
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
                                        <Text className="text-2xl font-bold text-gray-900">
                                            {t(editingProduct.name, { defaultValue: editingProduct.name })}
                                        </Text>
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
                                                    {editingProduct.isOpened ? t('cabinet.opened_status') : t('cabinet.not_opened_status')}
                                                </Text>
                                            </View>
                                            {editingProduct.isOpened && (
                                                <Text className="text-clony-primary font-bold">{t('cabinet.d_day', { count: calculateDDay(editingProduct.expiryDate) ?? undefined })}</Text>
                                            )}
                                        </View>
                                        <Text className="text-gray-500 text-xs">{t('cabinet.expiry_date_label')} {editingProduct.expiryDate || t('cabinet.expiry_not_set')}</Text>
                                    </View>
                                </View>

                                <View className="space-y-4 mb-8">
                                    <View>
                                        <Text className="text-sm font-bold text-gray-900 mb-2">{isKorean ? '개봉 여부' : 'Open Status'}</Text>
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
                                                {editingProduct.isOpened ? t('cabinet.usage_completed') : t('cabinet.open_now')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="mt-4">
                                        <Text className="text-sm font-bold text-gray-900 mb-2">{t('cabinet.edit_expiry')}</Text>
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
                                    <Text className="text-red-500 font-bold">{t('cabinet.remove_from_cabinet')}</Text>
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
