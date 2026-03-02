import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
    translationKey: string;
    scores: number[];
}

const SKIN_CONCERNS = [
    { id: 'acne', translationKey: 'baumann.concerns.acne', icon: '💊' },
    { id: 'dryness', translationKey: 'baumann.concerns.dryness', icon: '💧' },
    { id: 'wrinkle', translationKey: 'baumann.concerns.wrinkle', icon: '📉' },
    { id: 'pigmentation', translationKey: 'baumann.concerns.pigmentation', icon: '🌞' },
    { id: 'redness', translationKey: 'baumann.concerns.redness', icon: '🔴' },
    { id: 'pore', translationKey: 'baumann.concerns.pore', icon: '⚫' },
    { id: 'oil', translationKey: 'baumann.concerns.oil', icon: '💦' },
];

const SKIN_INGREDIENTS = [
    { id: 'cica', translationKey: 'baumann.ingredients.cica', icon: '🌿' },
    { id: 'hyaluronic', translationKey: 'baumann.ingredients.hyaluronic', icon: '💧' },
    { id: 'vitamin_c', translationKey: 'baumann.ingredients.vitamin_c', icon: '🍋' },
    { id: 'niacinamide', translationKey: 'baumann.ingredients.niacinamide', icon: '💎' },
    { id: 'retinol', translationKey: 'baumann.ingredients.retinol', icon: '🌙' },
    { id: 'panthenol', translationKey: 'baumann.ingredients.panthenol', icon: '🛡️' },
    { id: 'salicylic', translationKey: 'baumann.ingredients.salicylic', icon: '🧪' },
];

const ALLERGY_INGREDIENTS = [
    { id: 'fragrance', translationKey: 'baumann.allergy.fragrance', icon: '👃' },
    { id: 'alcohol', translationKey: 'baumann.allergy.alcohol', icon: '🍸' },
    { id: 'paraben', translationKey: 'baumann.allergy.paraben', icon: '🚫' },
    { id: 'silicone', translationKey: 'baumann.allergy.silicone', icon: '🫧' },
    { id: 'mineral_oil', translationKey: 'baumann.allergy.mineral_oil', icon: '🛢️' },
    { id: 'essential_oil', translationKey: 'baumann.allergy.essential_oil', icon: '🍃' },
];

const QUESTIONS: Question[] = [
    { id: 1, category: 'OD', translationKey: 'baumann.questions.1', scores: [1, 2, 3, 4, 5] },
    { id: 2, category: 'OD', translationKey: 'baumann.questions.2', scores: [1, 2, 3, 4, 5] },
    { id: 3, category: 'OD', translationKey: 'baumann.questions.3', scores: [1, 2, 3, 4, 5] },
    { id: 4, category: 'SR', translationKey: 'baumann.questions.4', scores: [1, 2, 3, 4, 5] },
    { id: 5, category: 'SR', translationKey: 'baumann.questions.5', scores: [1, 2, 3, 4, 5] },
    { id: 6, category: 'SR', translationKey: 'baumann.questions.6', scores: [1, 2, 3, 4, 5] },
    { id: 7, category: 'PN', translationKey: 'baumann.questions.7', scores: [1, 2, 3, 4, 5] },
    { id: 8, category: 'PN', translationKey: 'baumann.questions.8', scores: [1, 2, 3, 4, 5] },
    { id: 9, category: 'PN', translationKey: 'baumann.questions.9', scores: [1, 2, 3, 4, 5] },
    { id: 10, category: 'TW', translationKey: 'baumann.questions.10', scores: [1, 2, 3, 4, 5] },
    { id: 11, category: 'TW', translationKey: 'baumann.questions.11', scores: [1, 2, 3, 4, 5] },
    { id: 12, category: 'TW', translationKey: 'baumann.questions.12', scores: [1, 2, 3, 4, 5] },
];

const BaumannSkinSurvey: React.FC<BaumannSkinSurveyProps> = ({ onComplete }) => {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

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
            Alert.alert(isKorean ? '입력 오류' : 'Input Error', t('baumann.age.hint'));
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
                    <Text className="text-3xl font-bold text-gray-900 mb-2">{t('baumann.age.title')}</Text>
                    <Text className="text-gray-500 text-center">{t('baumann.age.subtitle')}</Text>
                </View>
                <TextInput
                    className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 text-xl text-center font-bold mb-8"
                    placeholder={t('baumann.age.placeholder')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                    maxLength={3}
                    autoFocus
                />
                <View className="flex-row gap-3">
                    <TouchableOpacity onPress={handleSkip} className="flex-1 py-4 rounded-xl items-center bg-gray-100">
                        <Text className="font-bold text-lg text-gray-400">{t('baumann.age.skip')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAgeNext} className="flex-1 py-4 rounded-xl items-center bg-clony-primary shadow-lg shadow-green-200">
                        <Text className="font-bold text-lg text-white">{t('baumann.age.next')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (surveyStep === 'CONCERNS') {
        const totalSteps = 4;
        const progress = 2 / totalSteps;

        return (
            <View className="flex-1 bg-gray-50">
                <View className="h-1.5 w-full bg-gray-200 mt-14">
                    <View style={{ width: `${progress * 100}%` }} className="h-full bg-clony-primary" />
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 24 }}>
                    <View className="mb-10">
                        <Text className="text-3xl font-bold text-gray-900 mb-2">{t('baumann.concerns_step.title')}</Text>
                        <Text className="text-gray-500 leading-6">{t('baumann.concerns_step.subtitle')}</Text>
                    </View>

                    {/* 1. Skin Concerns */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-clony-primary/10 items-center justify-center">
                                    <Text className="text-clony-primary font-bold">1</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">{t('baumann.concerns_step.concern_title')}</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">{t('baumann.concerns_step.multiple_choice')}</Text>
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
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-clony-primary' : 'text-gray-600'}`} numberOfLines={2}>{t(concern.translationKey)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 2. Preferred Ingredients */}
                    <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-clony-primary/10 items-center justify-center">
                                    <Text className="text-clony-primary font-bold">2</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">{t('baumann.concerns_step.ingredient_title')}</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">{t('baumann.concerns_step.multiple_choice')}</Text>
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            <TouchableOpacity
                                onPress={() => togglePreferredIngredient('none')}
                                className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${preferredIngredients.includes('none') ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <Text className="text-2xl">✖️</Text>
                                <Text className={`text-sm font-bold text-center ${preferredIngredients.includes('none') ? 'text-indigo-600' : 'text-gray-600'}`} numberOfLines={2}>{t('baumann.concerns_step.none_preferred')}</Text>
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
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-clony-primary' : 'text-gray-600'}`} numberOfLines={2}>{t(ing.translationKey)}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* 3. Allergic Ingredients */}
                    <View className="bg-white rounded-[32px] p-6 mb-32 shadow-sm border border-gray-100">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                                    <Text className="text-red-500 font-bold">3</Text>
                                </View>
                                <Text className="text-xl font-bold text-gray-900">{t('baumann.concerns_step.allergy_title')}</Text>
                            </View>
                            <Text className="text-xs text-gray-400 ml-10">{t('baumann.concerns_step.multiple_choice')}</Text>
                        </View>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            <TouchableOpacity
                                onPress={() => toggleAllergicIngredient('none')}
                                className={`w-[48%] px-3 py-4 rounded-2xl border-2 flex-col items-center justify-center gap-2 ${allergicIngredients.includes('none') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent'}`}
                            >
                                <Text className="text-2xl">✅</Text>
                                <Text className={`text-sm font-bold text-center ${allergicIngredients.includes('none') ? 'text-green-600' : 'text-gray-600'}`} numberOfLines={2}>{t('baumann.concerns_step.none_allergy')}</Text>
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
                                        <Text className={`text-sm font-bold text-center ${isSelected ? 'text-red-500' : 'text-gray-600'}`} numberOfLines={2}>{t(ing.translationKey)}</Text>
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
                        <Text className="font-bold text-lg text-gray-700">{t('baumann.concerns_step.prev')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSurveyStep('BAUMANN')}
                        className="flex-[2] py-4 rounded-2xl items-center bg-clony-primary shadow-lg shadow-green-200"
                    >
                        <Text className="font-bold text-lg text-white">{t('baumann.concerns_step.next_start')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const progressPercent = ((currentQuestion + 1) / QUESTIONS.length) * 100;
    const question = QUESTIONS[currentQuestion];
    const questionOptions: string[] = t(`${question.translationKey}.options`, { returnObjects: true }) as string[];

    return (
        <View className="flex-1 bg-white">
            <View className="px-6 pt-14 pb-6 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={handleBack} className="mb-4">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>

                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View className="h-full bg-clony-primary" style={{ width: `${progressPercent}%` }} />
                </View>
            </View>
            <ScrollView className="flex-1 px-6 py-8">
                <View className="mb-8">
                    <View className="w-16 h-16 bg-clony-primary/10 rounded-full items-center justify-center mb-4">
                        <Text className="text-2xl">
                            {question.category === 'OD' ? '💧' : question.category === 'SR' ? '🌸' : question.category === 'PN' ? '☀️' : '✨'}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mb-2">{t(`${question.translationKey}.text`)}</Text>
                    <Text className="text-sm text-gray-400">
                        {question.category === 'OD' ? t('baumann.survey.od') : question.category === 'SR' ? t('baumann.survey.sr') : question.category === 'PN' ? t('baumann.survey.pn') : t('baumann.survey.tw')}
                    </Text>
                </View>
                <View className="gap-3">
                    {questionOptions.map((option, index) => {
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
                <Text className="text-center text-sm text-gray-400">💡 {t('baumann.survey.hint')}</Text>
            </View>
        </View>
    );
};

export default BaumannSkinSurvey;
