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

const { width, height } = Dimensions.get('window');

// --- Components ---

import AnalysisLoading from './components/AnalysisLoading';
import ScientificSurvey from './components/ScientificSurvey';
import DailySurvey from './components/DailySurvey';
import AnalysisResult from './components/AnalysisResult';

const ScanOverlay = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.15, height * 0.15] // Scan up/down within face area
  });

  return (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center">
      {/* Face Contour Guide (Static) */}
      <View className="w-[280px] h-[380px] border-4 border-clony-primary/50 rounded-[140px] border-dashed"
        style={{ shadowColor: '#00D182', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}>

        {/* Animated Scan Mesh/Line inside the Face Guide */}
        <Animated.View style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: '#00D182',
          opacity: 0.8,
          shadowColor: '#00D182',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 10,
          transform: [{ translateY }]
        }} />

        {/* Scanning Grid (Optional) */}
        <Animated.View style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 100,
          marginTop: -50,
          backgroundColor: '#00D182',
          opacity: 0.1,
          transform: [{ translateY }]
        }} />
      </View>

      {/* Helper Text */}
      <View className="absolute bottom-[20%] items-center">
        <Text className="text-white text-lg font-bold drop-shadow-md shadow-black mb-1">Face Analysis</Text>
        <Text className="text-clony-primary text-sm font-bold animate-pulse">얼굴 윤곽을 가이드에 맞춰주세요</Text>
      </View>
    </View>
  );
};

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
    <Ionicons name="camera" size={30} color="white" />
  </TouchableOpacity>
);

const SectionCard = ({ title, children, className = "" }: any) => (
  <View className={`bg-white rounded-[24px] p-6 mb-4 shadow-sm ${className}`}>
    {title && <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</Text>}
    {children}
  </View>
);

// --- Screens ---

const RecommendationScreen = ({ onCameraOpen }: any) => {
  const products = [
    {
      category: "SKIN & TONER",
      items: [
        { id: 1, brand: "아누아", name: "어성초 77 수딩 토너", match: 98, type: "수부지", image: require('./assets/product_images/toner.png') },
        { id: 2, brand: "스킨푸드", name: "캐롯 카로틴 패드", match: 95, type: "건성", image: require('./assets/product_images/pad.png') }
      ]
    },
    {
      category: "LOTION & CREAM",
      items: [
        { id: 3, brand: "닥터지", name: "레드 블레미쉬 크림", match: 92, type: "지성", image: require('./assets/product_images/cream.png') },
        { id: 4, brand: "라네즈", name: "워터 슬리핑 마스크", match: 89, type: "민감성", image: require('./assets/product_images/mask.png') }
      ]
    }
  ];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-6 pt-14 pb-4">
        <Text className="text-2xl font-bold text-gray-900 leading-tight">
          당신과 가장 잘 맞을{'\n'}
          <Text className="text-clony-primary underline decoration-4 underline-offset-4">로션</Text> 추천드려요
        </Text>
      </View>

      {products.map((section, idx) => (
        <View key={idx} className="mb-6 px-5">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase">{section.category}</Text>
            {idx === 0 && <View className="bg-green-100 px-2 py-1 rounded"><Text className="text-clony-primary text-[10px] font-bold">Best Match</Text></View>}
          </View>

          {section.items.map((item) => (
            <View key={item.id} className="flex-row bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm items-center">
              <Image source={item.image} className="w-16 h-16 rounded-lg bg-gray-50 mr-4" resizeMode="contain" />
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="text-gray-400 text-xs font-bold">{item.brand}</Text>
                  <View className="bg-clony-primary px-2 py-1 rounded-md">
                    <Text className="text-white text-[10px] font-bold">{item.type} {item.match}% 일치</Text>
                  </View>
                </View>
                <Text className="text-gray-800 font-bold text-lg">{item.name}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

// --- Magazine Components ---
const MagazineWriteModal = ({ visible, onClose }: any) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-12">
        <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text className="font-bold text-lg">매거진 작성</Text>
          <TouchableOpacity onPress={() => { Alert.alert("완료", "게시글이 등록되었습니다."); onClose(); }}>
            <Text className="text-clony-primary font-bold text-base">등록</Text>
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-6 pt-6">
          <TextInput
            placeholder="제목을 입력하세요"
            className="text-2xl font-bold text-gray-900 mb-6"
            multiline
          />
          <View className="h-40 bg-gray-50 rounded-xl mb-6 items-center justify-center border border-gray-200 border-dashed">
            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs mt-2">커버 이미지 추가</Text>
          </View>
          <TextInput
            placeholder="내용을 입력하세요..."
            className="text-base text-gray-700 leading-relaxed h-64"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const MagazineListScreen = ({ onBack }: any) => {
  const articles = [
    { category: "Skin Care", title: "겨울철 속건조, 이것만 알면 해결!", date: "Dec 28", readTime: "5 min", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800" },
    { category: "Ingredients", title: "레티놀 vs 비타민C, 나에게 맞는 성분은?", date: "Dec 25", readTime: "7 min", imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800" },
    { category: "Trends", title: "2025년 뷰티 트렌드: AI와 맞춤형 화장품", date: "Dec 20", readTime: "4 min", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800" },
    { category: "Routine", title: "무너진 피부 장벽 되살리는 3단계 루틴", date: "Dec 18", readTime: "6 min", imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=800" },
    { category: "Life", title: "피부에 좋은 수면 습관 5가지", date: "Dec 15", readTime: "3 min", imageUrl: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800" }
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 px-6 pb-4 border-b border-gray-100 flex-row items-center gap-4">
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Magazine</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {articles.map((article, index) => (
          <TouchableOpacity key={index} className="flex-row gap-4 mb-6 bg-white">
            <Image source={{ uri: article.imageUrl }} className="w-24 h-24 rounded-xl bg-gray-200" resizeMode="cover" />
            <View className="flex-1 justify-center">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-[10px] font-bold text-clony-primary bg-green-50 px-2 py-0.5 rounded-full">{article.category}</Text>
                <Text className="text-[10px] text-gray-400">{article.date}</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900 leading-tight mb-1" numberOfLines={2}>{article.title}</Text>
              <Text className="text-[10px] text-gray-500">{article.readTime} read</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// --- Magazine Section (Home Preview) ---
const MagazineSection = ({ onViewAll }: any) => {
  const articles = [
    {
      category: "Skin Care",
      title: "겨울철 속건조, 이것만 알면 해결!",
      date: "Dec 28",
      readTime: "5 min",
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800",
    },
    {
      category: "Ingredients",
      title: "레티놀 vs 비타민C, 나에게 맞는 성분은?",
      date: "Dec 25",
      readTime: "7 min",
      imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800",
    },
    {
      category: "Trends",
      title: "2025년 뷰티 트렌드: AI와 맞춤형 화장품",
      date: "Dec 20",
      readTime: "4 min",
      imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800",
    }
  ];

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-end px-6 mb-4">
        <Text className="text-xl font-bold text-gray-900">
          Clony <Text className="text-clony-primary">Magazine</Text>
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text className="text-gray-400 text-xs">전체보기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
        {articles.map((article, index) => (
          <TouchableOpacity key={index} className="w-64 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <Image source={{ uri: article.imageUrl }} className="w-full h-40 bg-gray-200" resizeMode="cover" />
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[10px] font-bold text-clony-primary bg-green-50 px-2 py-1 rounded-full">{article.category}</Text>
                <Text className="text-[10px] text-gray-400">{article.date}</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2" numberOfLines={2}>
                {article.title}
              </Text>
              <Text className="text-[10px] text-gray-500">{article.readTime} read</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// --- Community Components ---
const CommunityWriteModal = ({ visible, onClose }: any) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-12">
        <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text className="font-bold text-lg">질문/후기 작성</Text>
          <TouchableOpacity onPress={() => { Alert.alert("완료", "게시글이 등록되었습니다."); onClose(); }}>
            <Text className="text-clony-primary font-bold text-base">등록</Text>
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-6 pt-6">
          <TextInput
            placeholder="제목을 입력하세요"
            className="text-xl font-bold text-gray-900 mb-6"
            multiline
          />
          <TextInput
            placeholder="피부 고민이나 꿀팁을 나누어보세요..."
            className="text-base text-gray-700 leading-relaxed h-64"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const PostDetailModal = ({ post, visible, onClose, isLiked, onToggleLike, likeCount }: any) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  // Reset comments when post changes
  React.useEffect(() => {
    setComments(["저도 같은 고민이에요 ㅠㅠ", "토너 하나만 바꿔보세요!"]);
    setComment("");
  }, [post]);

  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment("");
    }
  };

  if (!post) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-12">
        {/* Header */}
        <View className="flex-row items-center gap-4 px-4 pb-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <Text className="font-bold text-lg">게시글 상세</Text>
        </View>

        <ScrollView className="flex-1">
          {/* Post Content */}
          <View className="p-6 border-b border-gray-100">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                <Text>{post.avatar}</Text>
              </View>
              <View>
                <Text className="text-sm font-bold text-gray-900">{post.user}</Text>
                <Text className="text-xs text-gray-400">1시간 전</Text>
              </View>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-4">{post.question}</Text>
            <Text className="text-gray-700 leading-relaxed mb-6">{post.preview}</Text>
            <View className={`self-start px-2 py-1 rounded-md mb-2 ${post.tagColor}`}>
              <Text className="text-xs font-bold">{post.tag}</Text>
            </View>

            {/* Like Button in Detail */}
            <TouchableOpacity
              onPress={onToggleLike}
              className={`flex-row items-center gap-2 self-start px-4 py-2 rounded-full border ${isLiked ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}
            >
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#F472B6" : "#9CA3AF"} />
              <Text className={`font-bold ${isLiked ? 'text-pink-400' : 'text-gray-400'}`}>
                {isLiked ? '공감해요' : '공감하기'} {likeCount}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View className="p-6 pb-20">
            <Text className="font-bold text-gray-900 mb-4">댓글 {comments.length}</Text>
            {comments.map((c, i) => (
              <View key={i} className="flex-row gap-3 mb-4">
                <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                  <Text>👤</Text>
                </View>
                <View className="flex-1 bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                  <Text className="text-sm text-gray-800">{c}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8">
          <View className="flex-row items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
            <TextInput
              className="flex-1 text-sm text-gray-900"
              placeholder="댓글을 입력하세요..."
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity onPress={handleAddComment}>
              <Ionicons name="arrow-up-circle" size={32} color={comment.trim() ? "#00D182" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CommunityScreen = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [showWrite, setShowWrite] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set()); // Track liked IDs

  const toggleLike = (id: number) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState("");

  const posts = [
    {
      id: 1,
      user: "지성피부고민러",
      avatar: "👩",
      tag: "#수부지템",
      tagColor: "bg-blue-50 text-blue-600",
      question: "속건조 잡는 수분크림 추천해주세요! ㅠㅠ",
      answers: 12,
      likes: 45,
      preview: "겉은 번들거리는데 세수하고 나면 너무 당겨요... 가벼우면서도 수분감 오래가는 제품 없을까요?"
    },
    {
      id: 2,
      user: "모공요정",
      avatar: "🧑",
      tag: "#모공케어",
      tagColor: "bg-green-50 text-green-600",
      question: "코 모공 작아지는 꿀팁 공유합니다 (3주차 후기)",
      answers: 8,
      likes: 120,
      preview: "클로니 AI 진단받고 추천해준 BHA 토너랑 레티놀 앰플 조합으로 관리한 지 3주 됐는데 진짜 효과 있어요!"
    },
    {
      id: 3,
      user: "예민보스",
      avatar: "👧",
      tag: "#민감성",
      tagColor: "bg-pink-50 text-pink-600",
      question: "피부과 시술 후 진정 케어 어떻게 하시나요?",
      answers: 24,
      likes: 89,
      preview: "어제 레이저 받고 왔는데 얼굴이 너무 붉어요. 자극 없이 진정시킬 수 있는 마스크팩이나 크림 있을까요?"
    }
  ];

  const filteredPosts = posts.filter(post =>
    post.question.includes(searchQuery) ||
    post.preview.includes(searchQuery) ||
    post.tag.includes(searchQuery)
  );

  const tabs = ['전체', '스킨케어', '제품추천', '비포애프터', '꿀팁공유'];



  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" stickyHeaderIndices={[1]}>
        <View className="px-6 pt-16 pb-4 bg-white">
          <Text className="text-clony-primary font-bold text-xs tracking-widest mb-1">CLONY COMMUNITY</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            나와 같은 피부 고민,{'\n'}
            <Text className="text-clony-primary">함께 해결해요</Text>
          </Text>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-gray-900 font-bold"
              placeholder="궁금한 내용을 검색해보세요"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sticky Tabs */}
        <View className="bg-gray-50 py-4 pl-6 border-b border-gray-100/50">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full border ${activeTab === tab ? 'bg-clony-primary border-clony-primary' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-sm font-bold ${activeTab === tab ? 'text-white' : 'text-gray-500'}`}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="px-6 py-4 gap-4 pb-32">
          {filteredPosts.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="search-outline" size={48} color="#E5E7EB" />
              <Text className="text-gray-400 font-bold mt-4">검색 결과가 없어요.</Text>
            </View>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = likedPostIds.has(post.id);
              const displayLikes = post.likes + (isLiked ? 1 : 0);

              return (
                <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`px-2 py-1 rounded-md ${post.tagColor}`}>
                      <Text className="text-[10px] font-bold">{post.tag}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="w-5 h-5 bg-gray-100 rounded-full items-center justify-center">
                        <Text className="text-[10px]">{post.avatar}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">{post.user}</Text>
                    </View>
                  </View>

                  <Text className="font-bold text-gray-900 text-base mb-2 leading-tight">Q. {post.question}</Text>
                  <Text className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed" numberOfLines={2}>{post.preview}</Text>

                  <View className="flex-row items-center gap-4 pt-4 border-t border-gray-50">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="chatbubble-outline" size={14} color="#00D182" />
                      <Text className="text-xs text-gray-400">답변 {post.answers}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleLike(post.id)}
                      className="flex-row items-center gap-1"
                    >
                      <Ionicons name={isLiked ? "heart" : "heart-outline"} size={14} color={isLiked ? "#F472B6" : "#9CA3AF"} />
                      <Text className={`text-xs ${isLiked ? 'text-pink-400 font-bold' : 'text-gray-400'}`}>{displayLikes}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView >

      {/* Write FAB */}
      <TouchableOpacity
        onPress={() => setShowWrite(true)}
        className="absolute bottom-28 right-6 w-14 h-14 bg-black rounded-full items-center justify-center shadow-lg transform transition-transform"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 }}
      >
        <Ionicons name="pencil" size={24} color="white" />
      </TouchableOpacity>

      {/* Modals */}
      <CommunityWriteModal visible={showWrite} onClose={() => setShowWrite(false)} />
      <PostDetailModal
        post={selectedPost}
        visible={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        isLiked={selectedPost ? likedPostIds.has(selectedPost.id) : false}
        onToggleLike={() => selectedPost && toggleLike(selectedPost.id)}
        likeCount={selectedPost ? (selectedPost.likes + (likedPostIds.has(selectedPost.id) ? 1 : 0)) : 0}
      />
    </View >
  );
};

const HomeScreen = ({ onCameraOpen, score, userName, onViewAll, onNavigateToReport }: any) => {
  const [keyword, setKeyword] = useState("로션");
  const [analysisText, setAnalysisText] = useState({ subject: "수분이", text: "지난주보다", val: "15%", suffix: "늘었어요! 📈" });
  const [weather, setWeather] = useState({ temp: '-', insight: '오늘 날씨 정보를 불러오는 중...', icon: 'cloud-outline' as any });

  React.useEffect(() => {
    // 1. Text Rotation Logic
    const keywords = ["로션", "스킨", "패드", "크림"];
    let kIndex = 0;

    const analysisOptions = [
      { subject: "수분이", text: "지난주보다", val: "15%", suffix: "늘었어요! 📈" },
      { subject: "탄력이", text: "평소보다", val: "8%", suffix: "좋아졌어요! ✨" },
      { subject: "피지가", text: "지난주보다", val: "12%", suffix: "줄었어요! 📉" }
    ];
    let aIndex = 0;

    const interval = setInterval(() => {
      kIndex = (kIndex + 1) % keywords.length;
      setKeyword(keywords[kIndex]);

      aIndex = (aIndex + 1) % analysisOptions.length;
      setAnalysisText(analysisOptions[aIndex]);
    }, 2000);

    // 2. Weather Fetch Logic
    (async () => {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather({ temp: '20°C', insight: '위치 권한이 없어 서울 날씨로 대체합니다.', icon: 'partly-sunny-outline' });
        return;
      }

      try {
        let location = await ExpoLocation.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Use Open-Meteo (Free, No Key required)
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await response.json();
        const { temperature, weathercode } = data.current_weather;

        let condition = "sunny";
        let insightMsg = "자외선 차단제 필수! ☀️";
        let iconName = "sunny-outline" as any;

        // Simple WMO Code Mapping
        if (weathercode === 0) { // Clear
          insightMsg = "햇살이 강해요! ☀️ 자외선 차단 꼼꼼히!";
          iconName = "sunny";
        } else if (weathercode <= 3) { // Cloudy
          insightMsg = "구름이 꼈네요 ☁️ 산뜻한 수분 케어 추천!";
          iconName = "cloudy-outline";
        } else if (weathercode >= 51 && weathercode <= 67) { // Rain
          insightMsg = "비 오는 날 ☔️ 끈적임 없는 가벼운 로션!";
          iconName = "rainy-outline";
        } else if (weathercode >= 71) { // Snow
          insightMsg = "눈 오는 날 ❄️ 보습 장벽을 탄탄하게!";
          iconName = "snow-outline";
        } else {
          insightMsg = "건조주의보! 💧 수분 크림 듬뿍 바르세요.";
        }

        setWeather({
          temp: `${temperature}°C`,
          insight: insightMsg,
          icon: iconName
        });

      } catch (error) {
        console.log("Weather fetch error:", error);
        setWeather({ temp: '22°C', insight: '날씨 정보를 가져올 수 없어요.', icon: 'alert-circle-outline' });
      }
    })();

    return () => clearInterval(interval);
  }, []);

  // Dynamic Weekly Data (Last 7 Days)
  const weeklyData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = days[d.getDay()];
      // Mock values: pseudo-random but consistent for the day
      // Using date number to generate a 'random' score between 50 and 95
      const mockVal = 50 + (d.getDate() * 13) % 45;

      data.push({
        day: dayLabel,
        val: mockVal,
        label: mockVal.toString()
      });
    }

    // If we have a real score today, override the last entry
    if (score && score !== '--') {
      data[6].val = typeof score === 'number' ? score : parseInt(score);
      data[6].label = score.toString();
    }

    return data;
  }, [score]);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 pb-6 bg-white">
        <Text className="text-2xl font-bold text-clony-primary">Clony</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "오늘의 피부 점수는?",
            "지금 바로 피부를 촬영하고\n나만의 맞춤 루틴을 추천받아보세요! 📸",
            [
              { text: "나중에", style: "cancel" },
              { text: "진단하기", onPress: onCameraOpen }
            ]
          );
        }}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-4">
        {/* 1. Today's Skin Score (Green Card) */}
        <TouchableOpacity onPress={onCameraOpen} activeOpacity={0.9} className="bg-clony-primary rounded-[32px] p-7 shadow-lg relative overflow-hidden h-[280px]">
          {/* Decorative Circle */}
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <View className="absolute bottom-10 left-10 w-20 h-20 bg-black/5 rounded-full blur-xl" />

          <Text className="text-white/80 font-bold tracking-widest text-xs mb-2">TODAY'S SKIN SCORE</Text>
          <View className="flex-row items-baseline mb-6">
            <Text className="text-7xl font-bold text-white mr-3">{score || '--'}</Text>
            <Text className="text-2xl font-bold text-white/90">{score ? 'Good' : '점수 확인하기'}</Text>
          </View>

          {/* Mini Chart Mockup */}
          <View className="absolute top-8 right-8 flex-row items-end h-16 gap-1">
            {[40, 60, 30, 80, 50].map((h, i) => (
              <View key={i} style={{ height: `${h}%` as any, width: 6 }} className="bg-white/30 rounded-full" />
            ))}
          </View>

          {/* Metrics */}
          <View className="flex-row justify-between mt-auto">
            {[
              { label: '수분', val: score ? '72%' : '-' },
              { label: '탄력', val: score ? '84%' : '-' },
              { label: '피지', val: score ? '12%' : '-' }
            ].map((item, i) => (
              <View key={i} className="bg-white/20 rounded-2xl px-5 py-3 w-[30%] items-center backdrop-blur-sm">
                <Text className="text-white/80 text-xs mb-1 font-bold">{item.label}</Text>
                <Text className="text-white font-bold text-lg">{item.val}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* 2. Weekly Analysis (Bar Chart) */}
        <TouchableOpacity onPress={onNavigateToReport} activeOpacity={0.9}>
          <SectionCard title="Weekly Analysis" className="mt-6 pointer-events-none">
            <Text className="text-lg text-gray-800 font-bold mb-6">
              {analysisText.subject} {analysisText.text} <Text className="text-clony-primary" style={{ includeFontPadding: false }}>{analysisText.val}</Text> {analysisText.suffix}
            </Text>

            <View className="h-40 flex-row items-end justify-between px-2">
              {weeklyData.map((d, i) => {
                const isToday = i === weeklyData.length - 1;
                const height = d.val; // simple mapping
                return (
                  <View key={i} className="items-center w-8">
                    {/* Value Label (only for today) */}
                    {isToday && <Text className="text-clony-primary font-bold text-[10px] mb-1">{d.label}</Text>}

                    {/* Bar */}
                    <View
                      style={{ height: `${height}%` }}
                      className={`w-full rounded-t-lg ${isToday ? 'bg-clony-primary' : 'bg-gray-100'}`}
                    />

                    {/* Day Label */}
                    <Text className={`text-[10px] mt-2 ${isToday ? 'text-clony-primary font-bold' : 'text-gray-300'}`}>
                      {d.day}
                    </Text>
                  </View>
                )
              })}
            </View>
          </SectionCard>
        </TouchableOpacity>

        {/* 3. Weather Insight (Dynamic) */}
        <View className="flex-row bg-white rounded-[24px] p-5 shadow-sm items-center gap-4 mb-20">
          <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
            <Ionicons name={weather.icon} size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <View className="bg-green-100 self-start px-2 py-0.5 rounded-md mb-1 flex-row items-center gap-2">
              <Text className="text-clony-primary text-[10px] font-bold">WEATHER INSIGHT</Text>
              <Text className="text-gray-400 text-[10px]">{weather.temp}</Text>
            </View>
            <Text className="text-gray-800 font-bold text-sm leading-tight">
              {weather.insight}
            </Text>
          </View>
        </View>
        {/* 4. Product Recommendations (Merged) */}
        <View className="mb-6 pt-6 border-t border-gray-100">
          <Text className="text-2xl font-bold text-gray-900 leading-tight mb-6">
            <Text className="text-clony-primary">{userName}님</Text>과 가장 잘 맞을{'\n'}
            <Text className="text-clony-primary underline decoration-4 underline-offset-4">{keyword}</Text> 추천드려요
          </Text>

          {[
            {
              category: "SKIN & TONER",
              items: [
                { id: 1, brand: "아누아", name: "어성초 77 수딩 토너", match: 98, type: "수부지", image: require('./assets/product_images/toner.png') },
                { id: 2, brand: "스킨푸드", name: "캐롯 카로틴 패드", match: 95, type: "건성", image: require('./assets/product_images/pad.png') }
              ]
            },
            {
              category: "LOTION & CREAM",
              items: [
                { id: 3, brand: "닥터지", name: "레드 블레미쉬 크림", match: 92, type: "지성", image: require('./assets/product_images/cream.png') },
                { id: 4, brand: "라네즈", name: "워터 슬리핑 마스크", match: 89, type: "민감성", image: require('./assets/product_images/mask.png') }
              ]
            }
          ].map((section, idx) => (
            <View key={idx} className="mb-6">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase">{section.category}</Text>
                {idx === 0 && <View className="bg-green-100 px-2 py-1 rounded"><Text className="text-clony-primary text-[10px] font-bold">Best Match</Text></View>}
              </View>

              {section.items.map((item) => (
                <View key={item.id} className="flex-row bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm items-center">
                  <Image source={item.image} className="w-16 h-16 rounded-lg bg-gray-50 mr-4" resizeMode="contain" />
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-gray-400 text-xs font-bold">{item.brand}</Text>
                      <View className="bg-clony-primary px-2 py-1 rounded-md">
                        <Text className="text-white text-[10px] font-bold">{item.type} {item.match}% 일치</Text>
                      </View>
                    </View>
                    <Text className="text-gray-800 font-bold text-lg">{item.name}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* 5. Magazine Section */}
        <MagazineSection onViewAll={onViewAll} />
      </View>
    </ScrollView>
  );
}

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
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
        )
      )}

      {/* 2. Top Header "Clony" */}
      <View className="absolute top-12 left-0 right-0 flex-row justify-between items-center px-6 z-10">
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="home-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Clony</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>


      {/* 3. Analysis Overlay (During Scanning) */}
      {isAnalyzing && (
        <View className="absolute inset-0 items-center justify-center bg-black/40 z-20">
          <View className="w-[80%] items-center">
            <Text className="text-white font-bold text-lg mb-4 drop-shadow-md">얼굴 인식 중</Text>
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

      {/* Face Guide Overlay */}
      {!isAnalyzing && !analysisResult && (
        <View className="w-full h-full items-center justify-center p-0 m-0 z-0 pointer-events-none absolute">
          {/* Text - Positioned Relative to Screen or Guide */}
          <Text className="text-white font-bold text-lg drop-shadow-md shadow-black text-center absolute top-32 z-10">
            얼굴을 가이드에 맞춰주세요
          </Text>

          {/* Guide - Centered Box */}
          <View className="w-[280px] h-[380px] border-2 border-white/50 rounded-[140px] border-dashed" />
        </View>
      )}

      {/* 4. Default Camera Controls (Bottom) */}
      {!isAnalyzing && !analysisResult && (
        <View className="absolute bottom-16 w-full items-center z-10">
          <TouchableOpacity
            onPress={takePicture}
            className="w-20 h-20 bg-white rounded-full items-center justify-center border-4 border-gray-200"
          >
            <Ionicons name="search" size={32} color="black" />
          </TouchableOpacity>
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
// Detected PC IP: 192.168.45.24
const API_URL = 'http://192.168.45.24:8000';

// --- Permission Screen ---
const PermissionScreen = ({ onConfirm }: any) => {
  return (
    <View className="flex-1 bg-white px-8 justify-center items-center">
      <View className="mb-10 items-center">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="shield-checkmark" size={40} color="#00D182" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">앱 사용을 위해{'\n'}권한이 필요합니다</Text>
        <Text className="text-gray-500 text-center">더 정확한 피부 분석과 맞춤 케어를 위해{'\n'}다음 권한을 허용해주세요.</Text>
      </View>

      <View className="w-full gap-6 mb-12">
        <View className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="camera" size={24} color="#374151" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg mb-1">카메라</Text>
            <Text className="text-gray-500 text-sm leading-5">피부 촬영 및 AI 분석을 위해 필요합니다.</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
            <Ionicons name="location" size={24} color="#374151" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900 text-lg mb-1">위치</Text>
            <Text className="text-gray-500 text-sm leading-5">현재 날씨 기반 피부 조언을 위해 필요합니다.</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={onConfirm}
        className="w-full bg-clony-primary py-4 rounded-xl items-center shadow-lg shadow-green-200"
      >
        <Text className="text-white font-bold text-lg">동의하고 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
};

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

// --- Product Register Modal ---
const ProductRegisterModal = ({ visible, onClose, onSave }: any) => {
  const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // AI Processing State
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Toner'); // Default

  const reset = () => {
    setStep('SELECT');
    setImage(null);
    setIsProcessing(false);
    setBrand('');
    setName('');
    setType('Toner');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Start AI Simulation
      setStep('FORM');
      setIsProcessing(true);

      // Simulate 2.5s Processing Time
      setTimeout(() => {
        setIsProcessing(false);
        // Mock OCR Logic
        setBrand('New Brand');
        setName('Detected Product Name');
      }, 2500);
    }
  };

  const handleSave = () => {
    if (!name || !brand) return Alert.alert("입력 오류", "제품명과 브랜드를 입력해주세요.");
    onSave({ brand, name, type, image });
    handleClose();
  };

  // Pre-defined categories
  const categories = ["Cleansing", "Toner", "Serum", "Cream", "Sunscreen", "Pad", "Mask"];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white w-full rounded-t-[30px] p-8 pb-12 h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900">제품 등록하기</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {step === 'SELECT' ? (
            <View className="flex-1 justify-center gap-6">
              <TouchableOpacity onPress={handleCamera} className="bg-clony-primary/10 p-8 rounded-3xl items-center border border-clony-primary/20">
                <Ionicons name="camera" size={48} color="#00D182" />
                <Text className="text-lg font-bold text-clony-primary mt-4">카메라로 촬영하기</Text>
                <Text className="text-gray-500 mt-2 text-center">AI가 자동으로 제품을 인식하고{'\n'}스튜디오 컷으로 보정해줍니다. ✨</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('FORM')} className="bg-gray-50 p-8 rounded-3xl items-center border border-gray-100">
                <Ionicons name="create-outline" size={48} color="#4B5563" />
                <Text className="text-lg font-bold text-gray-700 mt-4">직접 입력하기</Text>
                <Text className="text-gray-400 mt-2 text-center">브랜드와 제품명을{'\n'}직접 입력하여 등록합니다.</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

              {/* Product Image Section (AI Studio Mockup) */}
              <View className="items-center mb-8">
                <View className="relative">
                  {/* Studio Frame Container */}
                  <View className="w-40 h-40 rounded-3xl overflow-hidden shadow-2xl bg-white items-center justify-center border-4 border-white">
                    {image ? (
                      isProcessing ? (
                        // Processing State
                        <View className="w-full h-full bg-gray-900 items-center justify-center">
                          <ActivityIndicator size="large" color="#00D182" />
                          <Text className="text-white text-xs font-bold mt-3 animate-pulse">AI Retouching...</Text>
                        </View>
                      ) : (
                        // Result State (Studio Effect)
                        <View className="w-full h-full relative bg-gray-50 items-center justify-center">
                          {/* Studio Background Gradient Simulation */}
                          <View className="absolute inset-0 bg-gray-200" />
                          <View className="absolute inset-0 bg-white opacity-40 ml-10 rounded-full blur-3xl transform rotate-12" />
                          <View className="absolute top-0 right-0 w-32 h-32 bg-clony-primary/20 blur-2xl rounded-full" />

                          {/* The Image (Shadow & Contain) */}
                          <View className="shadow-2xl shadow-black/50" style={{ elevation: 10 }}>
                            <Image source={{ uri: image }} className="w-32 h-32 rounded-xl" resizeMode="contain" />
                          </View>

                          {/* Studio Lighting/Overlay Effects */}
                          <View className="absolute inset-0 bg-white/5 mix-blend-overlay" pointerEvents="none" />

                          {/* AI Badge */}
                          <View className="absolute top-2 right-2 bg-clony-primary px-2.5 py-1 rounded-full shadow-lg border border-white/20">
                            <Text className="text-[10px] font-bold text-white">✨ AI Studio</Text>
                          </View>
                        </View>
                      )
                    ) : (
                      <TouchableOpacity onPress={handleCamera} className="items-center justify-center w-full h-full bg-gray-50">
                        <Ionicons name="camera" size={32} color="#9CA3AF" />
                        <Text className="text-xs text-gray-400 mt-1">사진 추가</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Floating Edit Button */}
                  {!isProcessing && image && (
                    <TouchableOpacity onPress={handleCamera} className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-gray-100">
                      <Ionicons name="refresh" size={16} color="#4B5563" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Form Fields - Start Fade In or just show */}
              <View className={`gap-6 ${isProcessing ? 'opacity-30' : 'opacity-100'}`} pointerEvents={isProcessing ? 'none' : 'auto'}>
                <View>
                  <Text className="text-sm font-bold text-gray-500 mb-2">카테고리</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setType(cat)}
                        className={`px-4 py-2 rounded-full border ${type === cat ? 'bg-clony-primary border-clony-primary' : 'bg-white border-gray-200'}`}
                      >
                        <Text className={`font-bold ${type === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-sm font-bold text-gray-500 mb-2">브랜드</Text>
                  <TextInput
                    value={brand}
                    onChangeText={setBrand}
                    className="bg-gray-50 p-4 rounded-xl text-gray-900 border border-gray-100"
                    placeholder={isProcessing ? "AI 분석 중..." : "예: 아누아"}
                    editable={!isProcessing}
                  />
                </View>

                <View>
                  <Text className="text-sm font-bold text-gray-500 mb-2">제품명</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    className="bg-gray-50 p-4 rounded-xl text-gray-900 border border-gray-100"
                    placeholder={isProcessing ? "AI 분석 중..." : "예: 어성초 77 수딩 토너"}
                    editable={!isProcessing}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isProcessing}
                  className={`bg-clony-primary py-4 rounded-xl items-center mt-4 ${isProcessing ? 'bg-gray-300' : ''}`}
                >
                  <Text className="text-white font-bold text-lg">{isProcessing ? '분석 중...' : '등록하기'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// --- Routine Screen ---
const RoutineScreen = () => {
  const [activeRoutine, setActiveRoutine] = useState<'Morning' | 'Night'>('Morning');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [shelfItems, setShelfItems] = useState([
    { id: 1, name: "어성초 77 수딩 토너", brand: "아누아", type: "Toner", image: require('./assets/product_images/toner.png') },
    { id: 2, name: "레드 블레미쉬 크림", brand: "닥터지", type: "Cream", image: require('./assets/product_images/cream.png') },
    { id: 3, name: "캐롯 카로틴 패드", brand: "스킨푸드", type: "Pad", image: require('./assets/product_images/pad.png') }
  ]);

  const handleAddProduct = (newProduct: any) => {
    const productToAdd = {
      id: Date.now(),
      name: newProduct.name,
      brand: newProduct.brand,
      type: newProduct.type,
      image: newProduct.image ? { uri: newProduct.image } : null // Use null or a default placeholder if no image
    };
    setShelfItems([...shelfItems, productToAdd]);
    // Alert logic could go here
  };

  const handleDeleteProduct = (id: number) => {
    Alert.alert(
      "제품 삭제",
      "이 제품을 화장대에서 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            setShelfItems(prev => prev.filter(item => item.id !== id));
          }
        }
      ]
    );
  };

  // Dynamic Routine Steps based on Shelf Items
  const getProductByType = (type: string) => shelfItems.find(item => item.type === type) || null;

  const routineSteps = {
    Morning: [
      { step: 1, type: "Cleansing", product: null, guide: "미온수로 가볍게 물세안 해주세요.", missing: false },
      { step: 2, type: "Toner", product: getProductByType("Toner"), guide: "화장솜에 묻혀 결을 정돈해주세요.", missing: !getProductByType("Toner") },
      { step: 3, type: "Cream", product: getProductByType("Cream"), guide: "얇게 펴 발라 수분을 충전하세요.", missing: !getProductByType("Cream") },
      { step: 4, type: "Sunscreen", product: getProductByType("Sunscreen"), guide: "외출 전 자외선 차단제는 필수! ☀️", missing: !getProductByType("Sunscreen") }
    ],
    Night: [
      { step: 1, type: "Cleansing", product: null, guide: "꼼꼼한 이중 세안이 중요해요.", missing: false },
      { step: 2, type: "Pad", product: getProductByType("Pad"), guide: "고민 부위에 5분간 올려팩 해주세요.", missing: !getProductByType("Pad") },
      { step: 3, type: "Cream", product: getProductByType("Cream"), guide: "도톰하게 올려 수면팩처럼 활용해보세요.", missing: !getProductByType("Cream") }
    ]
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="pt-16 px-6 pb-6 bg-white rounded-b-[40px] shadow-sm mb-6">
        <Text className="text-clony-primary font-bold text-xs tracking-widest mb-1">MY COSMETIC SHELF</Text>
        <View className="flex-row justify-between items-end mb-6">
          <Text className="text-2xl font-bold text-gray-900">내 화장대</Text>
          <TouchableOpacity onPress={() => setIsRegisterOpen(true)} className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
            <Ionicons name="add" size={16} color="black" />
            <Text className="text-xs font-bold ml-1">제품 등록</Text>
          </TouchableOpacity>
        </View>

        {/* Shelf Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {shelfItems.map((item) => (
            <View key={item.id} className="w-24 items-center">
              <View className="relative mb-2">
                <View className="w-20 h-20 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100 overflow-hidden">
                  {item.image ? (
                    <Image source={item.image} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center justify-center h-full w-full bg-gray-50">
                      <Text className="text-xs text-gray-300">No Image</Text>
                    </View>
                  )}
                </View>

                {/* Delete Button - Floating 'X' */}
                <TouchableOpacity
                  onPress={() => handleDeleteProduct(item.id)}
                  className="absolute -top-2 -right-2 bg-white rounded-full w-7 h-7 items-center justify-center shadow-md border border-gray-100 z-10"
                >
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>

                {/* Scan Indicator - Inside */}
                <View className="absolute bottom-1 right-1 bg-black/20 p-1 rounded-full backdrop-blur-sm">
                  <Ionicons name="scan-outline" size={8} color="white" />
                </View>
              </View>

              <Text className="text-[10px] text-gray-400 font-bold mb-0.5">{item.brand}</Text>
              <Text className="text-xs text-gray-900 text-center leading-tight" numberOfLines={2}>{item.name}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => setIsRegisterOpen(true)} className="w-20 h-20 bg-gray-50 rounded-2xl items-center justify-center border border-gray-200 border-dashed mr-4 mt-1">
            <Ionicons name="add" size={32} color="#D1D5DB" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Match Analysis */}
      <View className="px-6 mb-8">
        <View className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden">
          <View className="absolute top-0 right-0 w-32 h-32 bg-clony-primary/30 rounded-full blur-3xl" />
          <Text className="text-white/60 font-bold text-xs mb-4">MATCH ANALYSIS</Text>
          <View className="flex-row items-end gap-2 mb-2">
            <Text className="text-4xl font-bold text-white">92%</Text>
            <Text className="text-clony-primary font-bold text-lg mb-1">Excellent</Text>
          </View>
          <Text className="text-gray-300 leading-relaxed text-sm">
            지성 피부인 지민님에게 딱 맞는 제품들로 구성되어 있어요! 특히 <Text className="text-white font-bold">어성초 토너</Text>와의 궁합이 아주 좋습니다. 🌿
          </Text>
        </View>
      </View>

      {/* Daily Routine Suggestion */}
      <View className="px-6 pb-32">
        <Text className="text-xl font-bold text-gray-900 mb-4">Daily Routine</Text>

        {/* Toggle */}
        <View className="flex-row bg-gray-200 p-1 rounded-full mb-6">
          <TouchableOpacity
            onPress={() => setActiveRoutine('Morning')}
            className={`flex-1 py-2 items-center rounded-full ${activeRoutine === 'Morning' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeRoutine === 'Morning' ? 'text-clony-primary' : 'text-gray-400'}`}>☀️ Morning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveRoutine('Night')}
            className={`flex-1 py-2 items-center rounded-full ${activeRoutine === 'Night' ? 'bg-gray-800 shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeRoutine === 'Night' ? 'text-white' : 'text-gray-400'}`}>🌙 Night</Text>
          </TouchableOpacity>
        </View>

        {/* Steps */}
        <View className="gap-4">
          {routineSteps[activeRoutine].map((step, idx) => (
            <View key={idx} className="flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <View className="w-8 h-8 bg-gray-900 rounded-full items-center justify-center">
                <Text className="text-white font-bold">{step.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-clony-primary font-bold mb-0.5">{step.type}</Text>
                {step.product ? (
                  <Text className="font-bold text-gray-900">{step.product.name}</Text>
                ) : (
                  <Text className="font-bold text-gray-400">{step.missing ? '제품 추가 필요' : '기본 케어'}</Text>
                )}
                <Text className="text-xs text-gray-500 mt-1">{step.guide}</Text>
              </View>
              {step.product && (
                <Image source={step.product.image} className="w-10 h-10 rounded-lg bg-gray-50" resizeMode="contain" />
              )}
              {step.missing && (
                <TouchableOpacity className="px-3 py-1.5 bg-clony-primary/10 rounded-full">
                  <Text className="text-[10px] font-bold text-clony-primary">추천받기</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Product Register Modal */}
      <ProductRegisterModal
        visible={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSave={handleAddProduct}
      />
    </ScrollView>
  );
};


// --- My Page ---
const MyScreen = ({ userName, onLogout }: any) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="pt-16 pb-8 px-6 bg-white rounded-b-[40px] shadow-sm mb-6">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900">{userName}님</Text>
            <Text className="text-gray-500">오늘도 피부가 좋아지고 있어요!</Text>
          </View>
          <TouchableOpacity onPress={pickImage} className="relative">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center overflow-hidden border border-gray-200">
              {profileImage ? (
                <Image source={{ uri: profileImage }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-clony-primary w-6 h-6 rounded-full items-center justify-center border-2 border-white">
              <Ionicons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3">
          <View className="px-4 py-2 bg-clony-primary/10 rounded-full">
            <Text className="text-clony-primary font-bold">지성 피부</Text>
          </View>
          <View className="px-4 py-2 bg-gray-100 rounded-full">
            <Text className="text-gray-600">민감성</Text>
          </View>
        </View>
      </View>

      <View className="px-6 mb-24">
        <Text className="text-gray-900 font-bold mb-4 text-lg">설정</Text>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between py-2 border-b border-gray-100 mb-2">
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={22} color="black" />
              <Text className="text-base text-gray-800">알림 설정</Text>
            </View>
            <Switch value={true} trackColor={{ true: '#00D182' }} />
          </View>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <Ionicons name="information-circle-outline" size={22} color="black" />
              <Text className="text-base text-gray-800">버전 정보</Text>
            </View>
            <Text className="text-gray-400">v1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onLogout}
          className="bg-gray-200 py-4 rounded-xl items-center"
        >
          <Text className="text-gray-700 font-bold">로그아웃</Text>
        </TouchableOpacity>
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

  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'PERMISSION' | 'APP'>('LOGIN');
  // --- Weather Logic (MVP) ---
  const [weather, setWeather] = useState<{ temp: number, condition: string, advice: string } | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Default if permission denied
        setWeather({ temp: 22, condition: 'Sunny', advice: "자외선이 강해요! 선크림을 꼼꼼히 바르세요." });
        return;
      }

      // We get location to show we can, but use mock weather for MVP stability (no API key needed)
      await ExpoLocation.getCurrentPositionAsync({});

      // Mock Weather Data for Demo
      setWeather({
        temp: 24,
        condition: 'Sunny',
        advice: "자외선 지수 높음! ☀️ 외출 시 선크림 필수!"
      });
    })();
  }, []);

  const [activeTab, setActiveTab] = useState('Home');
  const [showCamera, setShowCamera] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userName, setUserName] = useState("지민"); // Default
  const [isLoading, setIsLoading] = useState(true); // For Auto Login Check

  // --- New Analysis State ---
  const [analysisStep, setAnalysisStep] = useState<'NONE' | 'LOADING' | 'SURVEY' | 'RESULT' | 'DAILY_SURVEY'>('NONE');
  const [skinCode, setSkinCode] = useState("OSNW");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null); // Store Gemini Result
  const [hasHistory, setHasHistory] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Check history on mount
  React.useEffect(() => {
    checkHistory();
  }, []);

  const checkHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('skin_history');
      if (history && JSON.parse(history).length > 0) {
        setHasHistory(true);
        // Optimistically load last code to keep consistency if needed
        const last = JSON.parse(history).pop();
        if (last && last.type) setSkinCode(last.type);
      }
    } catch (e) { console.log(e); }
  };

  const handleCameraComplete = (uri: string) => {
    // Camera Captured -> Start Loading Analysis
    setCapturedImage(uri);
    setShowCamera(false);
    setAnalysisStep('LOADING');

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
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      console.log("AI Analysis Complete:", data);

      // --- Feature Detection Validation ---
      if (data.glasses) {
        Alert.alert(
          "촬영 오류 (안경 감지)",
          "정확한 피부 진단을 위해 안경을 벗고 촬영해주세요.",
          [{
            text: "다시 촬영", onPress: () => {
              setAnalysisStep('NONE');
              setShowCamera(true);
            }
          }]
        );
        return; // Stop processing
      }

      if (data.bangs) {
        Alert.alert(
          "촬영 오류 (앞머리 감지)",
          "이마 피부 분석을 위해 앞머리를 넘기고 촬영해주세요.",
          [{
            text: "다시 촬영", onPress: () => {
              setAnalysisStep('NONE');
              setShowCamera(true);
            }
          }]
        );
        return; // Stop processing
      }

      setAiResult(data);
    } catch (e: any) {
      console.error("AI Analysis Failed:", e);
      Alert.alert("서버 연결 실패", "PC 서버에 연결할 수 없습니다.\n" + e.toString());
      // Fallback to mock if server fails
      setAiResult({
        oiliness: 50,
        sensitivity: 50,
        pores: 50,
        type: "복합성 (Fallback)",
        glasses: false,
        bangs: false
      });
    }
  };

  const handleAnalysisLoaded = () => {
    // Loading Done -> Start Survey
    // Ideally we wait for aiResult here, but for UX we just proceed
    // If user has history -> Daily Survey. Else -> Full Survey.
    if (hasHistory) {
      setAnalysisStep('DAILY_SURVEY');
    } else {
      setAnalysisStep('SURVEY');
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

  const handleSurveyComplete = (surveyResult: any) => {
    // Determine Mode
    const isDaily = surveyResult.mode === 'DAILY';

    // AI Score (0-100)
    const aiOil = aiResult?.oiliness || 50;
    const aiSens = aiResult?.sensitivity || 50;

    let finalOil, finalSens, finalPigment, finalWrinkle, code;
    let finalScore;

    if (isDaily) {
      // DAILY MODE: Bias towards existing SkinType but adjust "Score" heavily based on today's condition
      // Dryness (1-5): 1=Good(50), 5=Bad(0/100) -> If scale is 'Dry vs Oily'
      // If 5 (Very Dry) -> Oil Score decreases. if 1 (Moist) -> Oil Score optimal (50)

      // Simplify for Demo:
      // Daily Score = AI Score (50%) + Daily Condition (50%)
      // Daily Condition: (Dryness + Sensitivity) / 10 -> Normalized to 0-100 (inverse)
      const dailyConditionScore = 100 - ((surveyResult.dryness + surveyResult.sensitivity) / 10 * 100);

      const aiBaseScore = aiResult?.score || 70; // Mock AI base
      finalScore = Math.round((aiBaseScore * 0.4) + (dailyConditionScore * 0.6));

      // Keep existing code or minimal update (For now, keep existing code logic or use fallback)
      // We will just keep the current `skinCode` state which was loaded from history
      code = skinCode;

    } else {
      // FULL MODE (First Time)
      const surveyOil = (surveyResult.O_D + 1) * 33 + 15;
      const surveySens = (surveyResult.S_R + 1) * 33 + 15;

      finalOil = (aiOil * 0.5) + (surveyOil * 0.5);
      finalSens = (aiSens * 0.5) + (surveySens * 0.5);
      finalPigment = (surveyResult.P_N + 1) * 50;
      finalWrinkle = (surveyResult.W_T + 1) * 50;

      const O = finalOil >= 50 ? 'O' : 'D';
      const S = finalSens >= 50 ? 'S' : 'R';
      const P = finalPigment >= 50 ? 'P' : 'N';
      const W = finalWrinkle >= 50 ? 'W' : 'T';
      code = `${O}${S}${P}${W}`;

      const baseScore = aiResult?.score || (100 - (finalOil + finalSens + finalPigment + finalWrinkle) / 4);
      finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));
    }

    console.log(`Analysis Complete. Mode: ${isDaily ? 'Daily' : 'Full'}, Code: ${code}, Score: ${finalScore}`);
    setSkinCode(code);

    // Save history
    saveHistory({
      date: new Date().toISOString().split('T')[0],
      score: finalScore,
      type: code,
      isDaily: isDaily
    });

    setHasHistory(true); // Now they have history
    setAnalysisStep('RESULT');
  };

  const handleResultClose = () => {
    setAnalysisStep('NONE');
    setActiveTab('Home');
    // Save to server or local storage here
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
    setAuthMode('APP');
    setShowPermissionModal(true); // Show permission modal after login/signup
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



  // Permission Screen Logic Removed (Included in App as Modal)

  if (showCamera) return <CameraScreen onClose={() => setShowCamera(false)} onComplete={handleCameraComplete} />;

  // --- New Analysis Flow Rendering ---
  if (analysisStep === 'LOADING') return <AnalysisLoading onComplete={handleAnalysisLoaded} imageUri={capturedImage} />;

  if (analysisStep === 'RESULT') {
    // If aiResult is missing for some reason (race condition), use fallback
    const displayResult = aiResult || {
      oiliness: 50, sensitivity: 50, pores: 50, type: "분석 중...", glasses: false, bangs: false, score: 75
    };

    return (
      <AnalysisResult
        result={displayResult}
        score={displayResult.score || 85}
        skinCode={skinCode || "OSNW"}
        onClose={() => setAnalysisStep('NONE')}
        weather={weather}
      />
    );
  }


  return (
    <View className="flex-1 bg-gray-50">

      <ScientificSurvey visible={analysisStep === 'SURVEY'} onComplete={handleSurveyComplete} />
      <DailySurvey visible={analysisStep === 'DAILY_SURVEY'} onComplete={handleSurveyComplete} />

      {/* Content Area */}
      {activeTab === 'Home' && <HomeScreen onCameraOpen={() => setShowCamera(true)} score={userScore} userName={userName} onViewAll={() => setActiveTab('MagazineList')} onNavigateToReport={() => setActiveTab('Report')} />}
      {activeTab === 'Report' && <ReportScreen />}
      {activeTab === 'Routine' && <RoutineScreen />}
      {activeTab === 'Community' && <CommunityScreen />}
      {activeTab === 'MagazineList' && <MagazineListScreen onBack={() => setActiveTab('Home')} />}
      {activeTab === 'MY' && <MyScreen userName={userName} onLogout={handleLogout} />}

      {/* Placeholder Screens */}
      {(activeTab !== 'Home' && activeTab !== 'Report' && activeTab !== 'Community' && activeTab !== 'MY' && activeTab !== 'MagazineList' && activeTab !== 'Routine') && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 font-bold text-lg">{activeTab} Page</Text>
          <Text className="text-gray-300 text-sm mt-2">준비 중입니다</Text>
        </View>
      )}

      {/* FAB (Always Visible, above Tab Bar) - Hidden in Community & Magazine for Write Button */}
      {(activeTab !== 'Community' && activeTab !== 'MagazineList') && (
        <View className="absolute bottom-28 right-5 z-50">
          <TouchableOpacity
            onPress={() => setShowCamera(true)}
            className="w-16 h-16 bg-clony-primary rounded-full items-center justify-center shadow-lg border-4 border-white"
            style={{ elevation: 5 }}
          >
            <Ionicons name="camera" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex-row justify-between px-6 py-4 pb-8 rounded-t-[30px] shadow-lg">
        <TabIcon name="home" label="홈" active={activeTab === 'Home'} onPress={() => setActiveTab('Home')} />
        <TabIcon name="document-text-outline" label="리포트" active={activeTab === 'Report'} onPress={() => setActiveTab('Report')} />
        <TabIcon name="sync-outline" label="루틴" active={activeTab === 'Routine'} onPress={() => setActiveTab('Routine')} />
        <TabIcon name="chatbubbles-outline" label="커뮤니티" active={activeTab === 'Community'} onPress={() => setActiveTab('Community')} />
        <TabIcon name="person-outline" label="MY" active={activeTab === 'MY'} onPress={() => setActiveTab('MY')} />
      </View>

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
        animationType="slide"
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
    </View>
  );
}
