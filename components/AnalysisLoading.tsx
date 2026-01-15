import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AnalysisLoading = ({ onComplete, imageUri }: { onComplete: () => void, imageUri?: string | null }) => {
    const [scanStep, setScanStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    const steps = [
        { label: "모공 및 피부결 분석 중...", icon: "apps-outline", color: "#34D399" }, // Mint
        { label: "홍조 및 민감도 측정 중...", icon: "thermometer-outline", color: "#F87171" }, // Red
        { label: "색소 침착 및 기미 스캔...", icon: "sunny-outline", color: "#FBBF24" }, // Amber
        { label: "주름 및 탄력 진단 중...", icon: "fitness-outline", color: "#60A5FA" }, // Blue
    ];

    useEffect(() => {
        // Start Scan Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Step Transition Logic
        let step = 0;
        const interval = setInterval(() => {
            step += 1;
            if (step < steps.length) {
                setScanStep(step);
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 800); // Finish after last step
            }
        }, 1200); // 1.2s per step

        return () => clearInterval(interval);
    }, []);

    const translateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height * 0.4],
    });

    return (
        <View style={StyleSheet.absoluteFill} className="bg-black items-center justify-center z-50">
            {/* Background Image (Captured Photo) */}
            {imageUri && (
                <Image
                    source={{ uri: imageUri }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                    resizeMode="cover"
                />
            )}

            {/* Face Guide Grid */}
            <View className="relative w-[300px] h-[400px] border border-white/30 rounded-[150px] overflow-hidden items-center justify-center">

                {/* Animated Scan Line */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        backgroundColor: steps[scanStep].color,
                        shadowColor: steps[scanStep].color,
                        shadowOpacity: 1,
                        shadowRadius: 20,
                        transform: [{ translateY }],
                    }}
                />

                {/* Grid Overlay Effect */}
                <View className="absolute w-full h-full opacity-20">
                    <View className="absolute top-1/2 w-full h-[1px] bg-white" />
                    <View className="absolute left-1/2 h-full w-[1px] bg-white" />
                </View>

                {/* Central Icon */}
                <View className="bg-black/40 p-4 rounded-full backdrop-blur-md border border-white/20">
                    <Ionicons name={steps[scanStep].icon as any} size={48} color={steps[scanStep].color} />
                </View>
            </View>

            {/* Text Info */}
            <View className="absolute bottom-[15%] items-center">
                <Text className="text-white text-2xl font-bold mb-2 tracking-widest">
                    AI Analysis
                </Text>
                <Text className="text-gray-300 text-base font-bold" style={{ color: steps[scanStep].color }}>
                    {steps[scanStep].label}
                </Text>
            </View>
        </View>
    );
};

export default AnalysisLoading;
