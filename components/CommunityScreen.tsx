import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WritePostModal from './WritePostModal';
import OpenChatManagerModal from './OpenChatManagerModal';
import CreateChatroomModal from './CreateChatroomModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CommunityScreen: React.FC = () => {
    // Pulse Animation for LIVE badge
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
    const [isFabExpanded, setIsFabExpanded] = useState(false);
    const [isOpenChatModalVisible, setIsOpenChatModalVisible] = useState(false);
    const [isCreateChatModalVisible, setIsCreateChatModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);
    const [editingRoom, setEditingRoom] = useState<any>(null);

    const STORAGE_KEYS = {
        POSTS: 'CLONY_COMMUNITY_POSTS',
        CHATROOMS: 'CLONY_COMMUNITY_CHATROOMS',
        JOINED_ROOMS: 'CLONY_JOINED_ROOM_IDS'
    };

    const [posts, setPosts] = useState<any[]>([]);
    const [chatRooms, setChatRooms] = useState<any[]>([]);
    const [joinedRoomIds, setJoinedRoomIds] = useState<number[]>([]);

    // Persistence: Load on mount
    useEffect(() => {
        const loadCommunityData = async () => {
            try {
                const [savedPosts, savedRooms, savedJoined] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.POSTS),
                    AsyncStorage.getItem(STORAGE_KEYS.CHATROOMS),
                    AsyncStorage.getItem(STORAGE_KEYS.JOINED_ROOMS)
                ]);

                if (savedPosts) {
                    setPosts(JSON.parse(savedPosts));
                } else {
                    // Initial mock posts
                    const initialPosts = [
                        { id: 1, author: '피부고민러', role: 'User', time: '2시간 전', category: '제품후기', content: '독도 토너 사용 후기\n\n민감성 피부인데 자극 없이 너무 좋아요! 수분감도 오래가고...', likes: 24, comments: 8, image: null },
                        { id: 2, author: '피부관리사', role: 'Expert', time: '5시간 전', category: '팁/노하우', content: '건성 피부 루틴 추천\n\n요즘 피부가 너무 건조해서 고민이신 분들을 위해 팁을 공유합니다.', likes: 15, comments: 12, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
                    ];
                    setPosts(initialPosts);
                }

                if (savedRooms) {
                    setChatRooms(JSON.parse(savedRooms));
                } else {
                    // Initial mock rooms
                    const initialRooms = [
                        { id: 1, title: "건성 김미연 모여라", users: 128, tags: ["#건성", "#수분"], icon: "💧", color: "bg-blue-50" },
                        { id: 2, title: "지성인들의 모임", users: 342, tags: ["#지성", "#피지"], icon: "🛢️", color: "bg-yellow-50" },
                        { id: 3, title: "민감성 구원방", users: 89, tags: ["#민감", "#진정"], icon: "🌿", color: "bg-green-50" },
                        { id: 4, title: "여드름 박멸 연구소", users: 215, tags: ["#트러블", "#케어"], icon: "💊", color: "bg-red-50" },
                    ];
                    setChatRooms(initialRooms);
                }

                if (savedJoined) setJoinedRoomIds(JSON.parse(savedJoined));
                else setJoinedRoomIds([1, 3]);

            } catch (e) {
                console.error('Failed to load community data', e);
            }
        };
        loadCommunityData();
    }, []);

    // Persistence: Save on changes
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)); }, [posts]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.CHATROOMS, JSON.stringify(chatRooms)); }, [chatRooms]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.JOINED_ROOMS, JSON.stringify(joinedRoomIds)); }, [joinedRoomIds]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleCreatePost = (newPostData: { title: string; content: string; category: string; id?: number }) => {
        if (newPostData.id) {
            // Update
            setPosts(prev => prev.map(p => p.id === newPostData.id ? {
                ...p,
                category: newPostData.category,
                content: `${newPostData.title}\n\n${newPostData.content}`,
            } : p));
            Alert.alert("알림", "게시글이 수정되었습니다.");
        } else {
            // Create
            const newPost = {
                id: Date.now(),
                author: '나 (Clony User)',
                role: 'User',
                time: '방금 전',
                category: newPostData.category,
                content: `${newPostData.title}\n\n${newPostData.content}`,
                likes: 0,
                comments: 0,
                image: null
            };
            setPosts([newPost, ...posts]);
            Alert.alert("알림", "게시글이 등록되었습니다.");
        }
        setEditingPost(null);
    };

    const handleDeletePost = (postId: number) => {
        Alert.alert("게시글 삭제", "정말로 이 게시글을 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: () => {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                }
            }
        ]);
    };

    const handleCreateChatroom = (roomData: any) => {
        const isEditing = chatRooms.some(r => r.id === roomData.id);
        if (isEditing) {
            setChatRooms(prev => prev.map(r => r.id === roomData.id ? roomData : r));
            Alert.alert("알림", "채팅방 정보가 수정되었습니다.");
        } else {
            setChatRooms([roomData, ...chatRooms]);
            Alert.alert("알림", "새로운 오픈채팅방이 생성되었습니다.");
        }
        setEditingRoom(null);
    };

    const handleDeleteChatroom = (roomId: number) => {
        Alert.alert("채팅방 삭제", "이 채팅방을 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: () => {
                    setChatRooms(prev => prev.filter(r => r.id !== roomId));
                    setJoinedRoomIds(prev => prev.filter(id => id !== roomId));
                }
            }
        ]);
    };

    const handleJoinChatroom = (roomId: number) => {
        if (!joinedRoomIds.includes(roomId)) {
            setJoinedRoomIds([...joinedRoomIds, roomId]);
            Alert.alert("알림", "채팅방에 참여했습니다.");
        }
    };

    const handleLeaveChatroom = (roomId: number) => {
        setJoinedRoomIds(prev => prev.filter(id => id !== roomId));
        Alert.alert("알림", "채팅방에서 나갔습니다.");
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                {/* 1. Real-time Open Chat */}
                <View className="bg-white pb-6 px-6 pt-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xl font-bold text-gray-900">⚡ 실시간 오픈채팅</Text>
                            <Animated.View style={{ opacity: pulseAnim }} className="bg-red-500 px-1.5 py-0.5 rounded-md">
                                <Text className="text-white text-[10px] font-bold">LIVE</Text>
                            </Animated.View>
                        </View>
                        <TouchableOpacity onPress={() => setIsOpenChatModalVisible(true)}>
                            <Text className="text-gray-400 text-xs">더보기</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {chatRooms.map((room) => (
                            <TouchableOpacity
                                key={room.id}
                                className={`w-40 p-4 rounded-2xl border border-gray-100 ${room.color}`}
                            >
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center mb-3 shadow-sm">
                                    <Text className="text-lg">{room.icon}</Text>
                                </View>
                                <Text className="font-bold text-gray-900 mb-1 leading-tight" numberOfLines={2}>{room.title}</Text>
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="person" size={10} color="gray" />
                                    <Text className="text-xs text-gray-500">{room.users}명</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Divider */}
                <View className="h-2 bg-gray-100" />

                {/* Header Section */}
                <View className="px-6 pt-12 pb-6">
                    <Text className="text-2xl font-bold text-gray-900">커뮤니티 게시판</Text>
                    <Text className="text-sm text-gray-500 mt-1">클로니 유저들과 피부 고민을 나눠보세요</Text>
                </View>

                {/* Posts List */}
                {posts.map((post) => (
                    <View key={post.id} className="bg-white px-6 py-5 mb-4 border-y border-gray-100">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                                    <Ionicons name="person" size={20} color="#9CA3AF" />
                                </View>
                                <View className="ml-3">
                                    <View className="flex-row items-center">
                                        <Text className="font-bold text-gray-900">{post.author}</Text>
                                        {post.role === 'Expert' && (
                                            <View className="bg-clony-primary/10 px-1.5 py-0.5 rounded ml-1.5">
                                                <Text className="text-[10px] text-clony-primary font-bold">Expert</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-xs text-gray-400">{post.time} · {post.category}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => {
                                Alert.alert("더보기", "게시글 관리", [
                                    { text: "수정", onPress: () => { setEditingPost(post); setIsWriteModalVisible(true); } },
                                    { text: "삭제", style: "destructive", onPress: () => handleDeletePost(post.id) },
                                    { text: "취소", style: "cancel" }
                                ]);
                            }}>
                                <Ionicons name="ellipsis-horizontal" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-800 leading-6 mb-3">
                            {post.content}
                        </Text>

                        {post.image && (
                            <Image
                                source={{ uri: post.image }}
                                className="w-full h-48 rounded-2xl mb-3"
                                resizeMode="cover"
                            />
                        )}

                        <View className="flex-row items-center">
                            <TouchableOpacity className="flex-row items-center mr-4">
                                <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                                <Text className="text-xs text-gray-500 ml-1">{post.likes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-row items-center">
                                <Ionicons name="chatbubble-outline" size={20} color="#9CA3AF" />
                                <Text className="text-xs text-gray-500 ml-1">{post.comments}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Floating FAB System */}
            <View className="absolute bottom-32 right-6 items-end" style={{ pointerEvents: 'box-none' }}>
                {/* Expandable Buttons */}
                {isFabExpanded && (
                    <View className="items-end mb-4 gap-4">
                        {/* 1. Create Post Button */}
                        <View className="flex-row items-center">
                            <View className="bg-white px-3 py-1.5 rounded-lg mr-3 shadow-sm border border-gray-100">
                                <Text className="text-gray-900 font-bold text-sm">글쓰기</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsWriteModalVisible(true);
                                    setIsFabExpanded(false);
                                }}
                                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-gray-100"
                            >
                                <Ionicons name="create" size={24} color="#5C6BC0" />
                            </TouchableOpacity>
                        </View>

                        {/* 2. Create Chatroom Button */}
                        <View className="flex-row items-center">
                            <View className="bg-white px-3 py-1.5 rounded-lg mr-3 shadow-sm border border-gray-100">
                                <Text className="text-gray-900 font-bold text-sm">채팅방 생성</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingRoom(null);
                                    setIsCreateChatModalVisible(true);
                                    setIsFabExpanded(false);
                                }}
                                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-gray-100"
                            >
                                <Ionicons name="chatbubbles" size={24} color="#5C6BC0" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Main Magic Button */}
                <TouchableOpacity
                    onPress={() => setIsFabExpanded(!isFabExpanded)}
                    className={`w-14 h-14 rounded-full items-center justify-center shadow-lg transform transition-transform ${isFabExpanded ? 'bg-gray-800 rotate-45' : 'bg-clony-primary'}`}
                    style={{ elevation: 5 }}
                >
                    <Ionicons name={isFabExpanded ? "add" : "create"} size={28} color="white" />
                </TouchableOpacity>
            </View>

            {/* Write Modal */}
            <WritePostModal
                isVisible={isWriteModalVisible}
                onClose={() => { setIsWriteModalVisible(false); setEditingPost(null); }}
                onSubmit={handleCreatePost}
                editingPost={editingPost}
            />

            {/* Create/Edit Chatroom Modal */}
            <CreateChatroomModal
                isVisible={isCreateChatModalVisible}
                onClose={() => { setIsCreateChatModalVisible(false); setEditingRoom(null); }}
                onSubmit={handleCreateChatroom}
                editingRoom={editingRoom}
            />

            {/* Open Chat Manager Modal */}
            <OpenChatManagerModal
                isVisible={isOpenChatModalVisible}
                onClose={() => setIsOpenChatModalVisible(false)}
                allRooms={chatRooms}
                joinedRoomIds={joinedRoomIds}
                onJoin={handleJoinChatroom}
                onLeave={handleLeaveChatroom}
                onEdit={(room) => {
                    setEditingRoom(room);
                    setIsCreateChatModalVisible(true);
                }}
                onDelete={handleDeleteChatroom}
            />
        </View>
    );
};

export default CommunityScreen;
