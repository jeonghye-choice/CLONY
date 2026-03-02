import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
    onLogin: (nickname: string) => void;
    onGoToSignup: () => void;
    apiUrl: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoToSignup, apiUrl }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [stayLoggedIn, setStayLoggedIn] = useState(false);
    const [showEmailLogin, setShowEmailLogin] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('onboarding.nickname.error_title'), t('login.alerts.input_hint'));
            return;
        }

        setLoading(true);
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });
            clearTimeout(id);

            const data = await response.json();

            if (response.ok) {
                if (stayLoggedIn) {
                    await AsyncStorage.setItem('user_session', JSON.stringify({ nickname: data.nickname }));
                }
                onLogin(data.nickname);
            } else {
                Alert.alert(t('login.alerts.login_failed'), data.detail || t('login.alerts.login_check_hint'));
            }
        } catch (error) {
            console.log("Server unreachable, falling back to mock:", error);
            Alert.alert(t('login.alerts.notice'), t('login.alerts.server_error_fallback'));
            if (stayLoggedIn) {
                await AsyncStorage.setItem('user_session', JSON.stringify({ nickname: t('login.mock.trial') }));
            }
            onLogin(t('login.mock.trial'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#014f86', '#0091ad', '#00A676']}
            className="flex-1"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-8 pt-20 pb-10 justify-between">
                        {/* Center Logo Area */}
                        <View className="items-center justify-center pt-10">
                            <View className="mb-4 shadow-xl rounded-2xl overflow-hidden" style={{ width: 80, height: 80 }}>
                                <Image
                                    source={require('../assets/main_logo.png')}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </View>
                            <View className="mt-6 px-4">
                                <Text className="text-3xl font-black text-white text-center tracking-tighter">
                                    clony
                                </Text>
                            </View>
                        </View>

                        {/* Login Section */}
                        <View className="w-full mt-10">
                            {showEmailLogin ? (
                                <View className="gap-4 mb-6 animate-in fade-in slide-in-from-bottom-5">
                                    <View className="bg-white/10 p-4 rounded-2xl border border-white/20">
                                        <Text className="text-xs font-bold text-white/50 mb-1 tracking-widest uppercase">Email</Text>
                                        <TextInput
                                            className="text-base text-white font-medium"
                                            placeholder="example@email.com"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                    <View className="bg-white/10 p-4 rounded-2xl border border-white/20">
                                        <Text className="text-xs font-bold text-white/50 mb-1 tracking-widest uppercase">Password</Text>
                                        <TextInput
                                            className="text-base text-white font-medium"
                                            placeholder="••••••"
                                            placeholderTextColor="rgba(255,255,255,0.4)"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setStayLoggedIn(!stayLoggedIn)}
                                        className="flex-row items-center mb-2 gap-2"
                                    >
                                        <View className={`w-5 h-5 rounded-md border items-center justify-center ${stayLoggedIn ? 'bg-white border-white' : 'bg-transparent border-white/30'}`}>
                                            {stayLoggedIn && <Ionicons name="checkmark" size={14} color="#00A676" />}
                                        </View>
                                        <Text className="text-white/80 font-bold text-sm">{t('login.stay_logged_in')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleLogin}
                                        disabled={loading}
                                        className={`bg-white py-4 rounded-2xl items-center shadow-xl ${loading ? 'opacity-70' : ''}`}
                                    >
                                        <Text className="text-[#006994] font-black text-lg">{loading ? t('login.processing') : t('login.login_btn')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setShowEmailLogin(false)} className="items-center py-2">
                                        <Text className="text-white/60 font-bold text-sm">{t('login.back')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View className="gap-4 mb-10">
                                    <TouchableOpacity
                                        onPress={() => setShowEmailLogin(true)}
                                        className="bg-white/10 py-4 rounded-2xl items-center border border-white/30"
                                    >
                                        <Text className="text-white font-bold text-lg">{t('login.start_email')}</Text>
                                    </TouchableOpacity>

                                    <View className="flex-row items-center my-4">
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                        <Text className="mx-4 text-white/40 text-[10px] font-black tracking-widest">SOCIAL CONNECT</Text>
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                    </View>

                                    <View className="flex-row justify-center gap-6">
                                        <TouchableOpacity
                                            onPress={() => onLogin(t('login.mock.kakao'))}
                                            className="w-16 h-16 bg-[#FEE500] rounded-full items-center justify-center shadow-lg"
                                        >
                                            <Ionicons name="chatbubble" size={28} color="#3C1E1E" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => onLogin(t('login.mock.google'))}
                                            className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg"
                                        >
                                            <Ionicons name="logo-google" size={28} color="#EA4335" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => onLogin(t('login.mock.apple'))}
                                            className="w-16 h-16 bg-black rounded-full items-center justify-center shadow-lg"
                                        >
                                            <Ionicons name="logo-apple" size={28} color="white" />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row justify-center gap-2 mt-6">
                                        <Text className="text-white/50">{t('login.no_account')}</Text>
                                        <TouchableOpacity onPress={onGoToSignup}>
                                            <Text className="text-white font-black">{t('login.signup')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient >
    );
};

export default LoginScreen;
