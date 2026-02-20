import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CheckoutAddressScreenProps {
    cartItems: any[];
    totalAmount: number;
    onBack: () => void;
    onNext: (deliveryInfo: DeliveryInfo) => void;
}

export interface DeliveryInfo {
    recipientName: string;
    phone: string;
    postalCode: string;
    address: string;
    detailAddress: string;
    deliveryMemo?: string;
}

const MOCK_ADDRESSES = [
    '서울특별시 중구 명동 1가',
    '서울특별시 중구 명동 2가',
    '서울특별시 중구 남산동 1가',
    '서울특별시 중구 충무로 1가',
    '서울특별시 중구 퇴계로 100',
    '서울특별시 종로구 세종대로 209',
    '서울특별시 강남구 테헤란로 123',
    '서울특별시 강남구 역삼동 789',
    '서울특별시 서초구 서초대로 456',
    '서울특별시 송파구 올림픽로 300',
    '경기도 성남시 분당구 판교역로 166',
    '경기도 수원시 영통구 삼성로 129',
    '인천광역시 연수구 송도미래로 30',
    '부산광역시 해운대구 달맞이길 62',
    '제주특별자치도 제주시 첨단로 242',
];

const CheckoutAddressScreen: React.FC<CheckoutAddressScreenProps> = ({
    cartItems,
    totalAmount,
    onBack,
    onNext
}) => {
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [deliveryMemo, setDeliveryMemo] = useState('');
    const [saveAddress, setSaveAddress] = useState(true);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Search related states
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

    // Load default address from AsyncStorage
    useEffect(() => {
        const loadDefaultAddress = async () => {
            try {
                const saved = await AsyncStorage.getItem('CLONY_ADDRESSES');
                if (saved) {
                    const addresses = JSON.parse(saved);
                    const defaultAddr = addresses.find((a: any) => a.isDefault);
                    if (defaultAddr) {
                        setRecipientName(defaultAddr.recipient || defaultAddr.recipientName || '');
                        setPhone(defaultAddr.phone || '');
                        setAddress(defaultAddr.address || '');
                        setDetailAddress(defaultAddr.detail || defaultAddr.detailAddress || '');
                        // If there's a postal code in the record, use it
                        if (defaultAddr.postalCode) setPostalCode(defaultAddr.postalCode);
                    }
                }
            } catch (e) {
                console.error('Failed to load default address', e);
            }
        };
        loadDefaultAddress();
    }, []);

    useEffect(() => {
        const keyboardShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardHideListener.remove();
            keyboardShowListener.remove();
        };
    }, []);

    const handleNext = async () => {
        // Validation
        if (!recipientName.trim()) {
            Alert.alert('입력 오류', '받는 사람 이름을 입력해주세요.');
            return;
        }
        if (!phone.trim()) {
            Alert.alert('입력 오류', '전화번호를 입력해주세요.');
            return;
        }
        if (!postalCode.trim() || !address.trim()) {
            Alert.alert('입력 오류', '주소를 입력해주세요.');
            return;
        }
        if (!detailAddress.trim()) {
            Alert.alert('입력 오류', '상세 주소를 입력해주세요.');
            return;
        }

        // Save address if requested
        if (saveAddress) {
            try {
                const saved = await AsyncStorage.getItem('CLONY_ADDRESSES');
                let addresses = saved ? JSON.parse(saved) : [];

                const newAddr = {
                    id: Date.now().toString(),
                    name: '최근 배송지',
                    recipient: recipientName,
                    phone: phone,
                    postalCode: postalCode,
                    address: address,
                    detail: detailAddress,
                    isDefault: true // Set as default if user checks "save"
                };

                // Clear previous defaults
                addresses = addresses.map((a: any) => ({ ...a, isDefault: false }));
                addresses.unshift(newAddr); // Add to top

                // Keep only last 10
                await AsyncStorage.setItem('CLONY_ADDRESSES', JSON.stringify(addresses.slice(0, 10)));
            } catch (e) {
                console.error('Failed to save address from checkout', e);
            }
        }

        onNext({
            recipientName,
            phone,
            postalCode,
            address,
            detailAddress,
            deliveryMemo
        });
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (text.trim().length > 0) {
            const filtered = MOCK_ADDRESSES.filter(addr =>
                addr.includes(text) || addr.replace(/ /g, '').includes(text.replace(/ /g, ''))
            );
            const suggestions = [text.trim(), ...filtered.filter(f => f !== text.trim())];
            setFilteredSuggestions(suggestions);
        } else {
            setFilteredSuggestions([]);
        }
    };

    const handleSelectAddress = (addr: string) => {
        setAddress(addr);
        setPostalCode(addr.includes('명동') ? '04536' : '06234'); // Simple mock postal code logic
        setIsSearchOpen(false);
        setSearchQuery('');
        setFilteredSuggestions([]);
    };

    const handleSearchPostalCode = () => {
        setIsSearchOpen(true);
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900">배송지 입력</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 받는 사람 */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">받는 사람 *</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder="이름을 입력하세요"
                            placeholderTextColor="#9CA3AF"
                            value={recipientName}
                            onChangeText={setRecipientName}
                        />
                    </View>

                    {/* 전화번호 */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">전화번호 *</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder="010-1234-5678"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* 우편번호 */}
                    <View className="mb-2">
                        <Text className="text-sm font-bold text-gray-700 mb-2">주소 *</Text>
                        <View className="flex-row gap-2">
                            <TextInput
                                className="flex-1 bg-white rounded-xl p-4 text-base border border-gray-200"
                                placeholder="우편번호"
                                placeholderTextColor="#9CA3AF"
                                value={postalCode}
                                editable={false}
                            />
                            <TouchableOpacity
                                onPress={handleSearchPostalCode}
                                className="bg-clony-primary px-5 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-bold">검색</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 주소 */}
                    <View className="mb-2">
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder="주소"
                            placeholderTextColor="#9CA3AF"
                            value={address}
                            editable={false}
                        />
                    </View>

                    {/* 상세 주소 */}
                    <View className="mb-5">
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder="상세 주소를 입력하세요"
                            placeholderTextColor="#9CA3AF"
                            value={detailAddress}
                            onChangeText={setDetailAddress}
                        />
                    </View>

                    {/* 배송 메모 */}
                    <View className="mb-8">
                        <Text className="text-sm font-bold text-gray-700 mb-2">배송 메모 (선택)</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder="예: 문 앞에 놓아주세요"
                            placeholderTextColor="#9CA3AF"
                            value={deliveryMemo}
                            onChangeText={setDeliveryMemo}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* 배송지 저장 토글 */}
                    <View className="bg-white rounded-2xl p-5 border border-clony-primary/10 mb-8 flex-row items-center justify-between shadow-sm">
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-bold text-gray-900 mb-1">배송지 정보 저장</Text>
                            <Text className="text-xs text-gray-400">이 주소를 기본 배송지로 기억할까요?</Text>
                        </View>
                        <Switch
                            value={saveAddress}
                            onValueChange={setSaveAddress}
                            trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                            thumbColor={Platform.OS === 'android' ? (saveAddress ? '#FFFFFF' : '#F4F3F4') : ''}
                        />
                    </View>

                    {/* 주문 상품 요약 */}
                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-10">
                        <Text className="text-base font-bold text-gray-900 mb-3">주문 상품 {cartItems.length}개</Text>
                        {cartItems.slice(0, 2).map((item, idx) => (
                            <Text key={idx} className="text-sm text-gray-600 mb-1">
                                · {item.name}
                            </Text>
                        ))}
                        {cartItems.length > 2 && (
                            <Text className="text-sm text-gray-400">외 {cartItems.length - 2}개</Text>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Bar attached to KeyboardAvoidingView - Hidden when keyboard visible */}
                {!isKeyboardVisible && (
                    <View className="bg-white border-t border-gray-100 px-6 py-4 pb-8 rounded-t-[24px] shadow-lg">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-base text-gray-600">총 결제금액</Text>
                            <Text className="text-2xl font-bold text-clony-primary">
                                {totalAmount.toLocaleString()}원
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleNext}
                            className="bg-clony-primary py-4 rounded-xl items-center shadow-lg shadow-green-200"
                        >
                            <Text className="text-white font-bold text-lg">결제하기</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Address Search Modal - Consistent with DeliveryTrackingScreen */}
            <Modal
                visible={isSearchOpen}
                animationType="fade"
                transparent={false}
                onRequestClose={() => setIsSearchOpen(false)}
            >
                <View className="flex-1 bg-white">
                    {/* Search Header */}
                    <View className="px-6 pt-14 pb-4 border-b border-gray-100">
                        <View className="flex-row items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                            <TouchableOpacity onPress={() => setIsSearchOpen(false)}>
                                <Ionicons name="arrow-back" size={24} color="#4B5563" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 text-base font-bold text-gray-900"
                                placeholder="지번, 도로명 주소를 입력해주세요"
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Suggestions List */}
                    <ScrollView className="flex-1">
                        {filteredSuggestions.length > 0 ? (
                            filteredSuggestions.map((addr, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleSelectAddress(addr)}
                                    className="px-6 py-4 border-b border-gray-50 flex-row items-center gap-3"
                                >
                                    <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                                    <View className="flex-1">
                                        <Text className="text-sm text-gray-900 font-medium">{addr}</Text>
                                        <Text className="text-xs text-gray-400 mt-0.5">도로명 주소</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
                                </TouchableOpacity>
                            ))
                        ) : searchQuery.length > 0 ? (
                            <View className="p-10 items-center">
                                <Text className="text-gray-400 text-sm">검색 결과가 없습니다.</Text>
                                <TouchableOpacity
                                    onPress={() => handleSelectAddress(searchQuery)}
                                    className="mt-4 bg-gray-100 px-4 py-2 rounded-full"
                                >
                                    <Text className="text-gray-600 text-xs text-center">"{searchQuery}"를 그대로 입력하기</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="p-10 items-center">
                                <Ionicons name="search-outline" size={48} color="#F3F4F6" />
                                <Text className="text-gray-300 text-sm mt-4 text-center leading-5">
                                    동, 도로명, 건물명 등으로{'\n'}검색해보세요
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

export default CheckoutAddressScreen;
