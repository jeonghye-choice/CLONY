/// <reference types="nativewind/types" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StyleSheet, Alert, Animated, Easing, TextInput, Platform, Switch, Modal, ActivityIndicator, SafeAreaView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import './src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ExpoLocation from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// --- Global Font Config ---

const setGlobalFont = () => {
  const customTextProps = {
    style: {
      fontFamily: 'Pretendard-ExtraBold',
    },
  };

  // @ts-ignore
  if (Text.defaultProps == null) Text.defaultProps = {};
  // @ts-ignore
  Text.defaultProps.style = { ...Text.defaultProps.style, fontFamily: 'Pretendard-ExtraBold' };

  // @ts-ignore
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  // @ts-ignore
  TextInput.defaultProps.style = { ...TextInput.defaultProps.style, fontFamily: 'Pretendard-ExtraBold' };
};

setGlobalFont();

setGlobalFont();


const { width, height } = Dimensions.get('window');

// --- Components ---

import AnalysisLoading from './src/components/AnalysisLoading';
import AnalysisResult from './src/components/AnalysisResult';
import BaumannSkinSurvey from './src/components/BaumannSkinSurvey';
import { ProductProvider } from './src/contexts/ProductContext';
import { CartProvider } from './src/contexts/CartContext';
import { OCRResultContainer } from './src/components/OCRResultContainer';
import CustomAlert from './src/components/CustomAlert';
import ExploreScreen from './src/screens/ExploreScreen';
import DeliveryTrackingScreen from './src/screens/DeliveryTrackingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyScreen from './src/screens/MyScreen';
import MyCabinetScreen from './src/screens/MyCabinetScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import TabIcon from './src/components/TabIcon';
import FAB from './src/components/FAB';
import SectionCard from './src/components/SectionCard';
import CameraScreen from './src/screens/CameraScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ReportScreen from './src/screens/ReportScreen';
import { translateAndEnrich } from './src/services/cosmeticsService';




// --- API Configuration ---
// Detected PC IP: 192.168.45.136
// Use 127.0.0.1 for iOS Simulator. For physical Android, use the Mac's Wi-Fi IP.
const API_URL = 'http://192.168.45.11:8000';





export default function App() {
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('./src/assets/fonts/Pretendard-ExtraBold.ttf'),
    'Pretendard-Black': require('./src/assets/fonts/Pretendard-Black.ttf'),
  });

  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'PROFILE_SETUP' | 'APP'>('LOGIN');
  const [registrationData, setRegistrationData] = useState({
    age: '',
    ingredients: [] as string[],
    allergies: [] as string[],
  });
  // --- Weather Logic (MVP) Removed ---


  const [activeTab, setActiveTab] = useState('Home');
  const [showCamera, setShowCamera] = useState(false);
  const [userName, setUserName] = useState("지민"); // Default
  const [loginProvider, setLoginProvider] = useState('kakao'); // Added for MyScreen
  const [isLoading, setIsLoading] = useState(true); // For Auto Login Check



  // --- Analysis State ---
  const [selectedCountry, setSelectedCountry] = useState<string>('kr');
  const [skinCode, setSkinCode] = useState<string>('unknown'); // Initialized to unknown
  const [userScore, setUserScore] = useState<number>(85); // Default
  const [analysisStep, setAnalysisStep] = useState<'NONE' | 'LOADING' | 'OCR_RESULT' | 'SKIN_RESULT' | 'SURVEY'>('NONE');
  const [scanMode, setScanMode] = useState<'PRODUCT'>('PRODUCT');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // --- Product Confirmation State ---
  const [scanResult, setScanResult] = useState<any>(null);

  // My Page Handlers
  const handleNicknameChange = (newName: string) => {
    setUserName(newName);
  };

  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' as any });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // --- Announcement State ---
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/announcements`);
      const data = await res.json();
      if (data && data.length > 0) {
        setAnnouncements(data);
        setShowAnnouncements(true);
      }
    } catch (e) {
      console.log('Failed to fetch announcements:', e);
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const addProduct = async (product: any) => {
    try {
      const existing = await AsyncStorage.getItem('my_cabinet');
      const cabinet = existing ? JSON.parse(existing) : [];
      cabinet.push({ ...product, id: Date.now() }); // Simple add
      await AsyncStorage.setItem('my_cabinet', JSON.stringify(cabinet));
      console.log("Product Added to Cabinet:", product.name);
    } catch (e) {
      console.error("Failed to add product:", e);
    }
  };



  const handleCameraComplete = (uri: string) => {
    // Camera Captured -> Start Loading Analysis
    console.log(`Camera Captured in mode: ${scanMode}`);
    setCapturedImage(uri);
    setShowCamera(false);
    setAnalysisStep('LOADING');
    setScanResult(null); // Reset result for new analysis

    // Start Real AI Analysis in background
    analyzeImage(uri);
  };

  const analyzeImage = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: 'skin_photo.jpg',
        type: 'image/jpeg',
      } as any);

      console.log("Sending to AI Server:", API_URL);
      const response = await fetch(`${API_URL}/analyze-product`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      console.log("AI Analysis Complete:", data);

      // --- Enhance recognized ingredients with local CosIng data ---
      if (data.keyIngredients && Array.isArray(data.keyIngredients)) {
        const enhanced = await Promise.all(
          data.keyIngredients.map(async (ing: any) => {
            const targetName = ing.nameKo || ing.name;
            const enriched = await translateAndEnrich(targetName);
            if (enriched) {
              return {
                ...ing,
                name: enriched.INGR_ENG_NAME || ing.name,
                nameKo: enriched.INGR_KOR_NAME || ing.nameKo,
                benefit: enriched.FUNCTION || ing.benefit,
                restriction: enriched.RESTRICTION,
                matchingScore: enriched.matchingScore
              };
            }
            return ing;
          })
        );
        data.keyIngredients = enhanced;
      }

      // --- Consistency Check ---
      setScanResult(data);


    } catch (e: any) {
      console.error("AI Analysis Failed:", e);
      const errorMsg = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e);
      Alert.alert('서버 연결 오류', `주소: ${API_URL}\n에러: ${errorMsg}\n\n1. 핸드폰과 PC가 같은 와이파이(SSID)인지 확인\n2. 방화벽 8000번 포트 '허용' 확인`);
      // Fallback for Product Scan too if server fails
      if (scanMode === 'PRODUCT') {
        const fallbackProduct = {
          id: 'fallback_' + Date.now(),
          name: '스캔된 제품 (분석 실패)',
          brand: '성분을 분석할 수 없습니다',
          ingredients: ['정보 없음'],
          keyIngredients: [], // Fix: Ensure this exists for OCRResultScreen
          matchingScore: 0,
          image: { uri: capturedImage || '' },
          skinType: 'OSNW', // Default
          warnings: [], // Default
          price: 0, // Default
          usageGuide: { time: 'Any', conflicts: [], caution: [] },
          reviews: '분석된 정보가 없습니다.',
          composition: { Active: 0, Moisturizer: 0, Calming: 0, Others: 0 }
        };
        setScanResult(fallbackProduct);
        if (analysisStep === 'LOADING') {
          // If we are still loading, valid transition -> wait for AnalysisLoading to pick up isReady
          // or if we rely on isReady, we don't need to force it here?
          // Actually, we REMOVED the manual transition in success path.
          // But in fallback path (catch), we might need to ensure passing??
          // No, setScanResult(fallbackProduct) will make isReady=true. 
          // AnalysisLoading will finish and call handleAnalysisLoaded.
          // handleAnalysisLoaded will see scanResult and set OCR_RESULT.
          // So we don't need manual transition here either!

          // However, keeping previous logic:
          // The previous code had:
          // if (analysisStep === 'LOADING') { setAnalysisStep('OCR_RESULT'); ... }
          // But I removed it from success. I should remove it from here too for consistency?
          // Wait, if I remove it, AnalysisLoading finishes naturally.
          // If I keep it, it forces immediate swap.
          // User said "Analysis Complete" appears, implies loading finished. 
          // So let's let AnalysisLoading handle it.
        }
      }


    }
  };


  const handleSurveyComplete = (result: any) => {
    if (result.skipped) {
      setAnalysisStep('NONE');
      return;
    }

    if (result.skinType) {
      setSkinCode(result.skinType);

      // Calculate a rough score based on sub-scores (0-15 each, total 60)
      // Map it to 0-100 scale for UI
      if (result.scores) {
        const total = result.scores.OD + result.scores.SR + result.scores.PN + result.scores.TW;
        const calculatedScore = Math.min(100, Math.round((total / 60) * 100));
        setUserScore(calculatedScore);

        // Save to history
        saveHistory({
          date: new Date().toISOString().split('T')[0],
          score: calculatedScore,
          type: result.skinType
        });
      }
    }
    setAnalysisStep('NONE');
    showAlert("설문 완료", "피부 분석 리포트가 업데이트되었습니다.", "success");
  };

  const handleAnalysisLoaded = () => {
    // Always transition to result if we have a scanResult
    if (scanResult) {
      addProduct(scanResult); // Add to history
      setAnalysisStep('OCR_RESULT');
    } else {
      console.log("AnalysisLoading timer finished, but scanResult is not yet ready. Waiting for analyzeImage...");
    }
  };

  // --- History Helper ---
  const saveHistory = async (record: any) => {
    try {
      const existing = await AsyncStorage.getItem('skin_history');
      const history = existing ? JSON.parse(existing) : [];
      history.push(record);
      await AsyncStorage.setItem('skin_history', JSON.stringify(history));
      console.log("History Saved:", record);
    } catch (e) {
      console.error("Failed to save history:", e);
    }
  };



  // Check for persistent login
  React.useEffect(() => {
    const checkLogin = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) {
          const { nickname, country } = JSON.parse(session);
          setUserName(nickname);
          if (country) setSelectedCountry(country);
          setAuthMode('APP'); // Simplified: Skip permission check if already logged in (optional) or go to PERMISSION
          fetchAnnouncements(); // Fetch announcements when user logs in successfully
        }
      } catch (e) {
        console.log('Failed to restore session');
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  const handleAuthSuccess = (name: string) => {
    setUserName(name);
    // Move to Profile Setup instead of immediately to APP
    setAuthMode('PROFILE_SETUP');
    fetchAnnouncements(); // Fetch announcements for new logins as well
  };

  const handleProfileComplete = async (nickname: string, country: string) => {
    const data = { ...registrationData, nickname, country };
    setRegistrationData(data);
    setUserName(nickname);
    setSelectedCountry(country);
    try {
      // Save profile data to AsyncStorage
      await AsyncStorage.setItem('user_profile', JSON.stringify(data));
      // Save session to skip login next time
      await AsyncStorage.setItem('user_session', JSON.stringify({ nickname, country }));
    } catch (e) {
      console.error("Failed to save profile/session:", e);
    }

    setAuthMode('APP');
    setAnalysisStep('SURVEY');
  };

  const handlePermissionGranted = async () => {
    // 1. Request Camera Permission (System Dialog)
    await requestCameraPermission();

    // 2. Request Location Permission (System Dialog)
    await ExpoLocation.requestForegroundPermissionsAsync();

    // 3. Close Modal & Proceed
    setShowPermissionModal(false);
    setAuthMode('APP');
  };

  const handleCameraOpen = () => {
    setScanMode('PRODUCT');
    setShowCamera(true);
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await AsyncStorage.removeItem('user_session');
    setAuthMode('LOGIN');
    setUserName("지민");
    setActiveTab('Home');
  };

  if (isLoading) return <View className="flex-1 bg-white items-center justify-center"><Text className="text-clony-primary font-bold">Clony Loading...</Text></View>;

  if (authMode === 'LOGIN') {
    return <LoginScreen onLogin={handleAuthSuccess} onGoToSignup={() => setAuthMode('SIGNUP')} apiUrl={API_URL} />;
  }

  if (authMode === 'SIGNUP') {
    return <SignupScreen onSignup={handleAuthSuccess} onGoToLogin={() => setAuthMode('LOGIN')} apiUrl={API_URL} />;
  }

  if (authMode === 'PROFILE_SETUP') {
    return <ProfileSetupScreen onComplete={handleProfileComplete} />;
  }



  // Permission Screen Logic Removed (Included in App as Modal)




  return (
    <ProductProvider>
      <CartProvider>
        <View className="flex-1 bg-gray-50">
          {showCamera ? (
            <CameraScreen onClose={() => setShowCamera(false)} onComplete={handleCameraComplete} />
          ) : analysisStep === 'LOADING' ? (
            <AnalysisLoading onComplete={handleAnalysisLoaded} imageUri={capturedImage} isReady={!!scanResult} />
          ) : (analysisStep === 'OCR_RESULT' && scanResult) ? (
            <OCRResultContainer
              product={scanResult}
              onClose={() => setAnalysisStep('NONE')}
            />
          ) : analysisStep !== 'NONE' ? (
            <>
              {/* 3. Analysis Flow - Show if analysisStep is active */}
              {analysisStep === 'SKIN_RESULT' && (
                <AnalysisResult
                  skinCode={skinCode}
                  score={userScore}
                  onClose={() => setAnalysisStep('NONE')}
                />
              )}
              {analysisStep === 'SURVEY' && (
                <BaumannSkinSurvey onComplete={handleSurveyComplete} />
              )}
            </>
          ) : (
            <>
              {activeTab === 'Home' && (
                <HomeScreen
                  userName={userName}
                  skinCode={skinCode}
                  userScore={userScore}
                  selectedCountry={selectedCountry}
                  onViewAll={() => { }}
                  onCartPress={() => showAlert('안내', '쇼핑 기능은 준비 중입니다.', 'info')}
                  onScanPress={handleCameraOpen}
                  onViewAnalysis={() => setAnalysisStep('SKIN_RESULT')}
                  onRetakeSurvey={() => setAnalysisStep('SURVEY')}
                />
              )}
              {activeTab === 'Explore' && <ExploreScreen />}
              {activeTab === 'Delivery' && <DeliveryTrackingScreen userName={userName} />}
              {activeTab === 'Report' && <ReportScreen />}
              {activeTab === 'MY' && (
                <MyScreen
                  userName={userName}
                  skinCode={skinCode}
                  onLogout={handleLogout}
                  onNicknameChange={handleNicknameChange}
                  loginProvider={loginProvider}
                  onScanPress={handleCameraOpen}
                  onCabinetPress={() => setActiveTab('Home')}
                  onDeliveryPress={() => setActiveTab('Delivery')}
                  onRetakeSurvey={() => setAnalysisStep('SURVEY')}
                />
              )}

              {/* Placeholder Screens */}
              {(activeTab !== 'Home' && activeTab !== 'Explore' && activeTab !== 'Delivery' && activeTab !== 'Community' && activeTab !== 'MY' && activeTab !== 'MagazineList' && activeTab !== 'Report') && (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-gray-400 font-bold text-lg">{activeTab} Page</Text>
                  <Text className="text-gray-300 text-sm mt-2">준비 중입니다</Text>
                </View>
              )}
            </>
          )}

          {/* FAB (Floating Camera Button) - Only verify if it should be hidden in certain tabs */}
          {/* Keeping duplicate FAB logic if user wants it specifically as a tab section, checking bottom nav below */}

          {/* Bottom Navigation - Hidden during Analysis/Survey and Camera */}
          {analysisStep === 'NONE' && !showCamera && (
            <View className="absolute bottom-10 left-6 right-6 bg-white flex-row items-center justify-between px-2 py-3 rounded-[35px] shadow-2xl shadow-black/20 border border-gray-50">
              <TabIcon name="home" label={t('common.home')} active={activeTab === 'Home'} onPress={() => setActiveTab('Home')} />
              <TabIcon name="compass-outline" label={t('common.explore')} active={activeTab === 'Explore'} onPress={() => setActiveTab('Explore')} />

              {/* Scan Button (Center) */}
              <View className="flex-1 items-center">
                <TouchableOpacity onPress={handleCameraOpen} className="items-center justify-center w-16 -mt-10">
                  <LinearGradient
                    colors={['#0091ad', '#00A676']}
                    className="w-16 h-16 rounded-full items-center justify-center shadow-lg border-4 border-white"
                  >
                    <Ionicons name="scan-outline" size={28} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TabIcon name="cube-outline" label={t('common.delivery')} active={activeTab === 'Delivery'} onPress={() => setActiveTab('Delivery')} />
              <TabIcon name="person-outline" label={t('common.my')} active={activeTab === 'MY'} onPress={() => setActiveTab('MY')} />
            </View>
          )}

          <StatusBar style="auto" />


          {/* Logout Modal UI */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showLogoutModal}
            onRequestClose={() => setShowLogoutModal(false)}
          >
            <View className="flex-1 bg-black/50 items-center justify-center px-8">
              <View className="bg-white w-full rounded-2xl p-6 items-center">
                <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="log-out" size={24} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">로그아웃 하시겠습니까?</Text>
                <Text className="text-gray-500 text-center mb-6">로그인 상태를 유지하려면{'\n'}취소 버튼을 눌러주세요.</Text>

                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity
                    onPress={() => setShowLogoutModal(false)}
                    className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                  >
                    <Text className="text-gray-700 font-bold">취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmLogout}
                    className="flex-1 py-3.5 bg-gray-900 rounded-xl items-center"
                  >
                    <Text className="text-white font-bold">로그아웃</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Permission Modal (Bottom Sheet Style) */}
          <Modal
            animationType="slide" // Permission Modal continues...
            transparent={true}
            visible={showPermissionModal}
            onRequestClose={() => {/* Prevent closing without agreement? */ }}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white w-full rounded-t-[30px] p-8 pb-12">
                <View className="items-center mb-8">
                  <View className="w-16 h-1 bg-gray-300 rounded-full mb-6" />
                  <Text className="text-2xl font-bold text-gray-900 mb-2">앱 접근 권한 안내</Text>
                  <Text className="text-gray-500 text-center">더 정확한 피부 분석과 맞춤 케어를 위해{'\n'}다음 권한을 허용해주세요.</Text>
                </View>

                <View className="gap-6 mb-10">
                  <View className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                    <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                      <Ionicons name="camera" size={24} color="#374151" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 text-lg mb-0.5">카메라</Text>
                      <Text className="text-gray-500 text-sm">피부 촬영 및 AI 분석을 위해 필요합니다.</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                    <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                      <Ionicons name="location" size={24} color="#374151" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900 text-lg mb-0.5">위치</Text>
                      <Text className="text-gray-500 text-sm">현재 날씨 기반 피부 조언을 위해 필요합니다.</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowPermissionModal(false);
                    handlePermissionGranted();
                  }}
                  className="w-full bg-clony-primary py-4 rounded-xl items-center shadow-lg shadow-green-200"
                >
                  <Text className="text-white font-bold text-lg">동의하고 시작하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <CustomAlert
            visible={alert.visible}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
          />

          {/* Announcements Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showAnnouncements}
            onRequestClose={() => setShowAnnouncements(false)}
          >
            <View className="flex-1 bg-black/50 items-center justify-center p-6">
              <View className="bg-white w-full rounded-3xl p-6 shadow-2xl max-h-[80%]">
                <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 pb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-clony-primary/10 items-center justify-center">
                      <Ionicons name="megaphone" size={16} color="#00D182" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900">공지사항</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowAnnouncements(false)} className="p-2 -mr-2">
                    <Ionicons name="close" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
                  {announcements.map((an, idx) => (
                    <View key={an.id || idx} className={`mb-4 pb-4 ${idx !== announcements.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <View className="flex-row items-center gap-2 mb-2">
                        {an.is_important ? (
                          <View className="bg-red-50 px-2 py-0.5 rounded">
                            <Text className="text-red-500 font-bold text-[10px]">중요</Text>
                          </View>
                        ) : null}
                        <Text className="text-base font-bold text-gray-800 flex-1">{an.title}</Text>
                      </View>
                      <Text className="text-gray-600 text-sm leading-relaxed">{an.content}</Text>
                      <Text className="text-gray-400 text-[10px] mt-2 text-right">
                        {new Date(an.created_at).toLocaleDateString('ko-KR')}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setShowAnnouncements(false)}
                  className="w-full bg-clony-primary py-4 rounded-xl items-center shadow-sm"
                >
                  <Text className="text-white font-bold text-base">확인했습니다</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </View>
      </CartProvider>
    </ProductProvider >
  );
}
