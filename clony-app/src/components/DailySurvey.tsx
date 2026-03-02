import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DailySurveyProps {
    visible: boolean;
    onComplete: (result: any) => void;
}

const DailySurvey = ({ visible, onComplete }: DailySurveyProps) => {
    // 1-5 Scale: 1 (Very Good) -> 5 (Very Bad/Dry/Sensitive)
    const [dryness, setDryness] = useState(3);
    const [sensitivity, setSensitivity] = useState(3);

    const handleSubmit = () => {
        // Normalize 1-5 to -1 to 1 Scale for compatibility with main logic if needed, 
        // OR just pass raw 1-5 for specific Daily Score calc.
        // Let's pass raw values for now.
        onComplete({
            mode: 'DAILY',
            dryness,
            sensitivity
        });
    };

    const renderSlider = (label: string, value: number, setValue: (v: number) => void, leftText: string, rightText: string) => (
        <View className="mb-8">
            <Text className="text-gray-900 font-bold text-lg mb-4">{label}</Text>
            <View className="flex-row justify-between mb-2 px-2">
                <Text className="text-gray-400 text-xs">{leftText}</Text>
                <Text className="text-gray-400 text-xs">{rightText}</Text>
            </View>
            <View className="flex-row justify-between items-center bg-gray-100 rounded-full p-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                        key={level}
                        onPress={() => setValue(level)}
                        className={`w-12 h-12 rounded-full items-center justify-center ${value === level ? 'bg-clony-primary shadow-md' : 'bg-transparent'}`}
                    >
                        <Text className={`font-bold ${value === level ? 'text-white' : 'text-gray-400'}`}>{level}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-white px-6 pt-16">
                <Text className="text-clony-primary font-bold text-sm mb-2 tracking-widest uppercase">Daily Check</Text>
                <Text className="text-3xl font-black text-gray-900 mb-8">오늘의 피부 컨디션은?</Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {renderSlider("1. 오늘 피부 당김이 느껴지나요?", dryness, setDryness, "촉촉함", "매우 건조")}
                    {renderSlider("2. 자극이나 붉은기가 있나요?", sensitivity, setSensitivity, "편안함", "매우 민감")}
                </ScrollView>

                <View className="pb-12">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="bg-black w-full py-4 rounded-2xl items-center shadow-lg transform transition active:scale-95"
                    >
                        <Text className="text-white font-bold text-lg">분석 완료하기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default DailySurvey;
