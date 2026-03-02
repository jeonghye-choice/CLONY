import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
            () => setKeyboardVisible(true)
        );
        const keyboardHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );
        return () => {
            keyboardHideListener.remove();
            keyboardShowListener.remove();
        };
    }, []);

    const showAlert = (msg: string) => {
        if (Platform.OS === 'web') {
            window.alert(msg);
        } else {
            Alert.alert(t('common.error', 'Error'), msg);
        }
    };

    const handleNext = async () => {
        if (!recipientName.trim()) {
            showAlert(t('checkout_address.validation.name_required'));
            return;
        }
        if (!phone.trim()) {
            showAlert(t('checkout_address.validation.phone_required'));
            return;
        }
        if (!address.trim()) {
            showAlert(t('checkout_address.validation.address_required'));
            return;
        }

        if (saveAddress) {
            try {
                const saved = await AsyncStorage.getItem('CLONY_ADDRESSES');
                let addresses = saved ? JSON.parse(saved) : [];
                const newAddr = {
                    id: Date.now().toString(),
                    name: t('checkout_address.save_address'),
                    recipient: recipientName,
                    phone: phone,
                    postalCode: postalCode,
                    address: address,
                    detail: detailAddress,
                    isDefault: true
                };
                addresses = addresses.map((a: any) => ({ ...a, isDefault: false }));
                addresses.unshift(newAddr);
                await AsyncStorage.setItem('CLONY_ADDRESSES', JSON.stringify(addresses.slice(0, 10)));
            } catch (e) {
                console.error('Failed to save address from checkout', e);
            }
        }

        onNext({ recipientName, phone, postalCode, address, detailAddress, deliveryMemo });
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
        setPostalCode(addr.includes('명동') ? '04536' : '06234');
        setIsSearchOpen(false);
        setSearchQuery('');
        setFilteredSuggestions([]);
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900">{t('checkout_address.title')}</Text>
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
                    {/* Recipient Name */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">{t('checkout_address.recipient')}</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder={t('checkout_address.recipient_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={recipientName}
                            onChangeText={setRecipientName}
                        />
                    </View>

                    {/* Phone Number */}
                    <View className="mb-5">
                        <Text className="text-sm font-bold text-gray-700 mb-2">{t('checkout_address.phone')}</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder={t('checkout_address.phone_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <Text className="text-xs text-gray-400 mt-1.5 ml-1">
                            📞 {t('checkout_address.phone_hint')}
                        </Text>
                    </View>

                    {/* Address */}
                    <View className="mb-2">
                        <Text className="text-sm font-bold text-gray-700 mb-2">{t('checkout_address.address_section')}</Text>
                        <View className="flex-row gap-2">
                            <TextInput
                                className="flex-1 bg-white rounded-xl p-4 text-base border border-gray-200"
                                placeholder={t('checkout_address.postal_code_placeholder')}
                                placeholderTextColor="#9CA3AF"
                                value={postalCode}
                                onChangeText={setPostalCode}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                onPress={() => setIsSearchOpen(true)}
                                className="bg-clony-primary px-5 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-bold">{t('checkout_address.search_btn')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-2">
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder={t('checkout_address.address_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <View className="mb-5">
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder={t('checkout_address.detail_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={detailAddress}
                            onChangeText={setDetailAddress}
                        />
                    </View>

                    {/* Delivery Note */}
                    <View className="mb-8">
                        <Text className="text-sm font-bold text-gray-700 mb-2">{t('checkout_address.memo')}</Text>
                        <TextInput
                            className="bg-white rounded-xl p-4 text-base border border-gray-200"
                            placeholder={t('checkout_address.memo_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={deliveryMemo}
                            onChangeText={setDeliveryMemo}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save Address Toggle */}
                    <View className="bg-white rounded-2xl p-5 border border-clony-primary/10 mb-8 flex-row items-center justify-between shadow-sm">
                        <View className="flex-1 pr-4">
                            <Text className="text-base font-bold text-gray-900 mb-1">{t('checkout_address.save_address')}</Text>
                            <Text className="text-xs text-gray-400">{t('checkout_address.save_address_hint')}</Text>
                        </View>
                        <Switch
                            value={saveAddress}
                            onValueChange={setSaveAddress}
                            trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                            thumbColor={Platform.OS === 'android' ? (saveAddress ? '#FFFFFF' : '#F4F3F4') : ''}
                        />
                    </View>

                    {/* Order Summary */}
                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-10">
                        <Text className="text-base font-bold text-gray-900 mb-3">
                            {t('checkout_address.order_summary')} {t('checkout_address.order_count', { count: cartItems.length })}
                        </Text>
                        {cartItems.slice(0, 2).map((item, idx) => (
                            <Text key={idx} className="text-sm text-gray-600 mb-1">
                                · {item.name}
                            </Text>
                        ))}
                        {cartItems.length > 2 && (
                            <Text className="text-sm text-gray-400">
                                {t('checkout_address.order_more', { count: cartItems.length - 2 })}
                            </Text>
                        )}
                    </View>
                </ScrollView>

                {/* Bottom Bar */}
                {!isKeyboardVisible && (
                    <View className="bg-white border-t border-gray-100 px-6 py-4 pb-8 rounded-t-[24px] shadow-lg">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-base text-gray-600">{t('checkout_address.total')}</Text>
                            <Text className="text-2xl font-bold text-clony-primary">
                                ₩{totalAmount.toLocaleString()}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleNext}
                            className="bg-clony-primary py-4 rounded-xl items-center shadow-lg shadow-green-200"
                        >
                            <Text className="text-white font-bold text-lg">{t('checkout_address.pay_btn')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Address Search Modal */}
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
                                placeholder={t('checkout_address.search_modal_placeholder')}
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
                                        <Text className="text-xs text-gray-400 mt-0.5">{t('checkout_address.search_result_type')}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
                                </TouchableOpacity>
                            ))
                        ) : searchQuery.length > 0 ? (
                            <View className="p-10 items-center">
                                <Text className="text-gray-400 text-sm">{t('checkout_address.search_empty')}</Text>
                                <TouchableOpacity
                                    onPress={() => handleSelectAddress(searchQuery)}
                                    className="mt-4 bg-gray-100 px-4 py-2 rounded-full"
                                >
                                    <Text className="text-gray-600 text-xs text-center">
                                        {t('checkout_address.search_use_input', { query: searchQuery })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="p-10 items-center">
                                <Ionicons name="search-outline" size={48} color="#F3F4F6" />
                                <Text className="text-gray-300 text-sm mt-4 text-center leading-5">
                                    {t('checkout_address.search_hint')}
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
