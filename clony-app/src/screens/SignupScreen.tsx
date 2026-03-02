import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SignupScreenProps {
    onSignup: (nickname: string) => void;
    onGoToLogin: () => void;
    apiUrl: string;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignup, onGoToLogin, apiUrl }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [loading, setLoading] = useState(false);

    const existingNicknames = ["admin", "clony", "root", "test"];

    const handleSignup = async () => {
        if (!email || !password || !nickname) {
            Alert.alert(t('signup.alerts.input_error'), t('signup.alerts.input_hint'));
            return;
        }

        setLoading(true);

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${apiUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nickname }),
                signal: controller.signal
            });
            clearTimeout(id);

            const data = await response.json();

            if (response.ok) {
                Alert.alert(t('signup.alerts.signup_complete'), t('signup.alerts.welcome', { nickname: data.nickname }), [
                    { text: t('signup.alerts.start'), onPress: () => onSignup(data.nickname) }
                ]);
            } else {
                Alert.alert(t('signup.alerts.signup_failed'), data.detail || t('signup.alerts.error_generic'));
            }
        } catch (error) {
            console.log("Server unreachable, falling back to mock:", error);
            if (existingNicknames.includes(nickname.toLowerCase())) {
                Alert.alert(t('signup.alerts.nickname_duplicate'), t('signup.alerts.nickname_duplicate_hint', { nickname }));
            } else {
                Alert.alert(t('signup.alerts.notice'), t('signup.alerts.server_error_fallback'), [
                    { text: t('signup.alerts.start'), onPress: () => onSignup(nickname) }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#006994', '#00A676']}
            className="flex-1"
        >
            <View className="flex-1 px-8 justify-center">
                <View className="items-center mb-10">
                    <View className="w-16 h-1 bg-clony-accent/30 rounded-full mb-6" />
                    <Text className="text-3xl font-black text-white mb-2 tracking-tighter">{t('signup.title')}</Text>
                    <Text className="text-white/60 text-center font-medium">{t('signup.subtitle')}</Text>
                </View>

                <View className="gap-4 mb-8">
                    <View className="bg-white/10 p-4 rounded-2xl border border-white/20">
                        <Text className="text-xs font-bold text-white/50 mb-1 tracking-widest">{t('signup.email_label')}</Text>
                        <TextInput
                            className="text-base text-white"
                            placeholder={t('signup.email_placeholder')}
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View className="bg-white/10 p-4 rounded-2xl border border-white/20">
                        <Text className="text-xs font-bold text-white/50 mb-1 tracking-widest">{t('signup.password_label')}</Text>
                        <TextInput
                            className="text-base text-white"
                            placeholder={t('signup.password_placeholder')}
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    <View className="bg-white/10 p-4 rounded-2xl border border-white/20">
                        <Text className="text-xs font-bold text-white/50 mb-1 tracking-widest">{t('signup.nickname_label')}</Text>
                        <TextInput
                            className="text-base text-white"
                            placeholder={t('signup.nickname_placeholder')}
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={nickname}
                            onChangeText={setNickname}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.8}
                    className={`bg-clony-accent py-4 rounded-2xl items-center shadow-2xl shadow-clony-accent/40 mb-8 ${loading ? 'opacity-70' : ''}`}
                >
                    <Text className="text-clony-dark font-black text-lg">{loading ? t('signup.processing') : t('signup.submit_btn')}</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center gap-2">
                    <Text className="text-white/50">{t('signup.already_have_account')}</Text>
                    <TouchableOpacity onPress={onGoToLogin}>
                        <Text className="text-white font-black">{t('signup.login')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

export default SignupScreen;
