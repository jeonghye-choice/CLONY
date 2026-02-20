import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OCRResultScreenProps {
    product: {
        id: string;
        name: string;
        brand: string;
        category: string;
        image: any;
        matchingScore: number;
        skinType: string;
        keyIngredients: Array<{
            name: string;
            nameKo: string;
            benefit: string;
            type?: string;
        }>;
        composition?: { [key: string]: number };
        usageGuide?: {
            time: string;
            conflicts: string[];
            caution: string[];
        };
        warnings: string[];
        effectSummary: string;
        ingredientComment?: string;
        price: number;
        badge?: string;
        fitHighlights?: Array<{ label: string; value: number }>;
    };
    onAddToCart: () => void;
    onClose: () => void;
    onCartPress: () => void;
}

export const OCRResultScreen: React.FC<OCRResultScreenProps> = ({ product, onAddToCart, onClose, onCartPress }) => {

    const getImageSource = () => {
        // @ts-ignore
        const url = product.image || product.imageUrl || product.image_url;
        if (url && typeof url === 'string' && url.trim().length > 0 && url.startsWith('http')) {
            return { uri: url };
        }
        if (url && typeof url !== 'string') {
            return url;
        }
        return null;
    };

    // Helper for Usage Time Icon
    const getTimeIcon = (time: string) => {
        if (time === 'Night') return { icon: 'moon', color: '#6B7280', bg: '#F3F4F6', label: '밤 사용 권장' };
        if (time === 'Day') return { icon: 'sunny', color: '#F59E0B', bg: '#FEF3C7', label: '낮 사용 권장' };
        return { icon: 'time-outline', color: '#10B981', bg: '#ECFDF5', label: '하루 중 언제든 사용 가능' };
    };

    const timeInfo = product.usageGuide ? getTimeIcon(product.usageGuide.time) : getTimeIcon('Any');

    // Helper for Composition Chart
    const renderCompositionChart = () => {
        if (!product.composition) return null;

        const categories = [
            { key: 'Active', label: '효능', color: '#F59E0B' },
            { key: 'Moisturizer', label: '보습', color: '#3B82F6' },
            { key: 'Calming', label: '진정', color: '#10B981' }
            // 'Others' removed to focus on beneficial ingredients as per user request
        ];

        // Recalculate total based only on displayed categories for better visualization
        const total = categories.reduce((acc, cat) => acc + (product.composition?.[cat.key] || 0), 0);
        if (total === 0) return null;

        return (
            <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-2 ml-1">📊 성분 구성 비율</Text>
                <View className="flex-row h-4 rounded-full overflow-hidden mb-2">
                    {categories.map(cat => {
                        const count = product.composition?.[cat.key] || 0;
                        const width = (count / total) * 100;
                        if (width === 0) return null;
                        return <View key={cat.key} style={{ width: `${width}%`, backgroundColor: cat.color }} />;
                    })}
                </View>
                <View className="flex-row justify-between">
                    {categories.map(cat => {
                        const count = product.composition?.[cat.key] || 0;
                        if (count === 0) return null;
                        return (
                            <View key={cat.key} className="flex-row items-center gap-1">
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                                <Text className="text-xs text-gray-500">{cat.label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={onClose} className="p-1">
                    <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">분석 결과</Text>
                <TouchableOpacity onPress={onCartPress} className="p-1 relative">
                    <Ionicons name="cart-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 bg-gray-50">
                {/* 1. Skin Synergy Dashboard - REIMAGINED */}
                <View className="bg-white rounded-b-[40px] shadow-sm mb-4 overflow-hidden">
                    <View className="items-center py-8">
                        <Text className="text-sm font-bold text-clony-primary tracking-widest mb-1 uppercase">Skin-Synergy Report</Text>
                        <Text className="text-2xl font-bold text-gray-900 mb-6">피부 궁합 분석 결과</Text>

                        {/* Animated Synergy Gauge - Advanced Mockup */}
                        <View className="relative items-center justify-center mb-6">
                            <View className="w-40 h-40 rounded-full border-[10px] border-gray-50 items-center justify-center bg-white shadow-xl">
                                <View className="absolute inset-0">
                                    <View
                                        className="w-full h-full rounded-full border-[10px] border-clony-primary"
                                        style={{
                                            borderTopColor: 'transparent',
                                            borderRightColor: 'transparent',
                                            transform: [{ rotate: '45deg' }]
                                        }}
                                    />
                                </View>
                                <View className="items-center">
                                    <Text className="text-xs text-gray-400 font-bold mb-[-4px]">Synergy</Text>
                                    <Text className="text-5xl font-black text-gray-900">{product.matchingScore}</Text>
                                    <Text className="text-sm font-bold text-gray-400">Perfect</Text>
                                </View>
                            </View>

                            {/* Suitability Badge */}
                            <View className="absolute -bottom-3 bg-clony-primary px-5 py-2 rounded-full shadow-lg shadow-green-200 border-2 border-white">
                                <Text className="text-white font-black text-sm">{product.badge || '찰떡궁합'}</Text>
                            </View>
                        </View>

                        {/* Product Spotlight - Text Only */}
                        <View className="px-8 mt-4 pt-6 border-t border-gray-50 w-full items-center">
                            <Text className="text-sm text-gray-400 font-bold mb-1">{product.brand}</Text>
                            <Text className="text-xl font-bold text-gray-900 text-center px-4" numberOfLines={2}>{product.name}</Text>
                        </View>
                    </View>

                    {/* Fit Points Breakdown */}
                    <View className="px-8 pb-8">
                        <Text className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-tighter">Skin Fit Highlights</Text>
                        {(product.fitHighlights || [
                            { label: '성분 적합성', value: 95 },
                            { label: '수분 밸런스', value: 88 },
                            { label: '장벽 강화', value: 92 }
                        ]).map((highlight, idx) => (
                            <View key={idx} className="mb-3">
                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-sm font-bold text-gray-700">{highlight.label}</Text>
                                    <Text className="text-sm font-black text-clony-primary">{highlight.value}%</Text>
                                </View>
                                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-clony-primary rounded-full"
                                        style={{ width: `${highlight.value}%` }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 2. Usage Guide & Warnings - New Section */}
                <View className="px-6 mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">💡 사용 가이드</Text>

                    {/* Time Guide */}
                    <View className="flex-row items-center bg-white p-4 rounded-xl shadow-sm mb-3">
                        <View style={{ backgroundColor: timeInfo.bg }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                            <Ionicons name={timeInfo.icon as any} size={20} color={timeInfo.color} />
                        </View>
                        <View>
                            <Text className="font-bold text-gray-900">{timeInfo.label}</Text>
                            <Text className="text-xs text-gray-400">성분 특성에 따른 권장 시간입니다.</Text>
                        </View>
                    </View>

                    {/* Conflicts */}
                    {product.usageGuide && product.usageGuide.conflicts.length > 0 && (
                        <View className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row items-start gap-3">
                            <Ionicons name="alert-circle" size={24} color="#EF4444" />
                            <View className="flex-1">
                                <Text className="font-bold text-red-600 mb-1">성분 충돌 주의</Text>
                                <Text className="text-sm text-red-500 leading-5">
                                    함께 사용 시 자극이 될 수 있는 성분이 포함되어 있습니다: {product.usageGuide.conflicts.join(', ')}
                                </Text>
                            </View>
                        </View>
                    )}
                    {/* Cautions */}
                    {product.usageGuide && product.usageGuide.caution.length > 0 && (
                        <View className="mt-2 bg-orange-50 p-4 rounded-xl border border-orange-100 flex-row items-start gap-3">
                            <Ionicons name="warning-outline" size={24} color="#F59E0B" />
                            <View className="flex-1">
                                <Text className="font-bold text-orange-600 mb-1">사용 시 주의</Text>
                                {product.usageGuide.caution.map((c, i) => (
                                    <Text key={i} className="text-sm text-orange-500 leading-5">- {c}</Text>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* 3. Composition Chart - New Section */}
                <View className="px-6 mb-4">
                    {renderCompositionChart()}
                </View>

                {/* 4. Core Ingredients & Effects */}
                <View className="px-6 mb-4">
                    <View className="flex-row items-center justify-between mb-3 ml-1">
                        <Text className="text-lg font-bold text-gray-900">🧪 핵심 성분 분석</Text>
                        <View className="bg-gray-100 px-2 py-1 rounded-md">
                            <Text className="text-[10px] font-bold text-gray-500">AI DETECTED</Text>
                        </View>
                    </View>
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        {(product.keyIngredients || []).map((ing, idx) => (
                            <View key={idx} className={`flex-row items-start gap-4 ${idx < product.keyIngredients.length - 1 ? 'mb-5 border-b border-gray-50 pb-5' : ''}`}>
                                <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center border border-teal-100">
                                    <Ionicons name="leaf" size={24} color="#00D182" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-baseline gap-2 mb-0.5">
                                        <Text className="font-bold text-gray-900 text-base">{ing.nameKo}</Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase">{ing.name}</Text>
                                    </View>
                                    <Text className="text-gray-500 text-xs mb-2 leading-4">이 화장품의 핵심 보습과 장벽 케어를 담당합니다.</Text>
                                    <View className="bg-teal-50 self-start px-2 py-1 rounded-lg border border-teal-100/50">
                                        <Text className="text-teal-600 font-black text-[10px]"># {ing.benefit}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        {/* Analysis Comment Bubble */}
                        {product.ingredientComment && (
                            <View className="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <View className="bg-gray-900 w-5 h-5 rounded-full items-center justify-center">
                                        <Ionicons name="sparkles" size={12} color="white" />
                                    </View>
                                    <Text className="text-xs font-black text-gray-900 italic">Clony AI Expert Insight</Text>
                                </View>
                                <Text className="text-sm text-gray-600 leading-6 font-medium">"{product.ingredientComment}"</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Precautions (Warnings) */}
                {product.warnings.length > 0 && (
                    <View className="px-6 mb-4">
                        <Text className="text-lg font-bold text-red-500 mb-3 ml-1">⚠️ 주의해야 할 점</Text>
                        <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
                            {product.warnings.map((warn, idx) => (
                                <View key={idx} className="flex-row items-start gap-2 mb-2 last:mb-0">
                                    <Ionicons name="alert-circle" size={18} color="#EF4444" className="mt-0.5" />
                                    <Text className="text-red-800 text-sm flex-1 leading-relaxed">{warn}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}


                {/* 3. Ingredient Effect Summary */}
                <View className="px-6 mb-8">
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">✨ 성분 기대 효과</Text>
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                        <View className="absolute top-0 right-0 p-4 opacity-10">
                            <Ionicons name="sparkles" size={60} color="#00D182" />
                        </View>
                        <Text className="text-gray-800 text-base leading-relaxed font-medium pr-4">
                            "{product.effectSummary}"
                        </Text>
                        <View className="mt-3 flex-row items-center justify-end gap-1">
                            <Text className="text-xs text-gray-400">AI 성분 분석 정보</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            {/* CTA Button & Delivery Info */}
            <View className="px-6 pt-4 pb-8 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-[20px]">
                <View className="flex-row items-center justify-center gap-1.5 mb-3">
                    <Ionicons name="bicycle" size={16} color="#00D182" />
                    <Text className="text-gray-500 text-xs font-bold">지금 주문하면 <Text className="text-clony-primary">오늘 밤 숙소로 배송</Text> 완료!</Text>
                </View>

                <View className="flex-row items-center gap-4">
                    <View>
                        <Text className="text-xs text-gray-400 line-through">₩30,000</Text>
                        <Text className="text-xl font-bold text-gray-900">₩{product.price.toLocaleString()}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={onAddToCart}
                        className="flex-1 bg-clony-primary py-4 rounded-2xl items-center shadow-lg shadow-green-200"
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="cart" size={20} color="white" />
                            <Text className="text-white font-bold text-lg">장바구니 담기</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView >
    );
};

export default OCRResultScreen;
