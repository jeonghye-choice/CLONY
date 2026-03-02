import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OpenChatManagerModalProps {
    isVisible: boolean;
    onClose: () => void;
    onJoin: (roomId: number) => void;
    onLeave: (roomId: number) => void;
    onEdit: (room: any) => void;
    onDelete: (roomId: number) => void;
    allRooms: any[];
    joinedRoomIds: number[];
}

const OpenChatManagerModal: React.FC<OpenChatManagerModalProps> = ({
    isVisible,
    onClose,
    onJoin,
    onLeave,
    onEdit,
    onDelete,
    allRooms,
    joinedRoomIds
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

    const filteredRooms = allRooms.filter(room =>
        (activeTab === 'all' || joinedRoomIds.includes(room.id)) &&
        (room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const handleAction = (room: any) => {
        if (joinedRoomIds.includes(room.id)) {
            onLeave(room.id);
        } else {
            onJoin(room.id);
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 justify-end bg-black/50">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="bg-white rounded-t-3xl h-[90%]"
                    >
                        {/* Header */}
                        <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold text-gray-900">실시간 오픈채팅</Text>
                            <View className="w-6" /> {/* Spacer */}
                        </View>

                        {/* Search Bar */}
                        <View className="px-6 py-4">
                            <View className="flex-row items-center bg-gray-100 px-4 py-2.5 rounded-xl">
                                <Ionicons name="search" size={18} color="#9CA3AF" />
                                <TextInput
                                    placeholder="관심 있는 채팅방을 검색해보세요"
                                    className="flex-1 ml-2 text-sm text-gray-900"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Tabs */}
                        <View className="flex-row px-6 border-b border-gray-100">
                            <TouchableOpacity
                                onPress={() => setActiveTab('all')}
                                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'all' ? 'border-clony-primary' : 'border-transparent'}`}
                            >
                                <Text className={`font-bold ${activeTab === 'all' ? 'text-clony-primary' : 'text-gray-400'}`}>전체 채팅방</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setActiveTab('mine')}
                                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'mine' ? 'border-clony-primary' : 'border-transparent'}`}
                            >
                                <Text className={`font-bold ${activeTab === 'mine' ? 'text-clony-primary' : 'text-gray-400'}`}>참여 중</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Room List */}
                        <ScrollView className="flex-1 px-6 pt-4">
                            {filteredRooms.length > 0 ? (
                                filteredRooms.map((room) => (
                                    <View key={room.id} className="bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm">
                                        <View className="flex-row items-center">
                                            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${room.color.replace('bg-', 'bg-opacity-50 bg-')}`}>
                                                <Text className="text-2xl">{room.icon}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-bold text-gray-900 text-base mb-1">{room.title}</Text>
                                                <View className="flex-row items-center gap-2">
                                                    <View className="flex-row items-center mr-2">
                                                        <Ionicons name="person" size={12} color="#9CA3AF" />
                                                        <Text className="text-xs text-gray-400 ml-1">{room.users}명</Text>
                                                    </View>
                                                    <Text className="text-xs text-gray-400" numberOfLines={1}>{room.tags.join(' ')}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => handleAction(room)}
                                                className={`px-4 py-2 rounded-full ${joinedRoomIds.includes(room.id) ? 'bg-gray-100' : 'bg-clony-primary'}`}
                                            >
                                                <Text className={`text-xs font-bold ${joinedRoomIds.includes(room.id) ? 'text-gray-400' : 'text-white'}`}>
                                                    {joinedRoomIds.includes(room.id) ? '참여중' : '입장'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Edit/Delete for self-created rooms or just for demo */}
                                        <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-50 gap-4">
                                            <TouchableOpacity onPress={() => onEdit(room)} className="flex-row items-center">
                                                <Ionicons name="pencil-outline" size={14} color="#3B82F6" />
                                                <Text className="text-[10px] text-blue-500 ml-1 font-bold">수정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => onDelete(room.id)} className="flex-row items-center">
                                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                                <Text className="text-[10px] text-red-500 ml-1 font-bold">삭제</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="items-center justify-center py-20">
                                    <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
                                    <Text className="text-gray-400 mt-4">검색 결과가 없습니다.</Text>
                                </View>
                            )}
                            <View className="h-20" />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default OpenChatManagerModal;
