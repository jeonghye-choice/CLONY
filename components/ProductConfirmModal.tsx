import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ProductConfirmModalProps {
    visible: boolean;
    productName: string;
    brandName: string;
    productImage: string;
    onConfirm: () => void;
    onEdit_Search: (query: string) => void;
    onClose: () => void;
    loading?: boolean;
    price?: number;
    originalPrice?: number;
}

export const ProductConfirmModal: React.FC<ProductConfirmModalProps> = ({
    visible,
    productName,
    brandName,
    productImage,
    onConfirm,
    onEdit_Search,
    onClose,
    loading = false,
    price = 0,
    originalPrice = 0
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState(productName);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            Alert.alert("알림", "제품명을 입력해주세요.");
            return;
        }
        onEdit_Search(searchQuery);
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <BlurView intensity={20} className="flex-1 justify-center items-center px-6">
                <View className="bg-white w-full rounded-3xl p-6 shadow-2xl items-center">

                    {/* Header */}
                    <Text className="text-xl font-bold text-gray-900 mb-2">
                        {isEditing ? "제품명 직접 검색" : "이 제품이 맞나요?"}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-6 text-center">
                        {isEditing
                            ? "정확한 성분 분석을 위해\n제품명을 입력해주세요."
                            : "AI가 분석한 제품명입니다.\n정보가 정확한지 확인해주세요."}
                    </Text>

                    {/* Image (Only in Confirm Mode) */}
                    {!isEditing && (
                        <Image
                            source={{ uri: productImage }}
                            className="w-32 h-32 rounded-xl mb-4 bg-gray-100"
                            resizeMode="contain"
                        />
                    )}

                    {/* Content */}
                    {isEditing ? (
                        <View className="w-full mb-6">
                            <TextInput
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 mb-2"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="예: 라운드랩 독도 토너"
                                autoFocus
                            />
                        </View>
                    ) : (
                        <View className="bg-gray-50 w-full rounded-xl p-4 mb-6 items-center">
                            <Text className="text-xs text-gray-500 mb-1">{brandName || "브랜드 정보 없음"}</Text>
                            <Text className="text-lg font-bold text-gray-900 text-center mb-1">{productName || "제품명 인식 실패"}</Text>
                            {/* Price Display */}
                            <View className="items-center mt-2">
                                {originalPrice > price && price > 0 ? (
                                    <View className="flex-row items-center">
                                        <Text className="text-gray-400 line-through text-xs mr-2">
                                            {originalPrice.toLocaleString()}원
                                        </Text>
                                        <View className="bg-red-50 px-1.5 py-0.5 rounded mr-2">
                                            <Text className="text-red-500 text-[10px] font-bold">
                                                {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                                            </Text>
                                        </View>
                                        <Text className="text-teal-600 font-bold text-lg">
                                            {price.toLocaleString()}원
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name="pricetag-outline" size={14} color="#0D9488" />
                                        <Text className="ml-1 text-teal-600 font-bold text-lg">
                                            {loading ? "..." : (price > 0 ? `${price.toLocaleString()}원` : "가격 정보 없음")}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Buttons */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#0D9488" />
                    ) : (
                        <View className="w-full gap-3">
                            {isEditing ? (
                                <>
                                    <TouchableOpacity
                                        onPress={handleSearch}
                                        className="w-full bg-teal-600 py-4 rounded-xl items-center shadow-sm"
                                    >
                                        <Text className="text-white font-bold text-lg">이 이름으로 분석하기</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setIsEditing(false)}
                                        className="w-full py-3 items-center"
                                    >
                                        <Text className="text-gray-400">취소</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={onConfirm}
                                        className="w-full bg-teal-600 py-4 rounded-xl items-center shadow-lg shadow-teal-200"
                                    >
                                        <Text className="text-white font-bold text-lg">네, 맞아요!</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchQuery(productName);
                                            setIsEditing(true);
                                        }}
                                        className="w-full bg-white border border-gray-200 py-4 rounded-xl items-center"
                                    >
                                        <Text className="text-gray-600 font-semibold">아니요 (직접 검색)</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </BlurView>
        </Modal>
    );
};
