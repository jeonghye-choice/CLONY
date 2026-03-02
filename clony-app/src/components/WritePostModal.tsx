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

interface WritePostModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (post: { title: string; content: string; category: string; id?: number }) => void;
    editingPost?: any;
}

const CATEGORIES = ['제품후기', '루틴공유', '질문', '자유게시판'];

const WritePostModal: React.FC<WritePostModalProps> = ({ isVisible, onClose, onSubmit, editingPost }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('제품후기');

    // Initialize when editingPost changes
    React.useEffect(() => {
        if (editingPost) {
            // Post content in CommunityScreen is formatted as "Title\n\nContent"
            const parts = editingPost.content.split('\n\n');
            setTitle(parts[0] || '');
            setContent(parts.slice(1).join('\n\n') || '');
            setSelectedCategory(editingPost.category);
        } else {
            setTitle('');
            setContent('');
            setSelectedCategory('제품후기');
        }
    }, [editingPost, isVisible]);

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
            return;
        }

        onSubmit({
            id: editingPost?.id,
            title,
            content,
            category: selectedCategory,
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
                            <Text className="text-lg font-bold text-gray-900">글쓰기</Text>
                            <TouchableOpacity onPress={handleSubmit}>
                                <Text className="text-clony-primary font-bold text-base">등록</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-6 py-4">
                            {/* Category Selection */}
                            <Text className="text-sm font-bold text-gray-500 mb-2">카테고리</Text>
                            <View className="flex-row flex-wrap mb-6">
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full mr-2 mb-2 ${selectedCategory === cat
                                            ? 'bg-clony-primary'
                                            : 'bg-gray-100'
                                            }`}
                                    >
                                        <Text
                                            className={`text-sm ${selectedCategory === cat
                                                ? 'text-white font-bold'
                                                : 'text-gray-500'
                                                }`}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Title Input */}
                            <TextInput
                                placeholder="제목을 입력하세요"
                                className="text-xl font-bold text-gray-900 mb-4 py-2 border-b border-gray-100"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Content Input */}
                            <TextInput
                                placeholder="피부 고민이나 루틴 정보를 공유해보세요!"
                                className="text-base text-gray-800 h-64 textAlignVertical-top"
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                                placeholderTextColor="#9CA3AF"
                            />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default WritePostModal;
