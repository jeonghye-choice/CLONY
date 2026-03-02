import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const AnalysisLoading = ({ onComplete, imageUri, isReady }: { onComplete: () => void, imageUri?: string | null, isReady?: boolean }) => {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);
    const [scanStep, setScanStep] = useState(0);

    const steps = [
        { label: t('analysis_loading.scanning'), icon: "scan-outline", color: "#FFFFFF" },
        { label: t('analysis_loading.extracting'), icon: "text-outline", color: "#B7E300" },
        { label: t('analysis_loading.analyzing'), icon: "flask-outline", color: "#B7E300" },
        { label: t('analysis_loading.almost_done'), icon: "time-outline", color: "#FFFFFF" },
        { label: t('analysis_loading.complete'), icon: "checkmark-circle-outline", color: "#B7E300" },
    ];

    useEffect(() => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            const increment = currentProgress < 80 ? 2 : 0.5;

            if (currentProgress < 95) {
                currentProgress += increment;
            } else if (isReady) {
                currentProgress = 100;
                clearInterval(interval);
                setTimeout(onComplete, 500);
            }
            if (!isReady && currentProgress > 95) currentProgress = 95;

            setProgress(currentProgress);

            if (currentProgress < 30) setScanStep(0);
            else if (currentProgress < 60) setScanStep(1);
            else if (currentProgress < 90) setScanStep(2);
            else if (currentProgress < 100) setScanStep(3);
            else setScanStep(4);

        }, 50);

        return () => clearInterval(interval);
    }, [isReady]);

    const p = Math.min(100, Math.max(0, progress));
    const CIRCLE_SIZE = 240;
    const HALF_SIZE = CIRCLE_SIZE / 2;

    return (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center z-50">
            <LinearGradient
                colors={['#006994', '#00A676']}
                className="absolute inset-0"
            />

            {/* Background Image Overlay */}
            {imageUri && (
                <Image
                    source={{ uri: imageUri }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
                    resizeMode="cover"
                />
            )}

            {/* Circular Progress Container */}
            <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center' }}>

                {/* Dasher Circle */}
                {Array.from({ length: 48 }).map((_, i) => (
                    <View key={i} style={{
                        position: 'absolute',
                        width: 4, height: 14, borderRadius: 2,
                        backgroundColor: i < (progress / 100 * 48) ? '#B7E300' : 'rgba(255,255,255,0.1)',
                        transform: [
                            { rotate: `${i * (360 / 48)}deg` },
                            { translateY: -HALF_SIZE + 10 }
                        ]
                    }} />
                ))}

                {/* Inner Info */}
                <View className="items-center justify-center p-6 bg-white/10 rounded-full w-[200px] h-[200px] border border-white/20">
                    <Ionicons name={steps[scanStep].icon as any} size={48} color={steps[scanStep].color} style={{ marginBottom: 8 }} />
                    <Text className="text-4xl font-black text-white tracking-tighter">
                        {Math.round(progress)}<Text className="text-xl font-medium text-white/60">%</Text>
                    </Text>
                    <Text className="text-white/80 text-[10px] font-black tracking-widest text-center mt-2 px-4 uppercase" numberOfLines={2}>
                        {steps[scanStep].label}
                    </Text>
                </View>

            </View>
        </View>
    );
};

export default AnalysisLoading;
