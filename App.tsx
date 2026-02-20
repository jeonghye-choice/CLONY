/// <reference types="nativewind/types" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StyleSheet, Alert, Animated, Easing, TextInput, Platform, Switch, Modal, ActivityIndicator, SafeAreaView, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ExpoLocation from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

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

import AnalysisLoading from './components/AnalysisLoading';
import AnalysisResult from './components/AnalysisResult';
import BaumannSkinSurvey from './components/BaumannSkinSurvey';
import { ProductProvider } from './contexts/ProductContext';
import { CartProvider } from './contexts/CartContext';
import { ProductConfirmModal } from './components/ProductConfirmModal';
import { OCRResultContainer } from './components/OCRResultContainer';
import CustomAlert from './components/CustomAlert';
import ExploreScreen from './components/ExploreScreen';
import DeliveryTrackingScreen from './components/DeliveryTrackingScreen';
import HomeScreen from './components/HomeScreen';
import MyScreen from './components/MyScreen';
import MyCabinetScreen from './components/MyCabinetScreen';
import CommunityScreen from './components/CommunityScreen';
import CartScreen from './components/CartScreen';
import CheckoutAddressScreen from './components/CheckoutAddressScreen';
import PaymentWebView from './components/PaymentWebView';



const TabIcon = ({ name, label, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} className="items-center justify-center w-16">
    <Ionicons name={name} size={24} color={active ? '#00D182' : '#9CA3AF'} />
    <Text className={`text-[10px] mt-1 ${active ? 'text-clony-primary font-bold' : 'text-gray-400'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const FAB = ({ onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="absolute bottom-6 right-6 w-16 h-16 bg-clony-primary rounded-full items-center justify-center shadow-lg border-4 border-white z-50 overflow-hidden"
    style={{ elevation: 5 }}
  >
    <Ionicons name="scan-outline" size={30} color="white" />
  </TouchableOpacity>
);

const SectionCard = ({ title, children, className = "" }: any) => (
  <View className={`bg-white rounded-[24px] p-6 mb-4 shadow-sm ${className}`}>
    {title && <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</Text>}
    {children}
  </View>
);

// --- Screens ---






// --- Camera & Result Screens (Reused logic) ---
const CameraScreen = ({ onClose, onComplete, userName = "최준호" }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0); // 0 to 100
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showSurveyIntro, setShowSurveyIntro] = useState(false); // New state for transition

  // Survey State
  const [isSurveying, setIsSurveying] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);

  // Use the generated face image from assets if available (for simulation)
  // For now using a placeholder or the captured image

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        if (photo) {
          // Immediately pass the captured image URI to the parent (App)
          // This triggers the switch to AnalysisLoading screen
          onComplete(photo.uri);
        }
      } catch (error) {
        console.error("Failed to take picture:", error);
        Alert.alert("사진 촬영 실패", "다시 시도해 주세요.");
      }
    }
  };

  // Internal runAnalysis logic removed


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
      {/* 1. Camera View */}
      {capturedImage && !isAnalyzing && analysisResult ? (
        // Static Image Background for Result
        <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} className="opacity-90" resizeMode="cover" />
      ) : (
        // Live Camera or Captured Image during Analysis
        capturedImage ? (
          <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} />
        ) : (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        )
      )}

      {/* 2. Top Header - AI VISION Badge */}
      <View className="absolute top-14 left-0 right-0 items-center z-10">
        <View className="flex-row items-center bg-black/40 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md">
          <Text className="text-white text-lg font-bold">Clony <Text className="text-clony-primary">AI VISION</Text></Text>
        </View>
      </View>

      {/* Close Button (Top Left) */}
      <TouchableOpacity
        onPress={onClose}
        className="absolute top-14 left-6 w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 z-20"
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>

      {/* Flash Button (Top Right) */}
      <TouchableOpacity
        className="absolute top-14 right-6 w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 z-20"
      >
        <Ionicons name="flash-off" size={24} color="white" />
      </TouchableOpacity>

      {/* Top Instruction Pill */}
      <View className="absolute top-32 left-0 right-0 items-center z-10">
        <View className="flex-row items-center bg-black/70 px-6 py-2.5 rounded-full">
          <Ionicons name="scan-outline" size={18} color="#00D182" />
          <Text className="text-white font-bold ml-2">성분표 전체가 잘 보이게 찍어주세요</Text>
        </View>
      </View>


      {/* 3. Analysis Overlay (During Scanning) */}
      {isAnalyzing && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 z-20">
          <View className="w-[80%] items-center">
            <Text className="text-white font-bold text-lg mb-4 drop-shadow-md">제품 분석 중</Text>
            {/* Progress Bar Container */}
            <View className="w-full h-12 bg-black rounded-full overflow-hidden flex-row items-center px-1 relative">
              {/* Progress Fill */}
              <View
                className="h-10 bg-white rounded-full absolute left-1"
                style={{ width: `${analysisProgress}%` }}
              />
              <Text className="w-full text-center text-gray-900 font-bold z-10 mix-blend-difference">
                {analysisProgress}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* OCR Scanning Guide (Screenshot Style) */}
      {!isAnalyzing && !analysisResult && (
        <View className="w-full h-full items-center justify-center p-0 m-0 z-0 pointer-events-none absolute">
          {/* Main Rectangular Guide with Glow */}
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
            {/* Corner Brackets */}
            {/* Top Left */}
            <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
            {/* Top Right */}
            <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
            {/* Bottom Left */}
            <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
            {/* Bottom Right */}
            <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
          </View>

          {/* Bottom Tip Overlay Box (Screenshot Style) */}
          <View className="absolute bottom-[17%] w-[80%] bg-black/50 p-4 rounded-xl items-center border border-white/10">
            <Text className="text-white text-center font-bold leading-6">
              그늘지지 않고 선명하게 찍힐수록{"\n"}분석 정확도가 올라갑니다 ✨
            </Text>
          </View>
        </View>
      )}

      {/* 4. Camera Controls (Bottom - Screenshot Alignment) */}
      {!isAnalyzing && !analysisResult && (
        <View className="absolute bottom-12 w-full items-center z-10">
          <View className="items-center">
            {/* Shutter Button with Ring */}
            <TouchableOpacity
              onPress={takePicture}
              className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-2xl"
              style={{ shadowColor: '#00D182', shadowOpacity: 0.5, shadowRadius: 15 }}
            >
              <View className="w-20 h-20 rounded-full border-4 border-clony-primary items-center justify-center" />
            </TouchableOpacity>

            <Text className="text-white/80 font-bold mt-8">촬영 버튼을 눌러 스캔하세요</Text>
          </View>
        </View>
      )}

      {/* 5. Result Bottom Sheet */}
      {!isAnalyzing && analysisResult && (
        <View className="absolute bottom-0 w-full bg-white rounded-t-[30px] p-8 pb-12 shadow-2xl z-30">
          <View className="w-full items-center mb-6">
            <View className="bg-white border border-gray-900 rounded-full px-6 py-2 mb-4">
              <Text className="font-bold text-gray-900">진단 결과</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {userName} 님은 <Text className="text-purple-600">{analysisResult.simple_type || analysisResult.type} 피부</Text>입니다
            </Text>

            {/* CNN Visualizer (Debug) */}
            {analysisResult.debug_image && (
              <View className="items-center mt-2 mb-2">
                <Text className="text-[10px] text-gray-400 font-bold mb-1">CNN FACE MESH</Text>
                <Image
                  source={{ uri: analysisResult.debug_image }}
                  className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200"
                  resizeMode="contain"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onComplete(analysisResult.score)} // Go to full report or close
            className="w-full"
          >
            <Text className="text-center text-gray-500 underline text-sm">더 자세히 확인해볼까요?</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="dark" />
    </View>
  );
};


// --- Auth Screens ---

// --- API Configuration ---
// Detected PC IP: 192.168.45.136
const API_URL = 'http://192.168.45.136:8000'; // Corrected to match Get-NetIPAddress output

// --- Permission Screen Removed (Integrated into Modal) ---

const LoginScreen = ({ onLogin, onGoToSignup }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      // 1. Try connecting to Real Server
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

      const response = await fetch(`${API_URL}/login`, {
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
        onLogin(data.nickname); // Real Data
      } else {
        Alert.alert("로그인 실패", data.detail || "이메일 또는 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      // 2. Server Down/Not Reachable -> Fallback to Mock
      console.log("Server unreachable, falling back to mock:", error);
      Alert.alert("알림", "서버와 연결할 수 없어 '체험 모드'로 로그인합니다.");
      if (stayLoggedIn) {
        await AsyncStorage.setItem('user_session', JSON.stringify({ nickname: "지민 (체험)" }));
      }
      onLogin("지민 (체험)"); // Mock Data
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-8 justify-center">
      <View className="items-center mb-12">
        <Text className="text-4xl font-bold text-clony-primary mb-2">Clony</Text>
        <Text className="text-gray-400">나만의 유니크한 스킨 케어</Text>
      </View>

      <View className="gap-4 mb-6">
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 mb-1">EMAIL</Text>
          <TextInput
            className="text-base text-gray-900"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 mb-1">PASSWORD</Text>
          <TextInput
            className="text-base text-gray-900"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>

      {/* Stay Logged In Checkbox */}
      <TouchableOpacity
        onPress={() => setStayLoggedIn(!stayLoggedIn)}
        className="flex-row items-center mb-8 gap-2"
      >
        <View className={`w-6 h-6 rounded-md border items-center justify-center ${stayLoggedIn ? 'bg-clony-primary border-clony-primary' : 'bg-white border-gray-300'}`}>
          {stayLoggedIn && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text className="text-gray-500">로그인 상태 유지</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className={`bg-clony-primary py-4 rounded-xl items-center shadow-lg shadow-green-200 mb-4 ${loading ? 'opacity-70' : ''}`}
      >
        <Text className="text-white font-bold text-lg">{loading ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      {/* Social Login Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-gray-100" />
        <Text className="mx-4 text-gray-400 text-xs font-bold">간편 로그인</Text>
        <View className="flex-1 h-[1px] bg-gray-100" />
      </View>

      {/* Social Login Buttons */}
      <View className="flex-row justify-center gap-4 mb-8">
        <TouchableOpacity
          onPress={() => onLogin("지민 (카카오)")}
          className="w-14 h-14 bg-[#FEE500] rounded-full items-center justify-center shadow-sm"
        >
          <Ionicons name="chatbubble" size={24} color="#3C1E1E" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onLogin("지민 (Google)")}
          className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
        >
          <Ionicons name="logo-google" size={24} color="#EA4335" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onLogin("지민 (Apple)")}
          className="w-14 h-14 bg-black rounded-full items-center justify-center shadow-sm"
        >
          <Ionicons name="logo-apple" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center gap-1">
        <Text className="text-gray-400">아직 계정이 없으신가요?</Text>
        <TouchableOpacity onPress={onGoToSignup}>
          <Text className="text-clony-primary font-bold">회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SignupScreen = ({ onSignup, onGoToLogin }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock Duplicate Nicknames (Fallback)
  const existingNicknames = ["admin", "clony", "root", "test"];

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      Alert.alert("입력 오류", "모든 정보를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. Try Real Server
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
        signal: controller.signal
      });
      clearTimeout(id);

      const data = await response.json();

      if (response.ok) {
        Alert.alert("회원가입 완료", `${data.nickname}님 환영합니다!`, [
          { text: "시작하기", onPress: () => onSignup(data.nickname) }
        ]);
      } else {
        Alert.alert("가입 실패", data.detail || "오류가 발생했습니다.");
      }
    } catch (error) {
      // 2. Fallback Mock Logic
      console.log("Server unreachable, falling back to mock:", error);

      if (existingNicknames.includes(nickname.toLowerCase())) {
        Alert.alert("닉네임 중복 (체험)", `"${nickname}"(은)는 이미 사용 중인 닉네임입니다.`);
      } else {
        Alert.alert("알림", "서버와 연결할 수 없어 '체험 모드'로 가입합니다.", [
          { text: "시작하기", onPress: () => onSignup(nickname) }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-8 justify-center">
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-gray-900 mb-2">회원가입</Text>
        <Text className="text-gray-400 text-center">피부 타입 진단부터 맞춤 루틴까지,{'\n'}Clony와 함께 시작하세요.</Text>
      </View>

      <View className="gap-4 mb-8">
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 mb-1">EMAIL</Text>
          <TextInput
            className="text-base text-gray-900"
            placeholder="사용하실 이메일"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 mb-1">PASSWORD</Text>
          <TextInput
            className="text-base text-gray-900"
            placeholder="비밀번호 설정"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 mb-1">NICKNAME</Text>
          <TextInput
            className="text-base text-gray-900"
            placeholder="앱에서 사용할 닉네임"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        className={`bg-gray-900 py-4 rounded-xl items-center shadow-lg mb-4 ${loading ? 'opacity-70' : ''}`}
      >
        <Text className="text-white font-bold text-lg">{loading ? '처리 중...' : '계정 만들기'}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center gap-1">
        <Text className="text-gray-400">이미 계정이 있으신가요?</Text>
        <TouchableOpacity onPress={onGoToLogin}>
          <Text className="text-clony-primary font-bold">로그인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ReportScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // Mock Data: Only showing past/current data (Jan 1st)
  const calendarData: { [key: number]: number } = {
    1: 85,
    // ... future data removed as per user request (It's Jan 1st)
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Helper to check if a day is in the future relative to "Today" (Real-time)
  const isFutureDate = (day: number) => {
    const today = new Date(); // 2026-01-01

    // If viewing a future month, everything is future
    if (currentDate.getFullYear() > today.getFullYear() ||
      (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() > today.getMonth())) {
      return true;
    }

    // If viewing current month, check day
    if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
      return day > today.getDate();
    }

    return false;
  };

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-clony-primary";
    if (score >= 60) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="pt-14 px-6 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Skin Report</Text>
        <Text className="text-gray-500">이번 달 피부 변화를 확인하세요</Text>
      </View>

      {/* Month Selector */}
      <View className="flex-row justify-between items-center px-8 py-6">
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
          <Ionicons name="chevron-forward" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View className="px-6 mb-10">
        {/* Weekday Headers */}
        <View className="flex-row mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <View key={d} className="flex-1 items-center">
              <Text className={`font-bold ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Days */}
        <View className="flex-row flex-wrap">
          {days.map((day, idx) => {
            // Only show score if it exists AND it's not a future date
            const score = (day && !isFutureDate(day)) ? calendarData[day] : null;

            return (
              <TouchableOpacity
                key={idx}
                disabled={!day || (!!day && isFutureDate(day))}
                onPress={() => day && setSelectedDate(day)}
                className="w-[14.28%] aspect-square items-center justify-center relative mb-2"
              >
                {day && (
                  <>
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${selectedDate === day ? 'bg-gray-900' : ''} ${isFutureDate(day) ? 'opacity-30' : ''}`}>
                      <Text className={`font-bold ${selectedDate === day ? 'text-white' : (idx % 7 === 0 ? 'text-red-400' : 'text-gray-800')}`}>{day}</Text>
                    </View>
                    {/* Score Dot */}
                    {score && (
                      <View className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${getScoreColor(score)}`} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Selected Date Details */}
      <View className="px-6 pb-20">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          {selectedDate ? `${currentDate.getMonth() + 1}월 ${selectedDate}일 리포트` : '날짜를 선택해주세요'}
        </Text>

        {selectedDate && calendarData[selectedDate] ? (
          <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-500 font-bold">피부 점수</Text>
              <View className={`px-3 py-1 rounded-full ${getScoreColor(calendarData[selectedDate])}`}>
                <Text className="text-white font-bold">{calendarData[selectedDate]}점</Text>
              </View>
            </View>
            <Text className="text-gray-800 leading-relaxed">
              {calendarData[selectedDate] >= 80 ? "피부 상태가 아주 좋아요! 💧 수분 관리가 잘 되고 있습니다." :
                calendarData[selectedDate] >= 60 ? "평범한 상태입니다. 😐 자외선 차단에 조금 더 신경 써주세요." :
                  "피부 컨디션이 좋지 않아요. 🚨 충분한 수면과 보습이 필요합니다."}
            </Text>
          </View>
        ) : (
          <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100 items-center">
            <Text className="text-gray-400">기록된 데이터가 없습니다.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};





export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('./assets/fonts/Pretendard-ExtraBold.ttf'),
    'Pretendard-Black': require('./assets/fonts/Pretendard-Black.ttf'),
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

  // Checkout Flow State
  const [checkoutStep, setCheckoutStep] = useState<'NONE' | 'CART' | 'ADDRESS' | 'PAYMENT' | 'SUCCESS'>('NONE');
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null);

  // --- Analysis State ---
  const [skinCode, setSkinCode] = useState<string>('OSNW'); // Default based on user image
  const [userScore, setUserScore] = useState<number>(85); // Default
  const [analysisStep, setAnalysisStep] = useState<'NONE' | 'LOADING' | 'OCR_RESULT' | 'SKIN_RESULT' | 'SURVEY'>('NONE');
  const [scanMode, setScanMode] = useState<'PRODUCT'>('PRODUCT');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // --- Product Confirmation State ---
  const [scanResult, setScanResult] = useState<any>(null);
  const [showProductConfirm, setShowProductConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // My Page Handlers
  const handleNicknameChange = (newName: string) => {
    setUserName(newName);
  };

  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' as any });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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

  const handleProductConfirm = () => {
    // User Confirmed: Proceed to Result Screen
    if (scanResult) {
      addProduct(scanResult); // Add to history now
      setShowProductConfirm(false);
      setAnalysisStep('OCR_RESULT');
    }
  };

  const handleProductEdit = async (query: string) => {
    // User input new name: Search again
    setConfirmLoading(true);
    try {
      const response = await fetch(`${API_URL}/products/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.error) {
        showAlert("검색 실패", "제품 정보를 찾을 수 없습니다.", 'error');
        setConfirmLoading(false);
        return;
      }

      // Update scanResult with new data
      const updatedResult = {
        ...scanResult, // Keep ID, ImageUrl, etc.
        name: data.name,
        brand: data.brand,
        category: data.category || "화장품",
        matchingScore: data.matchingScore || 95,
        skinType: data.skinType || "OSNW",
        keyIngredients: data.ingredients ? data.ingredients.map((ing: any) => ({
          name: ing.name,
          nameKo: ing.nameKo || ing.name,
          benefit: ing.benefit || "피부 케어"
        })) : [],
        warnings: data.warnings || [],
        ingredientComment: data.summary || data.description,
        effectSummary: data.effectSummary || data.summary || data.description,
        price: data.price || 0,
        ocr_used: false,
        composition: data.composition,
        usageGuide: data.usageGuide,
        badge: data.badge,
        fitHighlights: data.fitHighlights
      };

      setScanResult(updatedResult);
      addProduct(updatedResult);

      setConfirmLoading(false);
      setShowProductConfirm(false);
      setAnalysisStep('OCR_RESULT');

    } catch (e) {
      console.error("Product Search Error:", e);
      showAlert("오류", "제품 검색 중 문제가 발생했습니다.", 'error');
      setConfirmLoading(false);
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
      setShowProductConfirm(true);
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
          const { nickname } = JSON.parse(session);
          setUserName(nickname);
          setAuthMode('APP'); // Simplified: Skip permission check if already logged in (optional) or go to PERMISSION
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
  };

  const handleProfileComplete = async (data: any) => {
    setRegistrationData(data);
    setUserName(data.nickname);
    try {
      // Save profile data to AsyncStorage
      await AsyncStorage.setItem('user_profile', JSON.stringify(data));
      // Save session to skip login next time
      await AsyncStorage.setItem('user_session', JSON.stringify({ nickname: data.nickname }));
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
    return <LoginScreen onLogin={handleAuthSuccess} onGoToSignup={() => setAuthMode('SIGNUP')} />;
  }

  if (authMode === 'SIGNUP') {
    return <SignupScreen onSignup={handleAuthSuccess} onGoToLogin={() => setAuthMode('LOGIN')} />;
  }

  if (authMode === 'PROFILE_SETUP') {
    // Now directly finishing setup and going to APP/SURVEY
    // If needed, we could keep a simplified screen here, but for now cleanup
    return <View className="flex-1 bg-white items-center justify-center"><ActivityIndicator color="#00D182" /></View>;
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
              onAddToCart={() => setCheckoutStep('CART')}
              onCartPress={() => setCheckoutStep('CART')}
              onClose={() => setAnalysisStep('NONE')}
            />
          ) : checkoutStep !== 'NONE' ? (
            <>
              {/* 2. Checkout Flow - Show if checkoutStep is active */}
              {checkoutStep === 'CART' && (
                <CartScreen
                  onBack={() => setCheckoutStep('NONE')}
                  onCheckout={(items, amount) => {
                    setCheckoutInfo({ items, amount });
                    setCheckoutStep('ADDRESS');
                  }}
                />
              )}
              {checkoutStep === 'ADDRESS' && checkoutInfo && (
                <CheckoutAddressScreen
                  cartItems={checkoutInfo.items}
                  totalAmount={checkoutInfo.amount}
                  onBack={() => setCheckoutStep('CART')}
                  onNext={(deliveryInfo) => {
                    setCheckoutInfo({ ...checkoutInfo, deliveryInfo });
                    setCheckoutStep('PAYMENT');
                  }}
                />
              )}
              {checkoutStep === 'PAYMENT' && checkoutInfo && (
                <PaymentWebView
                  visible={true}
                  amount={checkoutInfo.amount}
                  orderId={`ORDER_${Date.now()}`}
                  orderName={checkoutInfo.items[0]?.name + (checkoutInfo.items.length > 1 ? ` 외 ${checkoutInfo.items.length - 1}건` : '')}
                  onSuccess={(paymentKey, orderId, amount) => {
                    setCheckoutInfo({ ...checkoutInfo, paymentKey, orderId, amount });
                    setCheckoutStep('SUCCESS');
                  }}
                  onFail={(err) => {
                    Alert.alert("결제 실패", err);
                    setCheckoutStep('ADDRESS');
                  }}
                  onClose={() => setCheckoutStep('ADDRESS')}
                />
              )}
              {checkoutStep === 'SUCCESS' && checkoutInfo && (
                <View className="flex-1 bg-white items-center justify-center p-8">
                  <Ionicons name="checkmark-circle" size={80} color="#00D182" />
                  <Text className="text-2xl font-bold mt-4">주문 완료!</Text>
                  <Text className="text-gray-500 text-center mt-2">주문번호: {checkoutInfo.orderId}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCheckoutStep('NONE');
                      setActiveTab('Home');
                    }}
                    className="mt-8 bg-clony-primary px-8 py-3 rounded-xl"
                  >
                    <Text className="text-white font-bold">홈으로 돌아가기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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
                  onViewAll={() => { }} // Magazine removed
                  onCartPress={() => setCheckoutStep('CART')}
                  onScanPress={handleCameraOpen}
                  onViewAnalysis={() => setAnalysisStep('SKIN_RESULT')}
                  onRetakeSurvey={() => setAnalysisStep('SURVEY')}
                />
              )}
              {activeTab === 'Explore' && <ExploreScreen />}
              {activeTab === 'Delivery' && <DeliveryTrackingScreen userName={userName} />}
              {activeTab === 'Community' && <CommunityScreen />}
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

          {/* Bottom Navigation - Hidden during checkout AND Analysis/Survey */}
          {checkoutStep === 'NONE' && analysisStep === 'NONE' && (
            <View className="absolute bottom-10 left-6 right-6 bg-white flex-row justify-between px-6 py-3 rounded-[35px] shadow-2xl shadow-black/20 border border-gray-50">
              <TabIcon name="home" label="홈" active={activeTab === 'Home'} onPress={() => setActiveTab('Home')} />
              <TabIcon name="compass-outline" label="탐색" active={activeTab === 'Explore'} onPress={() => setActiveTab('Explore')} />

              {/* Scan Button (Center) */}
              <TouchableOpacity onPress={handleCameraOpen} className="items-center justify-center w-16 -mt-8">
                <View className="w-16 h-16 bg-clony-primary rounded-full items-center justify-center shadow-lg border-4 border-white">
                  <Ionicons name="scan-outline" size={28} color="white" />
                </View>
              </TouchableOpacity>

              <TabIcon name="cube-outline" label="배송" active={activeTab === 'Delivery'} onPress={() => setActiveTab('Delivery')} />
              <TabIcon name="person-outline" label="MY" active={activeTab === 'MY'} onPress={() => setActiveTab('MY')} />
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

          {scanResult && (
            <ProductConfirmModal
              visible={showProductConfirm}
              productName={scanResult.name}
              brandName={scanResult.brand}
              productImage={capturedImage || ""}
              onConfirm={handleProductConfirm}
              onEdit_Search={handleProductEdit}
              onClose={() => setShowProductConfirm(false)}
              loading={confirmLoading}
              // @ts-ignore
              price={scanResult.price}
              // @ts-ignore
              originalPrice={scanResult.originalPrice}
            />
          )}
        </View>
      </CartProvider>
    </ProductProvider >
  );
}
