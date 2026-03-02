import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ProfileSetupScreenProps {
    onComplete: (nickname: string, country: string) => void;
}

const countries = [
    { id: 'kr', nativeName: '대한민국', subLabel: 'KR', emoji: '🇰🇷' },
    { id: 'us', nativeName: 'United States', subLabel: 'US', emoji: '🇺🇸' },
    { id: 'jp', nativeName: '日本', subLabel: 'JP', emoji: '🇯🇵' },
    { id: 'cn', nativeName: '中国', subLabel: 'CN', emoji: '🇨🇳' },
    { id: 'vn', nativeName: 'Việt Nam', subLabel: 'VN', emoji: '🇻🇳' },
    { id: 'th', nativeName: 'ประเทศไทย', subLabel: 'TH', emoji: '🇹🇭' },
];

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [nickname, setNickname] = useState('');

    const validateNickname = (text: string): boolean => {
        // 2-10자, 한글/영문/숫자
        const regex = /^[가-힣a-zA-Z0-9]{2,10}$/;
        return regex.test(text);
    };

    const handleNext = () => {
        if (!nickname.trim()) {
            Alert.alert(t('onboarding.nickname.error_title'), t('onboarding.nickname.error_empty'));
            return;
        }
        if (!validateNickname(nickname)) {
            Alert.alert(t('onboarding.nickname.error_title'), t('onboarding.nickname.error_invalid'));
            return;
        }
        onComplete(nickname, selectedCountry || 'kr');
    };

    const isValid = validateNickname(nickname);

    if (step === 0) {
        return (
            <View className="flex-1 bg-white">
                {/* Header with Progress Bar */}
                <View className="pt-14 px-8 pb-6">
                    <View className="flex-row items-center gap-4 mb-4">
                        <TouchableOpacity disabled style={{ opacity: 0 }}>
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                        <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <View className="h-full bg-clony-primary w-1/2 rounded-full" />
                        </View>
                    </View>
                    <Text className="text-2xl font-black text-gray-900 mt-4">
                        {t('onboarding.country.title')}
                    </Text>
                    <Text className="text-gray-500 mt-2">
                        {t('onboarding.country.subtitle')}
                    </Text>
                </View>

                {/* Country List */}
                <View className="flex-1 px-8">
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {countries.map((country) => (
                            <TouchableOpacity
                                key={country.id}
                                onPress={() => setSelectedCountry(country.id)}
                                className={`w-[48%] p-4 rounded-2xl border-2 flex-row items-center gap-3 ${selectedCountry === country.id
                                    ? 'border-clony-primary bg-clony-primary/5'
                                    : 'border-gray-100 bg-white'
                                    }`}
                                style={{
                                    shadowColor: selectedCountry === country.id ? '#00A676' : '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: selectedCountry === country.id ? 0.1 : 0.05,
                                    shadowRadius: 10,
                                    elevation: 2,
                                }}
                            >
                                <Text className="text-2xl">{country.emoji}</Text>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-900 text-sm" numberOfLines={1}>
                                        {country.nativeName}
                                    </Text>
                                    <Text className="text-gray-400 text-[10px]">{country.subLabel}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Footer Component with Button */}
                <View className="p-8">
                    <TouchableOpacity
                        onPress={() => setStep(1)}
                        disabled={!selectedCountry}
                        className={`py-4 rounded-2xl items-center ${selectedCountry ? 'bg-clony-primary shadow-xl shadow-clony-primary/30' : 'bg-gray-200'
                            }`}
                    >
                        <Text className={`font-black text-lg ${selectedCountry ? 'text-white' : 'text-gray-400'}`}>
                            {t('onboarding.country.next')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            {/* Header with Progress Bar */}
            <View className="pt-14 px-8 pb-6">
                <View className="flex-row items-center gap-4 mb-4">
                    <TouchableOpacity onPress={() => setStep(0)}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View className="h-full bg-clony-primary w-full rounded-full" />
                    </View>
                </View>
            </View>

            <View className="flex-1 px-8 justify-center">
                <View className="items-center mb-12">
                    <View className="w-20 h-20 bg-clony-primary/10 rounded-full items-center justify-center mb-4">
                        <Ionicons name="person" size={40} color="#10b981" />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 mb-2">
                        {t('onboarding.nickname.title')}
                    </Text>
                    <Text className="text-gray-500 text-center">
                        {t('onboarding.nickname.subtitle')}
                    </Text>
                </View>

                <View className="mb-8">
                    <View className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200">
                        <TextInput
                            className="text-xl text-gray-900 text-center font-bold"
                            placeholder={t('onboarding.nickname.placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={nickname}
                            onChangeText={setNickname}
                            maxLength={10}
                            autoFocus
                        />
                    </View>

                    <View className="flex-row justify-between items-center mt-3 px-2">
                        <Text className={`text-sm ${isValid ? 'text-clony-primary' : 'text-gray-400'}`}>
                            {isValid ? t('onboarding.nickname.valid') : t('onboarding.nickname.hint')}
                        </Text>
                        <Text className="text-sm text-gray-400">
                            {nickname.length}/10
                        </Text>
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-xs text-gray-400 mb-2 px-2">{t('onboarding.nickname.examples')}</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {['Jimin', 'Sarah', 'Alex', 'Chris'].map((example) => (
                            <TouchableOpacity
                                key={example}
                                onPress={() => setNickname(example)}
                                className="bg-gray-100 px-4 py-2 rounded-full"
                            >
                                <Text className="text-gray-600 text-sm">{example}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleNext}
                    disabled={!isValid}
                    className={`py-4 rounded-xl items-center shadow-lg ${isValid ? 'bg-clony-primary shadow-green-200' : 'bg-gray-200'}`}
                >
                    <Text className={`font-bold text-lg ${isValid ? 'text-white' : 'text-gray-400'}`}>
                        {t('onboarding.nickname.next')}
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

export default ProfileSetupScreen;
