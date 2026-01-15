import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SurveyResult {
    O_D: number; // Oily vs Dry Score
    S_R: number; // Sensitive vs Resistant Score
    P_N: number; // Pigmented vs Non-pigmented Score
    W_T: number; // Wrinkled vs Tight Score
}

const ScientificSurvey = ({ visible, onComplete }: { visible: boolean, onComplete: (result: SurveyResult) => void }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]); // -1, 0, 1

    const questions = [
        {
            id: 'OD',
            text: "세안 1시간 후, 아무것도 바르지 않았을 때 피부 느낌은?",
            options: [
                { label: "얼굴 전체가 당기고 건조하다", val: -1 }, // Dry
                { label: "T존만 살짝 번들거린다", val: 0 },    // Normal
                { label: "얼굴 전체에 유분기가 돈다", val: 1 }   // Oily
            ]
        },
        {
            id: 'SR',
            text: "새로운 화장품을 사용하면 얼굴이 붉어지거나 따갑나요?",
            options: [
                { label: "자주 뒤집어지고 붉어진다", val: 1 }, // Sensitive
                { label: "가끔 컨디션 따라 다르다", val: 0 },
                { label: "거의 자극이 없다", val: -1 }      // Resistant
            ]
        },
        {
            id: 'PN',
            text: "햇빛에 장시간 노출되었을 때 피부 변화는?",
            options: [
                { label: "붉게 익고 잡티가 생긴다", val: 1 }, // Pigmented (Tendency to spot)
                { label: "붉어지다가 원래대로 돌아온다", val: 0 },
                { label: "검게 타거나 별 변화 없다", val: -1 } // Non-Pigmented 
            ]
        },
        {
            id: 'WT',
            text: "눈가나 팔자 주름이 신경 쓰이시나요?",
            options: [
                { label: "이미 자리를 잡았다", val: 1 }, // Wrinkled
                { label: "웃을 때만 보인다", val: 0 },
                { label: "아직 탄력 있다", val: -1 }    // Tight
            ]
        }
    ];

    const handleAnswer = (val: number) => {
        const newAnswers = [...answers, val];
        setAnswers(newAnswers);

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Logic to calculate final modifier scores
            // Map index to axis
            const result: SurveyResult = {
                O_D: newAnswers[0],
                S_R: newAnswers[1],
                P_N: newAnswers[2],
                W_T: newAnswers[3]
            };

            // Small delay for UX
            setTimeout(() => onComplete(result), 300);
        }
    };

    if (!visible) return null;

    return (
        <Modal animationType="fade" visible={visible} transparent={true}>
            <View className="flex-1 bg-black/60 items-center justify-center p-6">
                <View className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl overflow-hidden">

                    {/* Progress Bar */}
                    <View className="flex-row gap-2 mb-8">
                        {questions.map((_, i) => (
                            <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-clony-primary' : 'bg-gray-100'}`} />
                        ))}
                    </View>

                    {/* Question */}
                    <Text className="text-gray-400 font-bold mb-2 text-xs uppercase tracking-widest">
                        정밀 분석 (Scientific Check)
                    </Text>
                    <Text className="text-gray-900 font-bold text-xl mb-8 leading-snug">
                        {questions[step].text}
                    </Text>

                    {/* Options */}
                    <View className="gap-3">
                        {questions[step].options.map((opt, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => handleAnswer(opt.val)}
                                className="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 flex-row justify-between items-center active:bg-clony-primary/10 active:border-clony-primary"
                            >
                                <Text className="text-gray-700 font-bold text-sm flex-1">{opt.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer Note */}
                    <View className="mt-8 flex-row items-center justify-center gap-1.5">
                        <Ionicons name="shield-checkmark" size={12} color="#9CA3AF" />
                        <Text className="text-[10px] text-gray-400">피부과 전문의 감수 알고리즘 적용</Text>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

export default ScientificSurvey;
