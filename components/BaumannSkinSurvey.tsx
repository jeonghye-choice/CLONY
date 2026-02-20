import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BaumannSkinSurveyProps {
    onComplete: (result: {
        skinType: string | null;
        details?: SkinTypeDetails;
        scores?: {
            OD: number;
            SR: number;
            PN: number;
            TW: number;
        };
        age?: number;
        skinConcerns?: string[];
        preferredIngredients?: string[];
        allergicIngredients?: string[];
        skipped: boolean;
    }) => void;
}

interface SkinTypeDetails {
    oilyDry: 'O' | 'D';
    sensitiveResistant: 'S' | 'R';
    pigmentedNonPigmented: 'P' | 'N';
    tightWrinkled: 'T' | 'W';
}

interface Question {
    id: number;
    category: 'OD' | 'SR' | 'PN' | 'TW';
    question: string;
    options: string[];
    scores: number[];
}

const SKIN_CONCERNS = [
    { id: 'acne', label: '여드름/뾰루지', icon: '💊' },
    { id: 'dryness', label: '건조함', icon: '💧' },
    { id: 'wrinkle', label: '주름/탄력', icon: '📉' },
    { id: 'pigmentation', label: '색소침착/기미', icon: '🌞' },
    { id: 'redness', label: '홍조/민감성', icon: '🔴' },
    { id: 'pore', label: '모공', icon: '⚫' },
    { id: 'oil', label: '과다 피지', icon: '💦' },
];

const SKIN_INGREDIENTS = [
    { id: 'cica', label: '병풀(시카)', icon: '🌿' },
    { id: 'hyaluronic', label: '히알루론산', icon: '💧' },
    { id: 'vitamin_c', label: '비타민C', icon: '🍋' },
    { id: 'niacinamide', label: '나이아신마이드', icon: '💎' },
    { id: 'retinol', label: '레티놀', icon: '🌙' },
    { id: 'panthenol', label: '판테놀', icon: '🛡️' },
    { id: 'salicylic', label: '살리실산(BHA)', icon: '🧪' },
];

const ALLERGY_INGREDIENTS = [
    { id: 'fragrance', label: '인공향료', icon: '👃' },
    { id: 'alcohol', label: '에탄올/알코올', icon: '🍸' },
    { id: 'paraben', label: '파라벤', icon: '🚫' },
    { id: 'silicone', label: '실리콘', icon: '🫧' },
    { id: 'mineral_oil', label: '미네랄 오일', icon: '🛢️' },
    { id: 'essential_oil', label: '에센셜 오일', icon: '🍃' },
];

const QUESTIONS: Question[] = [
    {
        id: 1,
        category: 'OD',
        question: '세안 후 2-3시간 뒤 피부 상태는?',
        options: ['매우 건조하고 당긴다', '약간 건조하다', '보통이다', '약간 번들거린다', '매우 번들거린다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 2,
        category: 'OD',
        question: 'T존(이마, 코)의 모공 크기는?',
        options: ['거의 보이지 않는다', '작은 편이다', '보통이다', '큰 편이다', '매우 크다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 3,
        category: 'OD',
        question: '화장이 잘 지워지나요?',
        options: ['쉽게 뜬다/들뜬다', '약간 뜬다', '보통이다', '잘 유지된다', '매우 잘 유지된다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 4,
        category: 'SR',
        question: '새로운 화장품을 사용할 때',
        options: ['문제없이 사용', '가끔 문제 발생', '보통', '자주 트러블', '거의 항상 트러블'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 5,
        category: 'SR',
        question: '피부가 붉어지거나 화끈거리는 경우가',
        options: ['전혀 없다', '거의 없다', '가끔 있다', '자주 있다', '매우 자주 있다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 6,
        category: 'SR',
        question: '가려움증이나 따가움을 느끼는 빈도는?',
        options: ['전혀 없다', '거의 없다', '가끔 있다', '자주 있다', '매우 자주 있다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 7,
        category: 'PN',
        question: '상처나 여드름 자국이 남는 정도는?',
        options: ['거의 안 남는다', '조금 남는다', '보통', '오래 남는다', '매우 오래 남는다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 8,
        category: 'PN',
        question: '기미, 주근깨, 색소침착이',
        options: ['전혀 없다', '거의 없다', '조금 있다', '많다', '매우 많다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 9,
        category: 'PN',
        question: '햇볕에 노출되면',
        options: ['잘 안 탄다', '조금 탄다', '보통', '쉽게 탄다', '매우 쉽게 탄다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 10,
        category: 'TW',
        question: '미간이나 입가 주름이',
        options: ['전혀 없다', '거의 없다', '조금 있다', '있다', '많다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 11,
        category: 'TW',
        question: '피부 처짐이나 탄력 저하가',
        options: ['전혀 없다', '거의 없다', '조금 있다', '있다', '심하다'],
        scores: [1, 2, 3, 4, 5]
    },
    {
        id: 12,
        category: 'TW',
        question: '눈가 잔주름이',
        options: ['전혀 없다', '거의 없다', '조금 있다', '있다', '많다'],
        scores: [1, 2, 3, 4, 5]
    },
];

const BaumannSkinSurvey: React.FC<BaumannSkinSurveyProps> = ({ onComplete }) => {
    const [surveyStep, setSurveyStep] = useState<'AGE' | 'CONCERNS' | 'BAUMANN'>('AGE');
    const [age, setAge] = useState('');
    const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
    const [preferredIngredients, setPreferredIngredients] = useState<string[]>([]);
    const [allergicIngredients, setAllergicIngredients] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(QUESTIONS.length).fill(-1));

    const handleSkip = () => {
        onComplete({
            skinType: null,
            skipped: true,
            age: age ? parseInt(age) : undefined,
            skinConcerns: skinConcerns.length > 0 ? skinConcerns : undefined,
            preferredIngredients: preferredIngredients.length > 0 ? preferredIngredients : undefined,
            allergicIngredients: allergicIngredients.length > 0 ? allergicIngredients : undefined
        });
    };

    const handleAgeNext = () => {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
            Alert.alert('입력 오류', '나이는 10-100 사이의 숫자로 입력해주세요.');
            return;
        }
        setSurveyStep('CONCERNS');
    };

    const toggleSkinConcern = (id: string) => {
        if (skinConcerns.includes(id)) {
            setSkinConcerns(skinConcerns.filter(c => c !== id));
        } else {
            setSkinConcerns([...skinConcerns, id]);
        }
    };

    const togglePreferredIngredient = (id: string) => {
        if (id === 'none') {
            setPreferredIngredients(['none']);
            return;
        }
        const newPreferred = preferredIngredients.filter(c => c !== 'none');
        if (newPreferred.includes(id)) {
            setPreferredIngredients(newPreferred.filter(c => c !== id));
        } else {
            setPreferredIngredients([...newPreferred, id]);
        }
    };

    const toggleAllergicIngredient = (id: string) => {
        if (id === 'none') {
            setAllergicIngredients(['none']);
            return;
        }
        const newAllergic = allergicIngredients.filter(c => c !== 'none');
        if (newAllergic.includes(id)) {
            setAllergicIngredients(newAllergic.filter(c => c !== id));
        } else {
            setAllergicIngredients([...newAllergic, id]);
        }
    };

    const handleAnswer = (optionIndex: number) => {
        const question = QUESTIONS[currentQuestion];
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = question.scores[optionIndex];
        setAnswers(newAnswers);

        setTimeout(() => {
            if (currentQuestion < QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                calculateResult(newAnswers);
            }
        }, 300);
    };

    const handleBack = () => {
        if (surveyStep === 'CONCERNS') setSurveyStep('AGE');
        else if (surveyStep === 'BAUMANN') {
            if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
            else setSurveyStep('CONCERNS');
        }
    };

    const calculateResult = (finalAnswers: number[]) => {
        const odScores = finalAnswers.slice(0, 3).reduce((a, b) => a + b, 0);
        const srScores = finalAnswers.slice(3, 6).reduce((a, b) => a + b, 0);
        const pnScores = finalAnswers.slice(6, 9).reduce((a, b) => a + b, 0);
        const twScores = finalAnswers.slice(9, 12).reduce((a, b) => a + b, 0);

        const oilyDry = odScores >= 9 ? 'O' : 'D';
        const sensitiveResistant = srScores >= 9 ? 'S' : 'R';
        const pigmentedNonPigmented = pnScores >= 9 ? 'P' : 'N';
        const tightWrinkled = twScores >= 9 ? 'W' : 'T';

        const skinType = `${oilyDry}${sensitiveResistant}${pigmentedNonPigmented}${tightWrinkled}`;
        onComplete({
            skinType,
            details: { oilyDry, sensitiveResistant, pigmentedNonPigmented, tightWrinkled },
            scores: {
                OD: odScores,
                SR: srScores,
                PN: pnScores,
                TW: twScores
            },
            age: parseInt(age),
            skinConcerns,
            preferredIngredients,
            allergicIngredients,
            skipped: false
        });

    };

    if (surveyStep === 'AGE') {
        return (
            <View className="flex-1 bg-white px-8 justify-center">
                <View className="items-center mb-12">
                    <Text className="text-4xl mb-4">🎂</Text>
                    <Text className="text-3xl font-bold text-gray-900 mb-2">나이를 알려주세요</Text>
                    <Text className="text-gray-500 text-center">정확한 맞춤 추천을 위해{'\n'}필요한 정보입니다</Text>
                </View>
                <TextInput
                    className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 text-xl text-center font-bold mb-8"
                    placeholder="나이 입력"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                    maxLength={3}
                    autoFocus
                />
                <View className="flex-row gap-3">
                    <TouchableOpacity onPress={handleSkip} className="flex-1 py-4 rounded-xl items-center bg-gray-100">
                        <Text className="font-bold text-lg text-gray-400">나중에 하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAgeNext} className="flex-1 py-4 rounded-xl items-center bg-clony-primary shadow-lg shadow-green-200">
                        <Text className="font-bold text-lg text-white">다음</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (surveyStep === 'CONCERNS') {
        const totalSteps = 4; // AGE, CONCERNS, BAUMANN, COMPLETE
        const progress = 2 / totalSteps;

        return (
            <View className="flex-1 bg-gray-50">
                {/* Progress Bar */}
                <View className="h-1.5 w-full bg-gray-200 mt-14">
                    <View style={{ width: `${progress * 100}%` }} className="h-full bg-clony-primary" />
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 24 }}>
                    <View className="mb-10">
                        <Text className="text-3xl font-bold text-gray-900 mb-2">맞춤 정보 설정 🎯</Text>
                        <Text className="text-gray-500 leading-6">정확한 피부 진단과 제품 추천을 위해{'\n'}필요한 정보들을 꼼꼼히 선택해주세요.</Text>
                    </View>

                    {/* 1. 피부 고민 카드 */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-clony-primary/10 items-center justify-center">
                                    <Text className="text-clony-primary font-bold">1</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">어떤 고민이 있나요? ✨</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">중복 선택 가능</Text>
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            {SKIN_CONCERNS.map((concern) => {
                                const isSelected = skinConcerns.includes(concern.id);
                                return (
                                    <TouchableOpacity
                                        key={concern.id}
                                        onPress={() => toggleSkinConcern(concern.id)}
                                        className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${isSelected ? 'bg-clony-primary/10 border-clony-primary' : 'bg-gray-50 border-transparent'}`}
                                    >
                                        <Text className="text-2xl">{concern.icon}</Text>
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-clony-primary' : 'text-gray-600'}`} numberOfLines={2}>{concern.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 2. 선호 성분 카드 */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-clony-primary/10 items-center justify-center">
                                    <Text className="text-clony-primary font-bold">2</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">선호하는 성분이 있나요? 🧪</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">중복 선택 가능</Text>
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            <TouchableOpacity
                                onPress={() => togglePreferredIngredient('none')}
                                className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${preferredIngredients.includes('none') ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <Text className="text-2xl">✖️</Text>
                                <Text className={`text-sm font-bold text-center ${preferredIngredients.includes('none') ? 'text-indigo-600' : 'text-gray-600'}`} numberOfLines={2}>딱히 없어요</Text>
                            </TouchableOpacity>

                            {SKIN_INGREDIENTS.map((ing) => {
                                const isSelected = preferredIngredients.includes(ing.id) && !preferredIngredients.includes('none');
                                return (
                                    <TouchableOpacity
                                        key={ing.id}
                                        onPress={() => togglePreferredIngredient(ing.id)}
                                        className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${isSelected ? 'bg-clony-primary/10 border-clony-primary' : 'bg-gray-50 border-transparent'}`}
                                    >
                                        <Text className="text-2xl">{ing.icon}</Text>
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-clony-primary' : 'text-gray-600'}`} numberOfLines={2}>{ing.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 3. 알러지/주의 성분 카드 */}
                    <View className="bg-white rounded-[32px] p-6 mb-32 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                                    <Text className="text-red-500 font-bold">3</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">피해야 할 성분은요? ⚠️</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">중복 선택 가능</Text>
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            <TouchableOpacity
                                onPress={() => toggleAllergicIngredient('none')}
                                className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${allergicIngredients.includes('none') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <Text className="text-2xl">✅</Text>
                                <Text className={`text-sm font-bold text-center ${allergicIngredients.includes('none') ? 'text-green-600' : 'text-gray-600'}`} numberOfLines={2}>괜찮아요 (없음)</Text>
                            </TouchableOpacity>

                            {ALLERGY_INGREDIENTS.map((ing) => {
                                const isSelected = allergicIngredients.includes(ing.id) && !allergicIngredients.includes('none');
                                return (
                                    <TouchableOpacity
                                        key={ing.id}
                                        onPress={() => toggleAllergicIngredient(ing.id)}
                                        className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${isSelected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}
                                    >
                                        <Text className="text-2xl">{ing.icon}</Text>
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-red-500' : 'text-gray-600'}`} numberOfLines={2}>{ing.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Sticky Footer Buttons */}
                <View className="absolute bottom-0 left-0 right-0 bg-white/80 border-t border-gray-100 px-6 pt-4 pb-12 flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => setSurveyStep('AGE')}
                        className="flex-1 py-4 rounded-2xl items-center bg-gray-100"
                    >
                        <Text className="font-bold text-lg text-gray-700">이전</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSurveyStep('BAUMANN')}
                        className="flex-[2] py-4 rounded-2xl items-center bg-clony-primary shadow-lg shadow-green-200"
                    >
                        <Text className="font-bold text-lg text-white">다음 단계로 (설문 시작)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const question = QUESTIONS[currentQuestion];

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 pt-14 pb-6 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={handleBack} className="mb-4">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-sm text-clony-primary font-bold mb-2">질문 {currentQuestion + 1} / {QUESTIONS.length}</Text>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-clony-primary" style={{ width: `${progress}%` }} />
                </View>
            </View>
            <ScrollView className="flex-1 px-6 py-8">
                <View className="mb-8">
                    <View className="w-16 h-16 bg-clony-primary/10 rounded-full items-center justify-center mb-4">
                        <Text className="text-2xl">
                            {question.category === 'OD' ? '💧' : question.category === 'SR' ? '🌸' : question.category === 'PN' ? '☀️' : '✨'}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2">{question.question}</Text>
                    <Text className="text-sm text-gray-400">{question.category === 'OD' ? '지성/건성' : question.category === 'SR' ? '민감성/저항성' : question.category === 'PN' ? '색소침착' : '탄력/주름'}</Text>
                </View>
                <View className="gap-3">
                    {question.options.map((option, index) => {
                        const isSelected = answers[currentQuestion] === question.scores[index];
                        return (
                            <TouchableOpacity key={index} onPress={() => handleAnswer(index)} className={`p-5 rounded-2xl border-2 ${isSelected ? 'bg-clony-primary/5 border-clony-primary' : 'bg-white border-gray-200'}`}>
                                <View className="flex-row items-center justify-between">
                                    <Text className={`text-base flex-1 ${isSelected ? 'text-clony-primary font-bold' : 'text-gray-700'}`}>{option}</Text>
                                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            <View className="px-6 pb-8 bg-gray-50">
                <Text className="text-center text-sm text-gray-400">💡 가장 가까운 답변을 선택해주세요</Text>
            </View>
        </View>
    );
};

export default BaumannSkinSurvey;
