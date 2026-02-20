import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';

interface City {
    name: string;
    lat: number | null;
    lon: number | null;
}

interface WeatherLocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectCity: (cityName: string) => void;
    selectedCity: string;
}

export const WeatherLocationPicker: React.FC<WeatherLocationPickerProps> = ({
    visible,
    onClose,
    onSelectCity,
    selectedCity
}) => {
    const cities: City[] = [
        { name: '현재 위치', lat: null, lon: null },
        { name: '서울', lat: 37.5665, lon: 126.9780 },
        { name: '부산', lat: 35.1796, lon: 129.0756 },
        { name: '대구', lat: 35.8714, lon: 128.6014 },
        { name: '인천', lat: 37.4563, lon: 126.7052 },
        { name: '광주', lat: 35.1595, lon: 126.8526 },
        { name: '대전', lat: 36.3504, lon: 127.3845 },
        { name: '울산', lat: 35.5384, lon: 129.3114 },
        { name: '제주', lat: 33.4996, lon: 126.5312 },
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl p-6 pb-12">
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold text-gray-900">위치 선택</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="max-h-96">
                        {cities.map((city) => (
                            <TouchableOpacity
                                key={city.name}
                                onPress={() => {
                                    onSelectCity(city.name);
                                    onClose();
                                }}
                                className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${selectedCity === city.name ? 'bg-clony-primary/10 border-2 border-clony-primary' : 'bg-gray-50'
                                    }`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <Ionicons
                                        name={city.name === '현재 위치' ? 'locate' : 'location'}
                                        size={20}
                                        color={selectedCity === city.name ? '#00D182' : '#9CA3AF'}
                                    />
                                    <Text className={`text-base ${selectedCity === city.name ? 'text-clony-primary font-bold' : 'text-gray-700'
                                        }`}>
                                        {city.name}
                                    </Text>
                                </View>
                                {selectedCity === city.name && (
                                    <Ionicons name="checkmark-circle" size={20} color="#00D182" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// 도시 좌표 정보 export
export const CITIES: City[] = [
    { name: '현재 위치', lat: null, lon: null },
    { name: '서울', lat: 37.5665, lon: 126.9780 },
    { name: '부산', lat: 35.1796, lon: 129.0756 },
    { name: '대구', lat: 35.8714, lon: 128.6014 },
    { name: '인천', lat: 37.4563, lon: 126.7052 },
    { name: '광주', lat: 35.1595, lon: 126.8526 },
    { name: '대전', lat: 36.3504, lon: 127.3845 },
    { name: '울산', lat: 35.5384, lon: 129.3114 },
    { name: '제주', lat: 33.4996, lon: 126.5312 },
];

// 날씨 기반 스킨케어 조언 생성 함수
export function getWeatherSkinCareAdvice(temp: number, weathercode: number, city: string) {
    let message = '';
    let icon: any = 'cloud-outline';

    // 온도 기반 조언
    if (temp >= 28) {
        message = `폭염! 🌡️ 끈적임 없는 가벼운 제형 추천`;
        icon = 'thermometer';
    } else if (temp >= 20) {
        // 날씨 코드로 세분화
        if (weathercode === 0) {
            message = `맑음 ☀️ SPF50+ 선크림 필수!`;
            icon = 'sunny';
        } else if (weathercode <= 3) {
            message = `구름 ☁️ 산뜻한 수분 케어 추천`;
            icon = 'cloudy-outline';
        } else if (weathercode >= 51 && weathercode <= 67) {
            message = `비 ☔️ 딥 클렌징으로 깨끗하게`;
            icon = 'rainy-outline';
        } else {
            message = `선선해요 🌤️ 가벼운 보습`;
            icon = 'partly-sunny-outline';
        }
    } else if (temp >= 10) {
        message = `쌀쌀해요 🍂 유수분 밸런스 크림`;
        icon = 'leaf-outline';
    } else if (temp >= 0) {
        message = `추워요 ❄️ 보습 크림으로 피부 장벽 강화`;
        icon = 'snow-outline';
    } else {
        message = `영하! 🧊 리치 크림 집중 보습`;
        icon = 'snow';
    }

    return { message, icon };
}
