import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';

interface CartScreenProps {
    onCheckout: (cartItems: any[], totalAmount: number, deliveryOption: string, deliveryTime?: string) => void;
    onBack?: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onCheckout, onBack }) => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const [deliveryOption, setDeliveryOption] = useState<'same-day' | 'dawn' | 'hotel'>('same-day');
    const [hotelTime, setHotelTime] = useState('15:00');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const TIME_OPTIONS = Array.from({ length: 9 }, (_, i) => `${i + 14}:00`); // 14:00 ~ 22:00

    const handleRemoveItem = (id: string) => {
        Alert.alert(
            '상품 삭제',
            '장바구니에서 이 상품을 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => removeFromCart(id),
                },
            ]
        );
    };

    const handleQuantityChange = (id: string, delta: number) => {
        const item = cartItems.find(i => i.id === id);
        if (item) {
            const newQuantity = (item.quantity || 1) + delta;
            if (newQuantity > 0) {
                updateQuantity(id, newQuantity);
            }
        }
    };

    const handleCheckoutPress = () => {
        if (cartItems.length === 0) {
            Alert.alert('장바구니가 비어있어요', '상품을 먼저 담아주세요!');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirmCheckout = () => {
        setShowConfirmModal(false);
        onCheckout(cartItems, getCartTotal(), deliveryOption, deliveryOption === 'hotel' ? hotelTime : undefined);
    };

    if (cartItems.length === 0) {
        return (
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100 flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={28} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900">장바구니</Text>
                </View>

                {/* Empty State */}
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="cart-outline" size={40} color="#D1D5DB" />
                    </View>
                    <Text className="text-lg font-bold text-gray-900 mb-2">
                        장바구니가 비어있어요
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mb-6">
                        OCR로 스캔한 제품을 담아보세요!
                    </Text>
                    <TouchableOpacity
                        onPress={onBack}
                        className="bg-clony-primary px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">쇼핑하러 가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={onBack}>
                            <Ionicons name="arrow-back" size={28} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">장바구니</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                '장바구니 비우기',
                                '모든 상품을 삭제하시겠습니까?',
                                [
                                    { text: '취소', style: 'cancel' },
                                    { text: '비우기', style: 'destructive', onPress: clearCart },
                                ]
                            );
                        }}
                    >
                        <Text className="text-sm text-gray-500">전체 삭제</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-500 mt-1">
                    {cartItems.length}개 상품
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Cart Items */}
                {cartItems.map((item) => {
                    const quantity = item.quantity || 1;
                    const itemTotal = item.price * quantity;

                    return (
                        <View
                            key={item.id}
                            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
                        >
                            <View className="flex-row gap-4">
                                {/* Product Image */}
                                <Image
                                    source={item.image || require('../assets/product_images/toner.png')}
                                    className="w-24 h-24 rounded-xl bg-gray-50"
                                    resizeMode="contain"
                                />

                                {/* Product Info */}
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-xs text-gray-400 font-bold mb-1">
                                                {item.brand}
                                            </Text>
                                            <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                                            <Ionicons name="close-circle" size={24} color="#D1D5DB" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Match Badge */}
                                    {item.matchingScore && (
                                        <View className="bg-teal-50 self-start px-2 py-1 rounded-md mb-3 border border-teal-200">
                                            <Text className="text-teal-600 text-[10px] font-bold">
                                                {item.matchingScore}% 일치
                                            </Text>
                                        </View>
                                    )}

                                    {/* Quantity & Price */}
                                    <View className="flex-row items-center justify-between mt-2">
                                        {/* Quantity Controls */}
                                        <View className="flex-row items-center gap-2">
                                            <TouchableOpacity
                                                onPress={() => handleQuantityChange(item.id, -1)}
                                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                                            >
                                                <Text className="font-bold text-gray-600">-</Text>
                                            </TouchableOpacity>
                                            <Text className="font-bold text-gray-900 w-8 text-center">{quantity}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleQuantityChange(item.id, 1)}
                                                className="w-8 h-8 bg-clony-primary rounded-full items-center justify-center"
                                            >
                                                <Text className="font-bold text-white">+</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Price */}
                                        <Text className="text-lg font-bold text-gray-900">
                                            ₩{itemTotal.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Delivery Options */}
                <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                    <Text className="font-bold text-gray-900 mb-4 text-base">배송 옵션</Text>

                    {/* Same-day Delivery */}
                    <TouchableOpacity
                        onPress={() => setDeliveryOption('same-day')}
                        className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${deliveryOption === 'same-day'
                            ? 'bg-teal-50 border-teal-500'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <Ionicons
                            name={deliveryOption === 'same-day' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={deliveryOption === 'same-day' ? '#00D182' : '#9CA3AF'}
                        />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-gray-900 text-base">🚚 당일 배송</Text>
                            <Text className="text-xs text-gray-500 mt-1">오후 6시 이전 주문 시</Text>
                        </View>
                        <Text className="text-sm font-bold text-clony-primary">무료</Text>
                    </TouchableOpacity>

                    {/* Dawn Delivery */}
                    <TouchableOpacity
                        onPress={() => setDeliveryOption('dawn')}
                        className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${deliveryOption === 'dawn'
                            ? 'bg-teal-50 border-teal-500'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <Ionicons
                            name={deliveryOption === 'dawn' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={deliveryOption === 'dawn' ? '#00D182' : '#9CA3AF'}
                        />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-gray-900 text-base">🌙 새벽 배송</Text>
                            <Text className="text-xs text-gray-500 mt-1">오전 7시 도착</Text>
                        </View>
                        <Text className="text-sm font-bold text-clony-primary">무료</Text>
                    </TouchableOpacity>

                    {/* Hotel Check-in Delivery */}
                    <TouchableOpacity
                        onPress={() => setDeliveryOption('hotel')}
                        className={`flex-row items-center p-4 rounded-xl border-2 ${deliveryOption === 'hotel'
                            ? 'bg-teal-50 border-teal-500'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <Ionicons
                            name={deliveryOption === 'hotel' ? 'radio-button-on' : 'radio-button-off'}
                            size={24}
                            color={deliveryOption === 'hotel' ? '#00D182' : '#9CA3AF'}
                        />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-gray-900 text-base">🏨 호텔 체크인 맞춤</Text>
                            <Text className="text-xs text-gray-500 mt-1">
                                {deliveryOption === 'hotel'
                                    ? (parseInt(hotelTime.split(':')[0]) >= 19
                                        ? `내일 새벽 7시 배송 (18시 이후 체크인)`
                                        : `${hotelTime}에 로비로 당일 배송`)
                                    : '체크인 시간에 맞춰 수령'}
                            </Text>
                        </View>
                        {deliveryOption === 'hotel' && (
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                className="bg-white border border-teal-200 px-3 py-1.5 rounded-lg ml-2"
                            >
                                <Text className="text-xs font-bold text-teal-600">시간 설정</Text>
                            </TouchableOpacity>
                        )}
                        {deliveryOption !== 'hotel' && (
                            <Text className="text-sm font-bold text-clony-primary">+3,000</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            <View className="bg-white border-t border-gray-100 px-6 py-5 pb-8 rounded-t-3xl shadow-2xl">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-gray-600">상품 금액</Text>
                    <Text className="text-base font-bold text-gray-900">
                        ₩{getCartTotal().toLocaleString()}
                    </Text>
                </View>
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <Text className="text-sm text-gray-600">배송비</Text>
                    <Text className="text-base font-bold text-clony-primary">무료</Text>
                </View>
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base text-gray-900 font-bold">총 결제금액</Text>
                    <Text className="text-2xl font-black text-clony-primary">
                        ₩{getCartTotal().toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleCheckoutPress}
                    className="bg-clony-primary py-4 rounded-2xl items-center shadow-lg"
                    style={{ elevation: 3 }}
                >
                    <Text className="text-white font-bold text-lg">₩{getCartTotal().toLocaleString()} 결제하기</Text>
                </TouchableOpacity>
            </View>

            {/* Time Picker Modal */}
            <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTimePicker(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-2xl p-6 max-h-[80%]">
                        <Text className="text-xl font-bold text-gray-900 mb-4 text-center">체크인(수령) 시간을 선택해주세요</Text>
                        <Text className="text-xs text-gray-400 text-center mb-4">
                            * 18:00 이후 체크인 시 다음 날 새벽 7시에 배송됩니다.
                        </Text>
                        <ScrollView className="mb-4">
                            {TIME_OPTIONS.map((time) => {
                                const isSameDay = parseInt(time.split(':')[0]) <= 18;
                                const isLate = parseInt(time.split(':')[0]) >= 19;
                                return (
                                    <TouchableOpacity
                                        key={time}
                                        onPress={() => {
                                            setHotelTime(time);
                                            setShowTimePicker(false);
                                        }}
                                        className={`py-4 border-b border-gray-100 ${hotelTime === time ? 'bg-teal-50' : ''}`}
                                    >
                                        <View className="flex-row justify-center items-center gap-2">
                                            <Text className={`text-center text-lg ${hotelTime === time ? 'font-bold text-teal-600' : 'text-gray-700'}`}>
                                                {time}
                                            </Text>
                                            {isSameDay && (
                                                <View className="bg-teal-100 px-2 py-0.5 rounded-md">
                                                    <Text className="text-[10px] text-teal-600 font-bold">당일배송</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowTimePicker(false)}
                            className="bg-gray-100 py-3 rounded-xl items-center"
                        >
                            <Text className="font-bold text-gray-600">닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Checkout Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-2xl p-6 items-center shadow-2xl">
                        <View className="w-16 h-16 bg-teal-50 rounded-full items-center justify-center mb-4">
                            <Ionicons name="card" size={32} color="#00D182" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2">구매를 진행하시겠습니까?</Text>
                        <Text className="text-gray-500 text-center mb-6">
                            총 {cartItems.length}개의 상품{"\n"}
                            결제 금액: ₩{getCartTotal().toLocaleString()}
                            {deliveryOption === 'hotel' && (
                                parseInt(hotelTime.split(':')[0]) >= 19
                                    ? `\n(호텔 배송: 내일 새벽 7시 도착)`
                                    : `\n(호텔 배송: 오늘 ${hotelTime} 도착)`
                            )}
                        </Text>

                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity
                                onPress={() => setShowConfirmModal(false)}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold text-base">취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleConfirmCheckout}
                                className="flex-1 py-3.5 bg-clony-primary rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-base">구매하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default CartScreen;
