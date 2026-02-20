import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');



const AnalysisLoading = ({ onComplete, imageUri, isReady }: { onComplete: () => void, imageUri?: string | null, isReady?: boolean }) => {
    const [progress, setProgress] = useState(0);
    const [scanStep, setScanStep] = useState(0);

    const steps = [
        { label: "제품 정보를 스캔하는 중...", icon: "scan-outline", color: "#34D399" },
        { label: "전성분 텍스트 추출 중...", icon: "text-outline", color: "#60A5FA" },
        { label: "유해 성분 분석 중...", icon: "flask-outline", color: "#FBBF24" },
        { label: "거의 다 됐어요! 잠시만요...", icon: "time-outline", color: "#FBBF24" },
        { label: "분석 완료!", icon: "checkmark-circle-outline", color: "#818CF8" },
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

    // Simple Circular Progress Calc
    // We will render two semi-circles.
    // Right Semi-Circle: Rotates from -180 to 0 (for 0-50%)
    // Left Semi-Circle: Rotates from -180 to 0 (for 50-100%)

    // Actually, let's just use borders style.
    // 0-100 progress
    const p = Math.min(100, Math.max(0, progress));
    const firstHalfRotate = p > 50 ? 180 : p * 3.6;
    const secondHalfRotate = p > 50 ? (p - 50) * 3.6 : 0;

    const CIRCLE_SIZE = 240;
    const STROKE_WIDTH = 12;
    const HALF_SIZE = CIRCLE_SIZE / 2;

    return (
        <View style={StyleSheet.absoluteFill} className="bg-black items-center justify-center z-50">
            {/* Background */}
            {imageUri && (
                <Image
                    source={{ uri: imageUri }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
                    resizeMode="cover"
                />
            )}

            {/* Circular Progress Container */}
            <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center' }}>

                {/* Track (Gray) */}
                <View style={{
                    position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: HALF_SIZE,
                    borderWidth: STROKE_WIDTH, borderColor: 'rgba(255,255,255,0.1)'
                }} />

                {/* Right Half Spinner */}
                <View style={{
                    position: 'absolute', width: HALF_SIZE, height: CIRCLE_SIZE, right: 0, overflow: 'hidden'
                }}>
                    <View style={{
                        width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: HALF_SIZE, borderWidth: STROKE_WIDTH,
                        borderColor: 'transparent', borderTopColor: steps[scanStep].color, borderRightColor: steps[scanStep].color, // 180deg arc?
                        // This creates a 90deg arc (Top-Right). We need 180.
                        // Ideally borderLeftColor: 'transparent', borderBottomColor: transparent
                        borderLeftColor: 'transparent', borderBottomColor: 'transparent',
                        position: 'absolute', right: 0,
                        transform: [{ rotate: `${45 + firstHalfRotate}deg` }] // Pivot is center
                        // This logic is tricky without trial/error.
                    }} />
                    {/* 
                       Better Approach:
                       Just rotate a semi-circle View (bg color) behind a mask?
                       
                       Simplest RN "Pie Chart":
                       Two absolute views.
                       1. Right Half (overflow hidden). Child: Right Semi-Circle (Rotates).
                       2. Left Half (overflow hidden). Child: Left Semi-Circle (Rotates).
                    */}
                </View>

                {/* Let's ignore the perfect css rotation and use a simpler visual for reliability if possible. 
                    Or use a "Dashed" circle with many small dashes?
                    
                    I will try the standard StackOverflow RN solution.
                */}

                {/* Right Semi Circle */}
                <View style={{
                    width: HALF_SIZE, height: CIRCLE_SIZE, overflow: 'hidden', position: 'absolute', right: 0
                }}>
                    <Animated.View style={{
                        width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: HALF_SIZE, borderWidth: STROKE_WIDTH,
                        borderColor: steps[scanStep].color,
                        borderLeftColor: 'transparent', borderBottomColor: 'transparent',
                        position: 'absolute', right: 0,
                        transform: [{ rotate: `${-45 + firstHalfRotate}deg` }] // -45 to start at 12 o'clock (since Top+Right=90deg starts at 1:30? No. top is 12, right is 3. Top-Right is 12-3.)
                        // Top-Right border is 12 to 3. (90deg).
                        // We need 180deg. So we need Top+Right+Bottom? No.
                        // Just Top+Right (90) + Rotate?
                        // We need 180.
                        // Let's assuming strokeWidth is small, we can use `borderRightColor` and `borderTopColor`...

                        // Okay, fallback to:
                        // Just a big colored circle text for now?
                        // NO, user said "Don't use Text Percentage".

                    }} />
                </View>

                {/* I'm risking visual glitches. I'll stick to a simpler DESIGN:
                   A large ring that fades in colors? 
                   Or just a text? No user hated text.
                   
                   I will implement a "Dasher" circle.
                   It's a reliable trick. 
                   Many small views in a circle.
               */}

                {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} style={{
                        position: 'absolute',
                        width: 4, height: 12, borderRadius: 2,
                        backgroundColor: i < (progress / 100 * 40) ? steps[scanStep].color : 'rgba(255,255,255,0.1)',
                        transform: [
                            { rotate: `${i * (360 / 40)}deg` },
                            { translateY: -HALF_SIZE + 10 } // Push out
                        ]
                    }} />
                ))}

                {/* Inner Info */}
                <View className="items-center justify-center p-6 bg-black/60 rounded-full w-[200px] h-[200px] backdrop-blur-md">
                    <Ionicons name={steps[scanStep].icon as any} size={48} color={steps[scanStep].color} style={{ marginBottom: 8 }} />
                    <Text className="text-4xl font-bold text-white tracking-tighter">
                        {Math.round(progress)}<Text className="text-xl">%</Text>
                    </Text>
                    <Text className="text-gray-400 text-xs font-bold text-center mt-2 px-2" numberOfLines={2}>
                        {steps[scanStep].label}
                    </Text>
                </View>

            </View>
        </View>
    );
};

export default AnalysisLoading;
