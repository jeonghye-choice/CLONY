import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface CameraScreenProps {
    onClose: () => void;
    onComplete: (uri: string) => void;
    userName?: string;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onClose, onComplete, userName = "최준호" }) => {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
                });
                if (photo) {
                    onComplete(photo.uri);
                }
            } catch (error) {
                console.error("Failed to take picture:", error);
                Alert.alert("사진 촬영 실패", "다시 시도해 주세요.");
            }
        }
    };

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <Text>카메라 권한이 필요합니다.</Text>
                <TouchableOpacity onPress={requestPermission} className="mt-4 bg-clony-primary p-3 rounded-lg"><Text className="text-white">권한 허용</Text></TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {capturedImage && !isAnalyzing && analysisResult ? (
                <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} className="opacity-90" resizeMode="cover" />
            ) : (
                capturedImage ? (
                    <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} />
                ) : (
                    <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                )
            )}

            <View className="absolute top-14 left-0 right-0 items-center z-10">
                <View className="flex-row items-center bg-black/40 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md">
                    <Text className="text-white text-lg font-bold">Clony <Text className="text-clony-primary">{t('camera.guide_title') || 'AI VISION'}</Text></Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={onClose}
                className="absolute top-14 left-6 w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 z-20"
            >
                <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
                className="absolute top-14 right-6 w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 z-20"
            >
                <Ionicons name="flash-off" size={24} color="white" />
            </TouchableOpacity>

            <View className="absolute top-32 left-0 right-0 items-center z-10">
                <View className="flex-row items-center bg-black/70 px-6 py-2.5 rounded-full">
                    <Ionicons name="scan-outline" size={18} color="#00D182" />
                    <Text className="text-white font-bold ml-2">{t('camera.scan_hint') || '성분표 전체가 잘 보이게 찍어주세요'}</Text>
                </View>
            </View>

            {!isAnalyzing && !analysisResult && (
                <View className="w-full h-full items-center justify-center p-0 m-0 z-0 pointer-events-none absolute">
                    <View
                        className="w-[340px] h-[450px] rounded-2xl border border-clony-primary/30"
                        style={{
                            shadowColor: '#00D182',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 20,
                            elevation: 20,
                        }}
                    >
                        <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                        <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                        <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                        <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                    </View>

                    <View className="absolute bottom-[28%] w-[80%] bg-black/60 p-4 rounded-2xl items-center border border-white/20">
                        <Text className="text-white text-center font-bold leading-6">
                            {t('camera.accuracy_tip') || '그늘지지 않고 선명하게 찍힐수록\n분석 정확도가 올라갑니다 ✨'}
                        </Text>
                    </View>
                </View>
            )}

            {!isAnalyzing && !analysisResult && (
                <View className="absolute bottom-12 w-full items-center z-10">
                    <View className="items-center">
                        <TouchableOpacity
                            onPress={takePicture}
                            className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-2xl"
                            style={{ shadowColor: '#00D182', shadowOpacity: 0.5, shadowRadius: 15 }}
                        >
                            <View className="w-20 h-20 rounded-full border-4 border-clony-primary items-center justify-center" />
                        </TouchableOpacity>

                        <Text className="text-white/80 font-bold mt-8">{t('camera.shutter_hint') || '촬영 버튼을 눌러 스캔하세요'}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

export default CameraScreen;
