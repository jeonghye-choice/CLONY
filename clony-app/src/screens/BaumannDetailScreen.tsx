import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface BaumannDetailScreenProps {
    visible: boolean;
    onClose: () => void;
    skinType: string;
    scores?: {
        OD: number; // Oily/Dry score (1-5 scale, 3 questions)
        SR: number; // Sensitive/Resistant score
        PN: number; // Pigmented/Non-Pigmented score
        TW: number; // Tight/Wrinkled score
    };
    onRetakeSurvey?: () => void;
}

const BaumannDetailScreen: React.FC<BaumannDetailScreenProps> = ({
    visible,
    onClose,
    skinType,
    scores,
    onRetakeSurvey
}) => {
    const { t } = useTranslation();

    // Calculate percentages from scores (each category has 3 questions, max 15 points)
    const calculatePercentage = (score: number) => {
        // Score range: 3-15 (3 questions × 1-5 points)
        // Convert to percentage: (score - 3) / 12 * 100
        return Math.round(((score - 3) / 12) * 100);
    };

    const categories = [
        {
            id: 'OD',
            title: t('baumann.detail.od_title'),
            leftLabel: t('baumann.detail.od_dry'),
            rightLabel: t('baumann.detail.od_oily'),
            leftIcon: '💧',
            rightIcon: '✨',
            score: scores?.OD || 9,
            currentType: skinType[0] === 'D' ? 'left' : 'right',
            leftColor: 'bg-blue-500',
            rightColor: 'bg-yellow-500',
        },
        {
            id: 'SR',
            title: t('baumann.detail.sr_title'),
            leftLabel: t('baumann.detail.sr_resistant'),
            rightLabel: t('baumann.detail.sr_sensitive'),
            leftIcon: '🛡️',
            rightIcon: '🌸',
            score: scores?.SR || 9,
            currentType: skinType[1] === 'R' ? 'left' : 'right',
            leftColor: 'bg-green-500',
            rightColor: 'bg-red-500',
        },
        {
            id: 'PN',
            title: t('baumann.detail.pn_title'),
            leftLabel: t('baumann.detail.pn_non'),
            rightLabel: t('baumann.detail.pn_pigmented'),
            leftIcon: '✨',
            rightIcon: '🌞',
            score: scores?.PN || 9,
            currentType: skinType[2] === 'N' ? 'left' : 'right',
            leftColor: 'bg-purple-500',
            rightColor: 'bg-orange-500',
        },
        {
            id: 'TW',
            title: t('baumann.detail.tw_title'),
            leftLabel: t('baumann.detail.tw_tight'),
            rightLabel: t('baumann.detail.tw_wrinkled'),
            leftIcon: '🥚',
            rightIcon: '〰️',
            score: scores?.TW || 9,
            currentType: skinType[3] === 'T' ? 'left' : 'right',
            leftColor: 'bg-teal-500',
            rightColor: 'bg-gray-500',
        },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ScrollView className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-bold text-gray-900">{t('baumann.detail.title')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#1F2937" />
                        </TouchableOpacity>
                    </View>
                    <View className="bg-clony-primary/10 px-4 py-3 rounded-2xl border border-clony-primary/20">
                        <Text className="text-center text-lg font-bold text-clony-primary">
                            #{skinType}
                        </Text>
                    </View>
                </View>

                {/* Category Analysis */}
                <View className="px-6 py-6">
                    <Text className="text-sm text-gray-500 mb-6 text-center">
                        {t('baumann.detail.subtitle')}
                    </Text>

                    {categories.map((category, index) => {
                        const percentage = calculatePercentage(category.score);
                        const isLeft = percentage < 50;
                        const displayPercentage = isLeft ? 100 - percentage : percentage;
                        const label = category.currentType === 'left' ? category.leftLabel : category.rightLabel;

                        return (
                            <View key={category.id} className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
                                {/* Category Title */}
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-bold text-gray-900">{category.title}</Text>
                                    <View className={`px-3 py-1 rounded-full ${category.currentType === 'left' ? category.leftColor : category.rightColor}`}>
                                        <Text className="text-white text-xs font-bold">
                                            {label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Labels */}
                                <View className="flex-row justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-2xl">{category.leftIcon}</Text>
                                        <Text className="text-sm font-bold text-gray-600">{category.leftLabel}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-sm font-bold text-gray-600">{category.rightLabel}</Text>
                                        <Text className="text-2xl">{category.rightIcon}</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View className="h-8 bg-gray-100 rounded-full overflow-hidden flex-row">
                                    <View
                                        className={`${category.leftColor} items-center justify-center`}
                                        style={{ width: `${100 - percentage}%` }}
                                    >
                                        {!isLeft && (100 - percentage) > 15 && (
                                            <Text className="text-white text-xs font-bold">{100 - percentage}%</Text>
                                        )}
                                    </View>
                                    <View
                                        className={`${category.rightColor} items-center justify-center`}
                                        style={{ width: `${percentage}%` }}
                                    >
                                        {isLeft && percentage > 15 && (
                                            <Text className="text-white text-xs font-bold">{percentage}%</Text>
                                        )}
                                    </View>
                                </View>

                                {/* Current Type Indicator */}
                                <View className="mt-3">
                                    <Text className="text-center text-sm text-gray-500">
                                        {t('baumann.detail.type_summary', { percentage: displayPercentage, label })}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* Retake Survey Button */}
                    <TouchableOpacity
                        onPress={() => {
                            onClose();
                            onRetakeSurvey?.();
                        }}
                        className="bg-gray-900 rounded-2xl p-5 mt-4 flex-row items-center justify-center gap-2"
                    >
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text className="text-white font-bold text-base">{t('baumann.detail.retake')}</Text>
                    </TouchableOpacity>

                    <Text className="text-xs text-gray-400 text-center mt-4">
                        {t('baumann.detail.seasonal_hint')}
                    </Text>
                </View>
            </ScrollView>
        </Modal>
    );
};

export default BaumannDetailScreen;
