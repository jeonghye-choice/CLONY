import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateChatroomModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (room: any) => void;
    editingRoom?: any;
}

const ICONS = ['💧', '🛢️', '🌿', '💊', '💦', '✨', '👔', '🥑', '🧴', '🌞'];
const COLORS = [
    { name: 'Blue', class: 'bg-blue-50' },
    { name: 'Yellow', class: 'bg-yellow-50' },
    { name: 'Green', class: 'bg-green-50' },
    { name: 'Red', class: 'bg-red-50' },
    { name: 'Purple', class: 'bg-purple-50' },
    { name: 'Gray', class: 'bg-gray-100' },
];

const CreateChatroomModal: React.FC<CreateChatroomModalProps> = ({ isVisible, onClose, onSubmit, editingRoom }) => {
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('💬');
    const [selectedColor, setSelectedColor] = useState('bg-blue-50');

    useEffect(() => {
        if (editingRoom) {
            setTitle(editingRoom.title);
            setTags(editingRoom.tags.join(' '));
            setSelectedIcon(editingRoom.icon);
            setSelectedColor(editingRoom.color);
        } else {
            setTitle('');
            setTags('');
            setSelectedIcon('💧');
            setSelectedColor('bg-blue-50');
        }
    }, [editingRoom, isVisible]);

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('채팅방 이름을 입력해주세요.');
            return;
        }

        const tagList = tags.split(' ').filter(t => t.startsWith('#')).length > 0
            ? tags.split(' ').filter(t => t.trim() !== '')
            : tags.split(' ').filter(t => t.trim() !== '').map(t => `#${t}`);

        onSubmit({
            id: editingRoom?.id || Date.now(),
            title,
            users: editingRoom?.users || 1,
            tags: tagList,
            icon: selectedIcon,
            color: selectedColor,
        });

        onClose();
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
                        className="bg-white rounded-t-3xl h-[85%]"
                    >
                        <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text className="text-lg font-bold text-gray-900">{editingRoom ? '채팅방 수정' : '채팅방 생성'}</Text>
                            <TouchableOpacity onPress={handleSubmit}>
                                <Text className="text-clony-primary font-bold text-base">{editingRoom ? '수정' : '생성'}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-6 py-6">
                            {/* Title Input */}
                            <Text className="text-sm font-bold text-gray-500 mb-2">채팅방 이름</Text>
                            <TextInput
                                placeholder="예: 건성 김미연 모여라"
                                className="text-lg font-bold text-gray-900 mb-6 py-2 border-b border-gray-100"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Tags Input */}
                            <Text className="text-sm font-bold text-gray-500 mb-2">태그 (공백으로 구분)</Text>
                            <TextInput
                                placeholder="예: #건성 #수분팁"
                                className="text-sm text-gray-700 mb-6 py-2 border-b border-gray-100"
                                value={tags}
                                onChangeText={setTags}
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Icon Selection */}
                            <Text className="text-sm font-bold text-gray-500 mb-3">대표 아이콘</Text>
                            <View className="flex-row flex-wrap gap-3 mb-6">
                                {ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        className={`w-12 h-12 rounded-full items-center justify-center border-2 ${selectedIcon === icon ? 'border-clony-primary bg-clony-primary/5' : 'border-gray-100 bg-gray-50'}`}
                                    >
                                        <Text className="text-xl">{icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Color Selection */}
                            <Text className="text-sm font-bold text-gray-500 mb-3">배경 테마</Text>
                            <View className="flex-row gap-3 mb-10">
                                {COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color.class}
                                        onPress={() => setSelectedColor(color.class)}
                                        className={`w-10 h-10 rounded-xl border-2 ${selectedColor === color.class ? 'border-clony-primary' : 'border-transparent'} ${color.class}`}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default CreateChatroomModal;
