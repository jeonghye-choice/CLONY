import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateItemPrice } from '../contexts/CartContext';

interface SampleDurationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (duration: 3 | 5 | 7 | 14) => void;
    basePrice: number;
    productName: string;
}

// Kit pricing function (fixed prices)
const getKitPrice = (duration: 3 | 5 | 7 | 14): number => {
    const prices: { [key: number]: number } = {
        3: 1470,
        5: 1960,
        7: 2450,
        14: 3920
    };
    return prices[duration] || 2450;
};

const SampleDurationPicker: React.FC<SampleDurationPickerProps> = ({
    visible,
    onClose,
    onSelect,
    basePrice,
    productName,
}) => {
    const durations: Array<{ days: 3 | 5 | 7 | 14; label: string }> = [
        { days: 3, label: '3일' },
        { days: 5, label: '5일' },
        { days: 7, label: '7일' },
        { days: 14, label: '2주' },
    ];

    const handleSelect = (duration: 3 | 5 | 7 | 14) => {
        onSelect(duration);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-[30px] p-6 pb-10">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xl font-bold text-gray-900">샘플 기간 선택</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-sm text-gray-500 mb-6" numberOfLines={1}>
                        {productName}
                    </Text>

                    {/* Duration Options */}
                    <View className="gap-3">
                        {durations.map((option) => {
                            const price = calculateItemPrice(basePrice, option.days);
                            return (
                                <TouchableOpacity
                                    key={option.days}
                                    onPress={() => handleSelect(option.days)}
                                    className="flex-row items-center justify-between bg-gray-50 p-5 rounded-2xl border-2 border-gray-100 active:border-clony-primary"
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-12 h-12 bg-white rounded-full items-center justify-center border border-gray-200">
                                            <Text className="text-lg font-bold text-clony-primary">
                                                {option.days}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-base font-bold text-gray-900">
                                                {option.label} 샘플
                                            </Text>
                                            <Text className="text-xs text-gray-400">
                                                체험용으로 딱 좋아요
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-lg font-bold text-gray-900">
                                        {price.toLocaleString()}원
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View className="mt-6 bg-green-50 p-4 rounded-2xl">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="information-circle" size={20} color="#00D182" />
                            <Text className="text-xs text-gray-600 flex-1">
                                샘플 키트는 선택한 기간만큼 사용할 수 있는 용량으로 배송됩니다
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default SampleDurationPicker;
