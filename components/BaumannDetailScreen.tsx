import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    // Calculate percentages from scores (each category has 3 questions, max 15 points)
    const calculatePercentage = (score: number) => {
        // Score range: 3-15 (3 questions × 1-5 points)
        // Convert to percentage: (score - 3) / 12 * 100
        return Math.round(((score - 3) / 12) * 100);
    };

    const categories = [
        {
            id: 'OD',
            title: '유분 vs 수분',
            leftLabel: '건성',
            rightLabel: '지성',
            leftIcon: '💧',
            rightIcon: '✨',
            score: scores?.OD || 9,
            currentType: skinType[0] === 'D' ? 'left' : 'right',
            leftColor: 'bg-blue-500',
            rightColor: 'bg-yellow-500',
        },
        {
            id: 'SR',
            title: '민감도',
            leftLabel: '저항성',
            rightLabel: '민감성',
            leftIcon: '🛡️',
            rightIcon: '🌸',
            score: scores?.SR || 9,
            currentType: skinType[1] === 'R' ? 'left' : 'right',
            leftColor: 'bg-green-500',
            rightColor: 'bg-red-500',
        },
        {
            id: 'PN',
            title: '색소침착',
            leftLabel: '비색소',
            rightLabel: '색소침착',
            leftIcon: '✨',
            rightIcon: '🌞',
            score: scores?.PN || 9,
            currentType: skinType[2] === 'N' ? 'left' : 'right',
            leftColor: 'bg-purple-500',
            rightColor: 'bg-orange-500',
        },
        {
            id: 'TW',
            title: '탄력',
            leftLabel: '탄력있음',
            rightLabel: '주름',
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
                        <Text className="text-2xl font-bold text-gray-900">피부 타입 상세 분석</Text>
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
                        MBTI처럼 각 카테고리별로 당신의 피부 특성을 분석했어요
                    </Text>

                    {categories.map((category, index) => {
                        const percentage = calculatePercentage(category.score);
                        const isLeft = percentage < 50;
                        const displayPercentage = isLeft ? 100 - percentage : percentage;

                        return (
                            <View key={category.id} className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
                                {/* Category Title */}
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-bold text-gray-900">{category.title}</Text>
                                    <View className={`px-3 py-1 rounded-full ${category.currentType === 'left' ? category.leftColor : category.rightColor}`}>
                                        <Text className="text-white text-xs font-bold">
                                            {category.currentType === 'left' ? category.leftLabel : category.rightLabel}
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
                                        당신은 <Text className="font-bold text-gray-900">{displayPercentage}%</Text> {category.currentType === 'left' ? category.leftLabel : category.rightLabel} 성향입니다
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
                        <Text className="text-white font-bold text-base">재진단 하기</Text>
                    </TouchableOpacity>

                    <Text className="text-xs text-gray-400 text-center mt-4">
                        피부 상태는 계절, 환경, 생활습관에 따라 변할 수 있어요
                    </Text>
                </View>
            </ScrollView>
        </Modal>
    );
};

export default BaumannDetailScreen;
