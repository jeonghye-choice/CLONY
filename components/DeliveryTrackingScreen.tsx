import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeliveryTrackingScreenProps {
    userName: string;
    onBack?: () => void;
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

const DeliveryTrackingScreen: React.FC<DeliveryTrackingScreenProps> = ({ userName, onBack }) => {
    const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
    const [addressQuery, setAddressQuery] = useState('');
    const [checkResult, setCheckResult] = useState<'success' | 'fail' | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Mock delivery data
    const deliveries = [
        {
            id: 1,
            orderNumber: 'CLN20240208001',
            productName: '독도 토너 외 2건',
            status: 'shipping',
            trackingNumber: '123456789012',
            estimatedDate: '2024.02.10',
            steps: [
                { label: '주문 완료', date: '2024.02.08 10:30', completed: true },
                { label: '상품 준비 중', date: '2024.02.08 14:20', completed: true },
                { label: '배송 중', date: '2024.02.09 09:00', completed: true, active: true },
                { label: '도착 완료', date: '-', completed: false },
            ]
        }
    ];


    const handleAddressCheck = (addr: string) => {
        const trimmed = addr.trim();
        if (!trimmed) {
            Alert.alert('알림', '주소를 입력해주세요.');
            return;
        }

        setAddressQuery(trimmed);
        if (trimmed.includes('명동') || trimmed.includes('중구')) {
            setCheckResult('success');
        } else {
            setCheckResult('fail');
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        if (text.trim().length > 0) {
            const filtered = MOCK_ADDRESSES.filter(addr =>
                addr.includes(text) || addr.replace(/ /g, '').includes(text.replace(/ /g, ''))
            );

            // 사용자가 입력한 텍스트 자체도 선택 가능하도록 추가
            const suggestions = [text.trim(), ...filtered.filter(f => f !== text.trim())];
            setFilteredSuggestions(suggestions);
        } else {
            setFilteredSuggestions([]);
        }
    };

    const handleSelectAddress = (addr: string) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setFilteredSuggestions([]);
        handleAddressCheck(addr);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'preparing':
                return { label: '상품 준비중', color: 'bg-blue-500', icon: 'cube-outline' };
            case 'shipping':
                return { label: '배송중', color: 'bg-clony-primary', icon: 'bicycle-outline' };
            case 'delivered':
                return { label: '배송완료', color: 'bg-gray-500', icon: 'checkmark-circle-outline' };
            default:
                return { label: '주문완료', color: 'bg-gray-400', icon: 'receipt-outline' };
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-6 pt-14 pb-6 flex-row items-center gap-4">
                {onBack && (
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                )}
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">배송 현황</Text>
                    <Text className="text-sm text-gray-500 mb-6">주문하신 상품의 배송 상태를 확인하세요</Text>
                </View>
            </View>

            <View className="px-6">
                {deliveries.length > 0 ? (
                    <View className="gap-4">
                        {deliveries.map((delivery) => {
                            const statusInfo = getStatusInfo(delivery.status);
                            return (
                                <View
                                    key={delivery.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                                >
                                    {/* Status Badge */}
                                    <View className="flex-row items-center justify-between mb-4">
                                        <View className={`${statusInfo.color} px-3 py-1.5 rounded-full flex-row items-center gap-2`}>
                                            <Ionicons name={statusInfo.icon as any} size={16} color="white" />
                                            <Text className="text-white font-bold text-xs">{statusInfo.label}</Text>
                                        </View>
                                        <Text className="text-xs text-gray-400">{delivery.orderNumber}</Text>
                                    </View>

                                    {/* Product Info */}
                                    <Text className="text-base font-bold text-gray-900 mb-2">{delivery.productName}</Text>

                                    {/* Tracking Info */}
                                    <View className="bg-gray-50 p-3 rounded-xl mb-3">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-xs text-gray-500">운송장번호</Text>
                                            <Text className="text-xs font-bold text-gray-700">{delivery.trackingNumber}</Text>
                                        </View>
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs text-gray-500">도착 예정일</Text>
                                            <Text className="text-xs font-bold text-clony-primary">{delivery.estimatedDate}</Text>
                                        </View>
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity
                                        onPress={() => setSelectedDelivery(delivery)}
                                        className="bg-gray-900 py-3 rounded-xl items-center"
                                    >
                                        <Text className="text-white font-bold text-sm">배송 추적하기</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    // Empty State
                    <View className="bg-white rounded-2xl p-12 items-center shadow-sm">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="cube-outline" size={40} color="#D1D5DB" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg mb-2 text-center">배송 중인 상품이 없습니다</Text>
                        <Text className="text-gray-400 text-sm text-center">
                            주문하신 상품의 배송 현황을{'\n'}여기서 확인할 수 있어요
                        </Text>
                    </View>
                )}

                {/* Service Area Check Section - NEW */}
                <View className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <Text className="text-lg font-bold text-gray-900 mb-6">서비스 지역 확인</Text>

                    {/* Area Search Trigger */}
                    <TouchableOpacity
                        onPress={() => setIsSearchOpen(true)}
                        className="bg-gray-50 rounded-xl px-4 py-3.5 flex-row items-center mb-3 border border-gray-100"
                    >
                        <View className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center">
                            <Ionicons name="search" size={16} color="#4B5563" />
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-[10px] text-gray-400 font-bold mb-0.5">배송지 검색</Text>
                            <Text className={`text-sm font-bold ${addressQuery ? 'text-gray-900' : 'text-gray-300'}`}>
                                {addressQuery || '지번, 도로명 주소를 입력해주세요'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Result Message */}
                    <View className="mb-4">
                        {checkResult === 'success' && (
                            <View className="bg-green-50 px-4 py-4 rounded-xl flex-row items-start">
                                <View className="w-8 h-8 items-center justify-center">
                                    <Ionicons name="checkmark-circle" size={24} color="#00D182" />
                                </View>
                                <View className="flex-1 ml-3 pt-1">
                                    <Text className="text-xs text-green-700 font-bold leading-5">
                                        축하합니다! 클로니존(명동) 배송 가능 지역입니다. 🚀
                                    </Text>
                                </View>
                            </View>
                        )}
                        {checkResult === 'fail' && (
                            <View className="bg-gray-50 px-4 py-4 rounded-xl flex-row items-start">
                                <View className="w-8 h-8 items-center justify-center">
                                    <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                                </View>
                                <View className="flex-1 ml-3 pt-1">
                                    <Text className="text-xs text-gray-500 font-bold leading-5">
                                        아쉽게도 아직 서비스 준비 중인 지역입니다. 😂
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => handleAddressCheck(addressQuery)}
                        className="bg-gray-900 py-3.5 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-sm">지역 확인하기</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
                                placeholder="지번, 도로명 주소를 입력해주세요"
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                autoFocus
                            />
                            {isSearching && (
                                <View className="animate-spin">
                                    <Ionicons name="refresh-outline" size={20} color="#00D182" />
                                </View>
                            )}
                            {searchQuery.length > 0 && !isSearching && (
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

            {/* Delivery Detail Modal */}
            <Modal
                visible={!!selectedDelivery}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDelivery(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-[32px] h-[85%]">
                        {/* Modal Header */}
                        <View className="px-6 py-5 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-xl font-bold text-gray-900">배송 상세 추적</Text>
                            <TouchableOpacity onPress={() => setSelectedDelivery(null)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
                            {/* Detailed Map Mockup */}
                            <View className="mx-6 mt-6 bg-[#f8f9fa] h-56 rounded-2xl overflow-hidden relative shadow-inner border border-gray-100">
                                {/* Street Grid Layer */}
                                <View className="absolute inset-0 opacity-[0.05]">
                                    {[...Array(10)].map((_, i) => (
                                        <View key={`v-${i}`} className="absolute top-0 bottom-0 w-[1px] bg-gray-900" style={{ left: `${i * 11}%` }} />
                                    ))}
                                    {[...Array(10)].map((_, i) => (
                                        <View key={`h-${i}`} className="absolute left-0 right-0 h-[1px] bg-gray-900" style={{ top: `${i * 11}%` }} />
                                    ))}
                                </View>

                                {/* Major Streets */}
                                <View className="absolute top-[40%] left-0 right-0 h-4 bg-gray-200/50 -rotate-2" />
                                <View className="absolute top-0 bottom-0 left-[45%] w-4 bg-gray-200/50 rotate-3" />

                                {/* Clony Zone Highlight */}
                                <View
                                    className="absolute top-[25%] left-[30%] w-[45%] h-[40%] bg-clony-primary/10 border-2 border-clony-primary/30 rounded-3xl"
                                    style={{ transform: [{ rotate: '-5deg' }] }}
                                >
                                    <View className="absolute -top-3 -right-3 bg-clony-primary px-2 py-0.5 rounded-full">
                                        <Text className="text-[8px] text-white font-bold">CLONY ZONE</Text>
                                    </View>
                                </View>

                                {/* Landmark: 명동성당 */}
                                <View className="absolute top-[35%] left-[55%] items-center">
                                    <View className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                        <Text className="text-[10px] text-gray-500 font-bold">⛪ 명동성당</Text>
                                    </View>
                                    <View className="w-1 h-3 bg-gray-300" />
                                </View>

                                {/* Landmark: 남산타워 */}
                                <View className="absolute bottom-[10%] left-[20%] items-center">
                                    <View className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                        <Text className="text-[10px] text-gray-500 font-bold">🗼 남산타워</Text>
                                    </View>
                                    <View className="w-1 h-3 bg-gray-300" />
                                </View>

                                {/* Landmark: 롯데백화점 */}
                                <View className="absolute top-[15%] left-[35%] items-center">
                                    <View className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                        <Text className="text-[10px] text-gray-500 font-bold">🏢 롯데백화점</Text>
                                    </View>
                                    <View className="w-1 h-3 bg-gray-300" />
                                </View>

                                {/* Delivery Route Path */}
                                <View className="absolute bottom-0 left-0 w-full h-full">
                                    <View
                                        className="absolute bottom-10 left-10 w-40 h-[2px] border-t-2 border-dashed border-gray-400 opacity-50"
                                        style={{ transform: [{ rotate: '-45deg' }] }}
                                    />
                                </View>

                                {/* Current Delivery Position (Vehicle) */}
                                <View className="absolute top-[48%] left-[42%] items-center">
                                    <View className="bg-clony-primary w-10 h-10 rounded-full items-center justify-center shadow-lg border-2 border-white">
                                        <Ionicons name="bicycle" size={20} color="white" />
                                    </View>
                                    {/* Pulse Effect */}
                                    <View className="absolute -inset-2 bg-clony-primary/20 rounded-full animate-pulse" />

                                    <View className="mt-2 bg-gray-900 px-3 py-1.5 rounded-xl shadow-xl items-center justify-center">
                                        <Text className="text-[10px] text-white font-bold text-center">배송중: 명동역 5번 출구 부근</Text>
                                    </View>
                                </View>

                                {/* Destination Info */}
                                <View className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                                    <Text className="text-[8px] text-gray-400 font-bold mb-0.5">목적지 예정</Text>
                                    <Text className="text-[10px] text-gray-900 font-bold">명동 8길 27</Text>
                                </View>
                            </View>

                            {/* Progress Steps Section */}
                            <View className="px-8 mt-8">
                                <Text className="text-lg font-bold text-gray-900 mb-6 font-primary">배송 진행 단계</Text>

                                {selectedDelivery?.steps.map((step: any, index: number) => (
                                    <View key={index} className="flex-row mb-8">
                                        {/* Line & Dot */}
                                        <View className="items-center mr-6">
                                            <View className={`w-4 h-4 rounded-full border-2 ${step.completed ? 'bg-clony-primary border-clony-primary' : 'bg-white border-gray-200'} z-10`}>
                                                {step.active && (
                                                    <View className="absolute -inset-1.5 bg-clony-primary/20 rounded-full scale-110" />
                                                )}
                                            </View>
                                            {index < selectedDelivery.steps.length - 1 && (
                                                <View className={`w-[2px] h-12 ${step.completed ? 'bg-clony-primary' : 'bg-gray-100'}`} />
                                            )}
                                        </View>

                                        {/* Step Text */}
                                        <View className="flex-1 justify-center -mt-1">
                                            <Text className={`text-base font-bold ${step.completed ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {step.label}
                                            </Text>
                                            <Text className="text-xs text-gray-400 mt-1">
                                                {step.date}
                                            </Text>
                                        </View>

                                        {/* Status Icon */}
                                        {step.active && (
                                            <View className="bg-clony-primary/10 w-10 h-10 rounded-full items-center justify-center">
                                                <Ionicons name="location" size={20} color="#00D182" />
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Detailed Logs (Placeholder) */}
                            <View className="mx-6 mb-12 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <Text className="text-sm font-bold text-gray-600 mb-4">배송 로그</Text>
                                <View className="flex-row justify-between mb-3">
                                    <Text className="text-xs text-gray-500">배송예정</Text>
                                    <Text className="text-xs text-gray-900 font-bold">{userName} 고객님 (자택)</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-xs text-gray-500">담당기사</Text>
                                    <Text className="text-xs text-gray-900 font-bold">홍길동 기사님 (010-XXXX-XXXX)</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    );
};

export default DeliveryTrackingScreen;
