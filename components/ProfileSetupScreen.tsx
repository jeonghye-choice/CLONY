import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileSetupScreenProps {
    onComplete: (nickname: string) => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
    const [nickname, setNickname] = useState('');

    const validateNickname = (text: string): boolean => {
        // 2-10자, 한글/영문/숫자
        const regex = /^[가-힣a-zA-Z0-9]{2,10}$/;
        return regex.test(text);
    };

    const handleNext = () => {
        if (!nickname.trim()) {
            Alert.alert('입력 오류', '닉네임을 입력해주세요.');
            return;
        }
        if (!validateNickname(nickname)) {
            Alert.alert('입력 오류', '닉네임은 2-10자의 한글, 영문, 숫자만 사용 가능합니다.');
            return;
        }
        onComplete(nickname);
    };

    const isValid = validateNickname(nickname);
    return (
        <View className="flex-1 bg-white px-8 justify-center">
            <View className="items-center mb-12">
                <View className="w-20 h-20 bg-clony-primary/10 rounded-full items-center justify-center mb-4">
                    <Ionicons name="person" size={40} color="#10b981" />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-2">
                    반가워요! 👋
                </Text>
                <Text className="text-gray-500 text-center">
                    Clony에서 사용할{'\n'}닉네임을 설정해주세요
                </Text>
            </View>

            <View className="mb-8">
                <View className="bg-gray-50 p-5 rounded-2xl border-2 border-gray-200">
                    <TextInput
                        className="text-xl text-gray-900 text-center font-bold"
                        placeholder="닉네임 입력"
                        placeholderTextColor="#9CA3AF"
                        value={nickname}
                        onChangeText={setNickname}
                        maxLength={10}
                        autoFocus
                    />
                </View>

                <View className="flex-row justify-between items-center mt-3 px-2">
                    <Text className={`text-sm ${isValid ? 'text-clony-primary' : 'text-gray-400'}`}>
                        {isValid ? '✓ 사용 가능한 닉네임' : '2-10자 (한글/영문/숫자)'}
                    </Text>
                    <Text className="text-sm text-gray-400">
                        {nickname.length}/10
                    </Text>
                </View>
            </View>

            <View className="mb-8">
                <Text className="text-xs text-gray-400 mb-2 px-2">예시</Text>
                <View className="flex-row flex-wrap gap-2">
                    {['지민', '예진', 'Sarah', '수민이', 'min123'].map((example) => (
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
                    다음
                </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2 items-center justify-center mt-8">
                <View className="w-8 h-1 bg-clony-primary rounded-full" />
                <View className="w-8 h-1 bg-gray-200 rounded-full" />
                <View className="w-8 h-1 bg-gray-200 rounded-full" />
            </View>
        </View>
    );
};

export default ProfileSetupScreen;
