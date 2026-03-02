import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';


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
            restriction?: string;
            matchingScore?: number;
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
    onClose: () => void;
}

export const OCRResultScreen: React.FC<OCRResultScreenProps> = ({ product, onClose }) => {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

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
        if (time === 'Night') return { icon: 'moon', color: '#6B7280', bg: '#F3F4F6', label: t('ocr_result.night_label') };
        if (time === 'Day') return { icon: 'sunny', color: '#F59E0B', bg: '#FEF3C7', label: t('ocr_result.day_label') };
        return { icon: 'time-outline', color: '#10B981', bg: '#ECFDF5', label: t('ocr_result.anytime_label') };
    };

    const timeInfo = product.usageGuide ? getTimeIcon(product.usageGuide.time) : getTimeIcon('Any');

    // Helper for Composition Chart
    const renderCompositionChart = () => {
        if (!product.composition) return null;

        const categories = [
            { key: 'Active', label: t('ocr_result.composition_labels.active'), color: '#F59E0B' },
            { key: 'Moisturizer', label: t('ocr_result.composition_labels.moisturizer'), color: '#3B82F6' },
            { key: 'Calming', label: t('ocr_result.composition_labels.calming'), color: '#10B981' }
            // 'Others' removed to focus on beneficial ingredients as per user request
        ];

        // Recalculate total based only on displayed categories for better visualization
        const total = categories.reduce((acc, cat) => acc + (product.composition?.[cat.key] || 0), 0);
        if (total === 0) return null;

        return (
            <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-2 ml-1">📊 {t('ocr_result.composition_title')}</Text>
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
            <View className="flex-row items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={onClose} className="p-1">
                    <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">{t('ocr_result.title')}</Text>
                <View className="w-8" />
            </View>

            <ScrollView className="flex-1 bg-gray-50">
                {/* 1. Skin Synergy Dashboard - REIMAGINED */}
                <View className="bg-white rounded-b-[40px] shadow-sm mb-4 overflow-hidden">
                    <View className="items-center py-8">
                        <Text className="text-sm font-bold text-clony-primary tracking-widest mb-1 uppercase">{t('ocr_result.synergy_report')}</Text>
                        <Text className="text-2xl font-bold text-gray-900 mb-6">{t('ocr_result.synergy_title')}</Text>

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
                                    <Text className="text-xs text-gray-400 font-bold mb-[-4px]">{t('ocr_result.synergy_label')}</Text>
                                    <Text className="text-5xl font-black text-gray-900">{product.matchingScore}</Text>
                                    <Text className="text-sm font-bold text-gray-400">Perfect</Text>
                                </View>
                            </View>

                            {/* Suitability Badge */}
                            <View className="absolute -bottom-3 bg-clony-primary px-5 py-2 rounded-full shadow-lg shadow-green-200 border-2 border-white">
                                <Text className="text-white font-black text-sm">{product.badge || t('ocr_result.perfect_match')}</Text>
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
                        <Text className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-tighter">{t('ocr_result.highlights_title')}</Text>
                        {(product.fitHighlights || [
                            { label: t('ocr_result.highlights.ingredient_fit'), value: 95 },
                            { label: t('ocr_result.highlights.moisture_balance'), value: 88 },
                            { label: t('ocr_result.highlights.barrier_strengthening'), value: 92 }
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
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">💡 {t('ocr_result.usage_guide_title')}</Text>

                    {/* Time Guide */}
                    <View className="flex-row items-center bg-white p-4 rounded-xl shadow-sm mb-3">
                        <View style={{ backgroundColor: timeInfo.bg }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                            <Ionicons name={timeInfo.icon as any} size={20} color={timeInfo.color} />
                        </View>
                        <View>
                            <Text className="font-bold text-gray-900">{timeInfo.label}</Text>
                            <Text className="text-xs text-gray-400">{t('ocr_result.time_hint')}</Text>
                        </View>
                    </View>

                    {/* Conflicts */}
                    {product.usageGuide && product.usageGuide.conflicts.length > 0 && (
                        <View className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row items-start gap-3">
                            <Ionicons name="alert-circle" size={24} color="#EF4444" />
                            <View className="flex-1">
                                <Text className="font-bold text-red-600 mb-1">{t('ocr_result.conflict_title')}</Text>
                                <Text className="text-sm text-red-500 leading-5">
                                    {t('ocr_result.conflict_hint')}{product.usageGuide.conflicts.join(', ')}
                                </Text>
                            </View>
                        </View>
                    )}
                    {/* Cautions */}
                    {product.usageGuide && product.usageGuide.caution.length > 0 && (
                        <View className="mt-2 bg-orange-50 p-4 rounded-xl border border-orange-100 flex-row items-start gap-3">
                            <Ionicons name="warning-outline" size={24} color="#F59E0B" />
                            <View className="flex-1">
                                <Text className="font-bold text-orange-600 mb-1">{t('ocr_result.caution_title')}</Text>
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
                        <Text className="text-lg font-bold text-gray-900">🧪 {t('ocr_result.core_ingredients_title')}</Text>
                        <View className="bg-gray-100 px-2 py-1 rounded-md">
                            <Text className="text-[10px] font-bold text-gray-500">{t('ocr_result.ai_detected')}</Text>
                        </View>
                    </View>
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        {(product.keyIngredients || []).map((ing, idx) => (
                            <View key={idx} className={`flex-row items-start gap-4 ${idx < product.keyIngredients.length - 1 ? 'mb-5 border-b border-gray-50 pb-5' : ''}`}>
                                <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center border border-teal-100">
                                    <Ionicons name="leaf" size={24} color="#00A676" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-baseline justify-between mb-0.5">
                                        <View className="flex-row items-baseline gap-2">
                                            <Text className="font-bold text-gray-900 text-base">
                                                {ing.name} {/* Always display English name first */}
                                            </Text>
                                            <Text className="text-[10px] text-gray-400 font-bold uppercase">
                                                {ing.nameKo || ing.name} {/* Display Korean name second */}
                                            </Text>
                                        </View>
                                        {ing.matchingScore && ing.matchingScore < 100 && (
                                            <View className="bg-gray-100 px-1.5 py-0.5 rounded">
                                                <Text className="text-[8px] text-gray-400 font-bold">{ing.matchingScore}% Match</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-gray-500 text-xs mb-2 leading-4">{t('ocr_result.ingredient_hint')}</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        <View className="bg-teal-50 px-2 py-1 rounded-lg border border-teal-100/50">
                                            {/* Note: The backend Gemini prompt specifically asks for English 'name' and Korean 'nameKo'.
                                                For 'benefit', it might return Korean. Standardizing translation is ideal, but for now we'll 
                                                display the benefit returned by AI. If English benefit is strictly required, the backend prompt needs an 'effectEn' field.
                                                We'll use English 'name' for the tag to enforce English display if benefit is purely Korean today. */}
                                            <Text className="text-teal-600 font-black text-[10px]"># {ing.benefit}</Text>
                                        </View>
                                        {ing.restriction && (
                                            <View className="bg-red-50 px-2 py-1 rounded-lg border border-red-100/50">
                                                <Text className="text-red-500 font-black text-[10px]"># {ing.restriction.split('\n')[0]}</Text>
                                            </View>
                                        )}
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
                                    <Text className="text-xs font-black text-gray-900 italic">{t('ocr_result.ai_insight')}</Text>
                                </View>
                                <Text className="text-sm text-gray-600 leading-6 font-medium">"{product.ingredientComment}"</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Precautions (Warnings) */}
                {product.warnings.length > 0 && (
                    <View className="px-6 mb-4">
                        <Text className="text-lg font-bold text-red-500 mb-3 ml-1">⚠️ {t('ocr_result.precautions_title')}</Text>
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
                    <Text className="text-lg font-bold text-gray-900 mb-3 ml-1">✨ {t('ocr_result.effect_summary_title')}</Text>
                    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                        <View className="absolute top-0 right-0 p-4 opacity-10">
                            <Ionicons name="sparkles" size={60} color="#00A676" />
                        </View>
                        <Text className="text-gray-800 text-base leading-relaxed font-medium pr-4">
                            "{product.effectSummary}"
                        </Text>
                        <View className="mt-3 flex-row items-center justify-end gap-1">
                            <Text className="text-xs text-gray-400">{t('ocr_result.ai_info')}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default OCRResultScreen;
