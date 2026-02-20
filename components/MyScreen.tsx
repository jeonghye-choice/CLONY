import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Switch, Alert, Modal, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useProduct } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';

interface MyScreenProps {
    userName: string;
    skinCode?: string;
    onLogout: () => void;
    onNicknameChange: (newName: string) => void;
    loginProvider: string;
    onScanPress: () => void;
    onCabinetPress?: () => void;
    onDeliveryPress?: () => void;
}

const MyScreen: React.FC<MyScreenProps> = ({ userName, skinCode, onLogout, onNicknameChange, loginProvider, onScanPress, onCabinetPress, onDeliveryPress }) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const { wishlist, toggleWishlist } = useProduct();
    const { addToCart } = useCart();

    // New states for stats
    const [myCoupons, setMyCoupons] = useState([
        { id: '1', name: '신규 가입 환영 쿠폰', discount: '5,000원', minOrder: '30,000원 이상 구매 시', expiry: '2026.03.15', used: false },
        { id: '2', name: '피부 진단 완료 감사 쿠폰', discount: '10%', minOrder: '최대 5,000원 할인', expiry: '2026.02.28', used: false },
        { id: '3', name: '첫 구매 감사 3,000원 할인', discount: '3,000원', minOrder: '10,000원 이상 구매 시', expiry: '2026.01.20', used: true },
    ]);
    const [pointHistory, setPointHistory] = useState([
        { id: '1', type: 'earn', title: '설날 맞이 이벤트', amount: 1000, date: '2026.02.18' },
        { id: '2', type: 'earn', title: '리뷰 작성 적립', amount: 500, date: '2026.02.10' },
        { id: '3', type: 'use', title: '상품 구매 사용', amount: -2500, date: '2026.02.01' },
    ]);

    // Derived values
    const availableCouponCount = myCoupons.filter(c => !c.used).length;
    const currentPoints = Math.max(0, pointHistory.reduce((acc, h) => acc + h.amount, 1500 + 1000)); // Base amount + history
    // Note: The original PointModal showed 1500 as the total but the history sums to -1000 (1000+500-2500). 
    // I'll make it consistent with the 1500 shown in the UI.
    const totalPoints = pointHistory.reduce((acc, h) => acc + h.amount, 1500 + 1000);
    const calculatedPoints = pointHistory.reduce((acc, curr) => acc + curr.amount, 2500);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(userName);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [cards, setCards] = useState([
        { id: '1', type: 'visa', last4: '1234', bank: '신한카드', isDefault: true, color: '#1A1A2E' },
        { id: '2', type: 'master', last4: '5678', bank: '국민카드', isDefault: false, color: '#16213E' },
    ]);
    const [isAddCardVisible, setIsAddCardVisible] = useState(false);
    const [newCardNumber, setNewCardNumber] = useState('');
    const [newCardExpiry, setNewCardExpiry] = useState('');
    const [newCardName, setNewCardName] = useState('');

    // 7개 서브 화면 모달 state
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const openModal = (name: string) => setActiveModal(name);
    const closeModal = () => setActiveModal(null);

    // 주문 관리 state
    const [managedOrders, setManagedOrders] = useState([
        { id: 'CLN20260210', date: '2026-02-10', status: '배송완료', items: ['독도 토너 1개', '수분 크림 1개'], total: '38,000원', confirmed: false },
        { id: 'CLN20260201', date: '2026-02-01', status: '배송중', items: ['선크림 SPF50 1개'], total: '22,000원', confirmed: false },
        { id: 'CLN20260115', date: '2026-01-15', status: '구매확정', items: ['클렌징폼 1개', '앰플 1개'], total: '45,000원', confirmed: true },
    ]);
    const [returnModalOrder, setReturnModalOrder] = useState<any>(null);
    const [returnType, setReturnType] = useState<'교환' | '반품'>('반품');
    const [returnReason, setReturnReason] = useState('');
    const returnReasons = ['단순 변심', '상품 불량/파손', '오배송', '상품 정보 상이', '기타'];

    // 1:1 문의 state
    const [inquiryText, setInquiryText] = useState('');
    const [inquiryCategory, setInquiryCategory] = useState('배송');
    const [inquiries, setInquiries] = useState([
        { id: '1', category: '배송', title: '배송 지연 문의', date: '2026-02-10', status: '답변완료', answer: '안녕하세요. 배송 지연에 대해 사과드립니다. 현재 택배사 사정으로 1-2일 지연되고 있습니다.' },
        { id: '2', category: '상품', title: '제품 성분 문의', date: '2026-02-15', status: '답변대기', answer: '' },
    ]);
    const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);

    // 리뷰 데이터 state
    const [myReviews, setMyReviews] = useState([
        { id: '1', name: '독도 토너 200ml', brand: '라운드랩', date: '2026-01-20', rating: 5, content: '피부가 촉촉해지고 자극이 없어서 너무 좋아요! 민감한 피부인데 전혀 트러블이 없었습니다. 재구매 의사 100%!', helpful: 12, image: require('../assets/product_images/toner.png') },
        { id: '2', name: '수분 크림 50ml', brand: '코스알엑스', date: '2026-01-05', rating: 4, content: '보습력이 좋고 발림성도 훌륭합니다. 향이 조금 강한 편이라 별 4개 드립니다.', helpful: 7, image: require('../assets/product_images/cream.png') },
    ]);

    // 작성 가능한 리뷰 데이터
    const [writableReviewItems, setWritableReviewItems] = useState([
        { id: '1', name: '독도 토너 200ml', brand: '라운드랩', orderDate: '2026-02-10', deadline: '2026-03-10', image: require('../assets/product_images/toner.png') },
        { id: '2', name: '수분 크림 50ml', brand: '코스알엑스', orderDate: '2026-02-10', deadline: '2026-03-10', image: require('../assets/product_images/cream.png') },
    ]);

    // 취소/반품/교환 데이터
    const [returnHistory, setReturnHistory] = useState([
        { id: 'RET20260205', date: '2026-02-05', type: '반품', reason: '상품 불량', status: '처리완료', statusColor: '#10B981', item: '독도 토너', refund: '19,000원' },
        { id: 'EXC20260118', date: '2026-01-18', type: '교환', reason: '다른 상품 오배송', status: '처리중', statusColor: '#F59E0B', item: '수분 크림', refund: '-' },
    ]);

    // 공지사항 데이터
    const [notices, setNotices] = useState([
        { id: '1', date: '2026-02-18', category: '업데이트', title: '화장품 DB 대규모 업데이트 안내', content: '안녕하세요, Clony 팀입니다.\n\n2월 18일자로 화장품 데이터베이스가 업데이트되었습니다.\n이제 최신 신상 화장품 정보도 바로 확인하실 수 있습니다.\n\n[주요 업데이트 내용]\n- 신규 브랜드 15개 추가\n- 2026 S/S 신상 제품 500여 종 등록\n- 성분 분석 알고리즘 개선\n\n앞으로도 더 정확한 정보를 제공하기 위해 노력하겠습니다.\n감사합니다.' },
        { id: '2', date: '2026-02-10', category: '점검', title: '서버 안정화 및 버그 수정', content: '안녕하세요.\n\n보다 안정적인 서비스 제공을 위해 서버 점검 및 버그 수정이 진행되었습니다.\n\n- 간헐적인 로그인 실패 현상 수정\n- 앱 실행 속도 최적화\n\n이용에 불편을 드려 죄송합니다.\n더 나은 서비스를 위해 최선을 다하겠습니다.' },
        { id: '3', date: '2026-01-25', category: '이벤트', title: '설날 맞이 포인트 지급 이벤트', content: '새해 복 많이 받으세요! 🙇‍♂️\n\n설날을 맞아 모든 회원분들께 1,000P를 지급해 드립니다.\n지급된 포인트는 마이페이지 > 포인트 내역에서 확인 가능합니다.\n\nClony와 함께 즐거운 명절 보내세요!' },
    ]);

    // 배송지 관리 state - Initialized with placeholder, will load from Storage
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);

    // --- Persistence Logic ---
    const STORAGE_KEYS = {
        COUPONS: 'CLONY_MY_COUPONS',
        POINTS: 'CLONY_POINT_HISTORY',
        ORDERS: 'CLONY_MANAGED_ORDERS',
        INQUIRIES: 'CLONY_INQUIRIES',
        REVIEWS: 'CLONY_MY_REVIEWS',
        WRITABLE_REVIEWS: 'CLONY_WRITABLE_REVIEWS',
        RETURNS: 'CLONY_RETURN_HISTORY',
        CARDS: 'CLONY_PAYMENT_CARDS',
        PROFILE_IMAGE: 'CLONY_PROFILE_IMAGE',
        ADDRESSES: 'CLONY_ADDRESSES'
    };

    // Load all data on mount
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const results = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.COUPONS),
                    AsyncStorage.getItem(STORAGE_KEYS.POINTS),
                    AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
                    AsyncStorage.getItem(STORAGE_KEYS.INQUIRIES),
                    AsyncStorage.getItem(STORAGE_KEYS.REVIEWS),
                    AsyncStorage.getItem(STORAGE_KEYS.WRITABLE_REVIEWS),
                    AsyncStorage.getItem(STORAGE_KEYS.RETURNS),
                    AsyncStorage.getItem(STORAGE_KEYS.CARDS),
                    AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE),
                    AsyncStorage.getItem(STORAGE_KEYS.ADDRESSES),
                ]);

                if (results[0]) setMyCoupons(JSON.parse(results[0]));
                if (results[1]) setPointHistory(JSON.parse(results[1]));
                if (results[2]) setManagedOrders(JSON.parse(results[2]));
                if (results[3]) setInquiries(JSON.parse(results[3]));
                if (results[4]) setMyReviews(JSON.parse(results[4]));
                if (results[5]) setWritableReviewItems(JSON.parse(results[5]));
                if (results[6]) setReturnHistory(JSON.parse(results[6]));
                if (results[7]) setCards(JSON.parse(results[7]));
                if (results[8]) setProfileImage(results[8]);
                if (results[9]) setAddresses(JSON.parse(results[9]));
            } catch (e) {
                console.error('Failed to load persistent data', e);
            }
        };
        loadAllData();
    }, []);

    // Individual persistence hooks
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(myCoupons)); }, [myCoupons]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify(pointHistory)); }, [pointHistory]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(managedOrders)); }, [managedOrders]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries)); }, [inquiries]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(myReviews)); }, [myReviews]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.WRITABLE_REVIEWS, JSON.stringify(writableReviewItems)); }, [writableReviewItems]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returnHistory)); }, [returnHistory]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards)); }, [cards]);
    useEffect(() => { AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses)); }, [addresses]);
    useEffect(() => { if (profileImage) AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, profileImage); }, [profileImage]);

    // --- UI State Helpers ---
    const [isAddAddressVisible, setIsAddAddressVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [addrForm, setAddrForm] = useState({ name: '', recipient: '', phone: '', address: '', detail: '' });

    // 구매 확정 모달 state
    const [isConfirmPurchaseVisible, setIsConfirmPurchaseVisible] = useState(false);
    const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);



    // Stats Data
    const stats = [
        { label: '쿠폰', value: availableCouponCount.toString(), unit: '장', icon: 'pricetag-outline', color: '#00D182' },
        { label: '포인트', value: calculatedPoints.toLocaleString(), unit: 'P', icon: 'card-outline', color: '#00D182' },
        { label: '찜한 상품', value: (wishlist || []).length.toString(), unit: '개', icon: 'heart-outline', color: '#00D182' },
    ];

    // Order Tracking Data - Dynamically calculated from managedOrders
    const orderSteps = [
        { label: '입금대기', status: '입금대기', icon: 'card-outline' },
        { label: '결제완료', status: '결제완료', icon: 'checkmark-circle-outline' },
        { label: '상품준비', status: '상품준비', icon: 'cube-outline' },
        { label: '배송중', status: '배송중', icon: 'bicycle-outline' },
        { label: '배송완료', status: '배송완료', icon: 'gift-outline' },
    ].map(step => ({
        ...step,
        count: managedOrders.filter(o => o.status === step.status && !o.confirmed).length
    }));

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

    const handleEditProfile = () => {
        setEditName(userName);
        setIsEditModalVisible(true);
    };

    const handleSaveProfile = () => {
        if (editName.trim().length < 2) {
            Alert.alert("오류", "닉네임은 2자 이상이어야 합니다.");
            return;
        }
        onNicknameChange(editName);
        setIsEditModalVisible(false);
    };

    const handleSetDefault = (id: string) => {
        setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    };

    const handleDeleteCard = (id: string) => {
        Alert.alert('카드 삭제', '이 카드를 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: () => setCards(prev => prev.filter(c => c.id !== id)) }
        ]);
    };

    const handleAddCard = () => {
        if (newCardNumber.length < 4 || !newCardExpiry || !newCardName) {
            Alert.alert('입력 오류', '모든 정보를 입력해주세요.');
            return;
        }
        const newCard = {
            id: Date.now().toString(),
            type: 'visa',
            last4: newCardNumber.slice(-4),
            bank: newCardName,
            isDefault: cards.length === 0,
            color: '#0F3460',
        };
        setCards(prev => [...prev, newCard]);
        setNewCardNumber('');
        setNewCardExpiry('');
        setNewCardName('');
        setIsAddCardVisible(false);
    };

    // 주문 관리 핸들러
    const handleConfirmPurchase = (id: string) => {
        setConfirmTargetId(id);
        setIsConfirmPurchaseVisible(true);
    };

    const confirmPurchaseAction = () => {
        if (confirmTargetId) {
            setManagedOrders(prev => prev.map(o => o.id === confirmTargetId ? { ...o, status: '구매확정', confirmed: true } : o));
            setIsConfirmPurchaseVisible(false);
            setConfirmTargetId(null);
            setTimeout(() => {
                Alert.alert('완료', '구매가 확정되었습니다! 포인트가 적립됩니다. 🎉');
            }, 300);
        }
    };

    const handleSubmitReturn = () => {
        if (!returnReason) { Alert.alert('알림', '사유를 선택해주세요.'); return; }
        Alert.alert('신청 완료', `${returnType} 신청이 접수되었습니다.\n1-2 영업일 내 처리됩니다.`, [
            { text: '확인', onPress: () => { setReturnModalOrder(null); setReturnReason(''); } }
        ]);
    };

    // 배송지 핸들러
    const handleSetDefaultAddress = (id: string) => {
        const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        setAddresses(updated);
    };

    const handleDeleteAddress = (id: string) => {
        Alert.alert('배송지 삭제', '이 배송지를 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: () => {
                    const updated = addresses.filter(a => a.id !== id);
                    setAddresses(updated);
                }
            }
        ]);
    };

    const handleOpenAddAddress = (existing?: any) => {
        if (existing) {
            setAddrForm({ name: existing.name, recipient: existing.recipient, phone: existing.phone, address: existing.address, detail: existing.detail });
            setEditingAddress(existing);
        } else {
            setAddrForm({ name: '', recipient: '', phone: '', address: '', detail: '' });
            setEditingAddress(null);
        }
        setIsAddAddressVisible(true);
    };

    const handleSaveAddress = () => {
        if (!addrForm.recipient || !addrForm.phone || !addrForm.address) {
            Alert.alert('입력 오류', '수령인, 연락처, 주소는 필수입니다.');
            return;
        }
        let updated;
        if (editingAddress) {
            updated = addresses.map(a => a.id === editingAddress.id ? { ...a, ...addrForm } : a);
        } else {
            updated = [...addresses, { id: Date.now().toString(), ...addrForm, isDefault: addresses.length === 0 }];
        }
        setAddresses(updated);
        setIsAddAddressVisible(false);
        setEditingAddress(null);
    };

    return (
        <>
            <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 120 }}>
                {/* 1. New Profile Header */}
                <View className="bg-white pt-16 pb-8 px-6 rounded-b-[40px] shadow-sm z-10">
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={pickImage} className="relative">
                                <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center overflow-hidden border border-gray-200">
                                    {profileImage ? (
                                        <Image source={{ uri: profileImage }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <Text className="text-2xl">👤</Text>
                                    )}
                                </View>
                                <View className="absolute bottom-0 right-0 bg-clony-primary w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                                    <Ionicons name="camera" size={10} color="white" />
                                </View>
                            </TouchableOpacity>

                            <View>
                                <View className="flex-row items-center gap-2 mb-1">
                                    <Text className="text-lg font-bold text-gray-900">{userName}님</Text>
                                    {skinCode && (
                                        <View className="bg-clony-primary/10 px-2 py-0.5 rounded-full border border-clony-primary/20">
                                            <Text className="text-clony-primary text-[10px] font-bold">#{skinCode}</Text>
                                        </View>
                                    )}
                                    <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                                        <Text className="text-xs text-gray-500 font-bold">{loginProvider === 'kakao' ? 'KAKAO' : 'EMAIL'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity onPress={onLogout}>
                            <Ionicons name="settings-outline" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* 2. Redesigned Dashboard Stats - Open Icon Style */}
                    <View className="flex-row justify-between bg-white px-1 py-6 rounded-3xl mx-2 shadow-sm border border-gray-50">
                        {[
                            { label: '주문·내역', value: managedOrders.length.toString(), unit: '', icon: 'receipt-outline', color: '#4A90E2' },
                            { label: '리뷰', value: myReviews.length.toString(), unit: '', icon: 'create-outline', color: '#F2C94C' },
                            { label: '문의', value: inquiries.length.toString(), unit: '', icon: 'chatbubble-ellipses-outline', color: '#9B51E0' },
                            { label: '쿠폰', value: availableCouponCount.toString(), unit: '장', icon: 'ticket-outline', color: '#FF7675' },
                            { label: '포인트', value: calculatedPoints.toLocaleString(), unit: '원', icon: 'cash-outline', color: '#F2C94C' },
                        ].map((stat, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    switch (index) {
                                        case 0: openModal('orders'); break;
                                        case 1: openModal('myReviews'); break;
                                        case 2: openModal('inquiry'); break;
                                        case 3: openModal('coupon'); break;
                                        case 4: openModal('point'); break;
                                    }
                                }}
                                className="items-center flex-1"
                            >
                                {/* Open Icon Wrapper - No background box */}
                                <View className="h-10 items-center justify-center mb-2">
                                    <Ionicons name={stat.icon as any} size={28} color={stat.color} />
                                </View>

                                <View className="items-center">
                                    <Text className="text-[10px] text-gray-400 font-bold mb-1 tracking-tighter" numberOfLines={1}>{stat.label}</Text>
                                    <View className="flex-row items-baseline justify-center">
                                        <Text className="text-[16px] font-bold text-gray-900">{stat.value}</Text>
                                        {stat.unit ? <Text className="text-[10px] font-bold text-gray-900 ml-0.5">{stat.unit}</Text> : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 3. Order Status Tracker */}
                <View className="mx-6 mt-6 bg-white p-5 rounded-2xl shadow-sm">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="font-bold text-lg text-gray-900">주문 / 배송조회</Text>
                        <TouchableOpacity onPress={onDeliveryPress}>
                            <Text className="text-xs text-gray-400">전체보기 {'>'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between items-center px-2">
                        {orderSteps.map((step, index) => (
                            <View key={index} className="items-center gap-2 relative">
                                {/* Line Connector */}
                                {index < orderSteps.length - 1 && (
                                    <View className="absolute top-5 left-[60%] w-full h-[1px] bg-gray-100 -z-10" />
                                )}

                                <View className="relative">
                                    <Ionicons name={step.icon as any} size={28} color={step.count > 0 ? "#00D182" : "#D1D5DB"} />
                                    {step.count > 0 && (
                                        <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center">
                                            <Text className="text-white text-[9px] font-bold">{step.count}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className={`text-xs ${step.count > 0 ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>{step.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 3.5. 주문 관리 */}
                <View className="mx-6 mt-6 bg-white p-5 rounded-2xl shadow-sm">
                    <View className="flex-row justify-between items-center mb-5">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="receipt-outline" size={20} color="#00D182" />
                            <Text className="font-bold text-lg text-gray-900">주문 관리</Text>
                        </View>
                        <TouchableOpacity onPress={() => openModal('orders')}>
                            <Text className="text-xs text-gray-400">전체보기 {'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="gap-3">
                        {managedOrders.slice(0, 2).map(order => {
                            const isDelivered = order.status === '배송완료';
                            const isInTransit = order.status === '배송중';
                            const isConfirmed = order.status === '구매확정';
                            const statusColor = isConfirmed ? '#10B981' : isDelivered ? '#3B82F6' : isInTransit ? '#F59E0B' : '#9CA3AF';
                            return (
                                <View key={order.id} style={{ borderWidth: 1.5, borderColor: isDelivered ? '#BFDBFE' : '#F3F4F6', borderRadius: 16, padding: 14, backgroundColor: isDelivered ? '#EFF6FF' : 'white' }}>
                                    {/* 상단 */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{order.date} · {order.id}</Text>
                                        <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                                            <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}>{order.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 2 }} numberOfLines={1}>
                                        {order.items[0]}{order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}
                                    </Text>
                                    <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: isDelivered ? 12 : 0 }}>{order.total}</Text>

                                    {/* 배송완료 주문 → 구매확정 + 교환/반품 버튼 */}
                                    {isDelivered && (
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity
                                                onPress={() => handleConfirmPurchase(order.id)}
                                                style={{ flex: 1, backgroundColor: '#00D182', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>구매 확정</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => { setReturnModalOrder(order); setReturnType('반품'); setReturnReason(''); }}
                                                style={{ flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white' }}
                                            >
                                                <Text style={{ color: '#6B7280', fontWeight: 'bold', fontSize: 13 }}>교환/반품</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 4. Menu Sections */}
                <View className="px-6 mt-6 mb-24 gap-4">
                    {/* Shopping Info */}
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">쇼핑 정보</Text></View>
                        <MenuItem label="주문/배송 내역" icon="list-outline" onPress={() => openModal('orders')} />
                        <MenuItem label="취소/반품/교환 내역" icon="refresh-outline" onPress={() => openModal('returns')} />
                        <MenuItem label="결제수단 관리" icon="card-outline" isNew onPress={() => setIsPaymentModalVisible(true)} />
                        <MenuItem label="배송지 관리" icon="map-outline" onPress={() => setIsAddressModalVisible(true)} />
                    </View>

                    {/* My Activity */}
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">내 활동</Text></View>
                        <MenuItem label="내 화장대 전체보기" icon="albums-outline" onPress={onCabinetPress} />
                        <MenuItem
                            label="작성 가능한 리뷰"
                            icon="create-outline"
                            badge={writableReviewItems.length}
                            onPress={() => openModal('writableReviews')}
                        />
                        <MenuItem label="내 작성 리뷰" icon="documents-outline" onPress={() => openModal('myReviews')} />
                        <MenuItem label="1:1 문의 내역" icon="chatbox-ellipses-outline" onPress={() => openModal('inquiry')} />
                    </View>

                    {/* App Info & Account */}
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">설정</Text></View>
                        <MenuItem label="알림 설정" icon="notifications-outline" hasSwitch />
                        <MenuItem label="공지사항" icon="megaphone-outline" onPress={() => openModal('notice')} />
                        <MenuItem label="로그아웃" icon="log-out-outline" onPress={onLogout} isDestructive />
                    </View>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setIsEditModalVisible(false)}
                    className="flex-1 bg-black/50 justify-center items-center px-6"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="bg-white w-full rounded-2xl p-6"
                    >
                        <Text className="text-xl font-bold text-gray-900 mb-6">프로필 정보 수정</Text>

                        <Text className="text-xs text-gray-500 font-bold mb-2">닉네임</Text>
                        <View className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-6">
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                className="text-base text-gray-900 font-bold"
                                placeholder="닉네임을 입력하세요"
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setIsEditModalVisible(false)}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold">취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                className="flex-1 py-3.5 bg-clony-primary rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">저장</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* 결제수단 관리 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isPaymentModalVisible}
                onRequestClose={() => setIsPaymentModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl px-6 pt-4 pb-10" style={{ maxHeight: '85%' }}>
                        {/* Handle Bar */}
                        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">결제수단 관리</Text>
                            <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* 등록된 카드 목록 */}
                            {cards.length > 0 ? (
                                <View className="gap-3 mb-6">
                                    {cards.map((card) => (
                                        <View
                                            key={card.id}
                                            style={{ backgroundColor: card.color }}
                                            className="rounded-2xl p-5 relative overflow-hidden"
                                        >
                                            {/* 카드 배경 장식 */}
                                            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                                            <View style={{ position: 'absolute', bottom: -30, right: 20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />

                                            <View className="flex-row justify-between items-start mb-6">
                                                <View>
                                                    <Text className="text-white/60 text-xs mb-1">{card.bank}</Text>
                                                    {card.isDefault && (
                                                        <View className="bg-clony-primary/80 px-2 py-0.5 rounded-full self-start">
                                                            <Text className="text-white text-[10px] font-bold">기본 결제수단</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-row gap-2">
                                                    {!card.isDefault && (
                                                        <TouchableOpacity
                                                            onPress={() => handleSetDefault(card.id)}
                                                            className="bg-white/20 px-3 py-1 rounded-full"
                                                        >
                                                            <Text className="text-white text-xs">기본 설정</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteCard(card.id)}
                                                        className="bg-red-500/80 w-7 h-7 rounded-full items-center justify-center"
                                                    >
                                                        <Ionicons name="trash-outline" size={14} color="white" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <Text className="text-white/50 text-xs tracking-widest mb-1">•••• •••• •••• {card.last4}</Text>
                                            <View className="flex-row justify-between items-center">
                                                <Text className="text-white font-bold text-lg tracking-widest">**** {card.last4}</Text>
                                                <Ionicons name="card" size={28} color="rgba(255,255,255,0.6)" />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View className="items-center py-10 mb-6">
                                    <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                                        <Ionicons name="card-outline" size={32} color="#9CA3AF" />
                                    </View>
                                    <Text className="text-gray-400 font-bold">등록된 결제수단이 없습니다</Text>
                                    <Text className="text-gray-300 text-xs mt-1">카드를 추가해 빠르게 결제하세요</Text>
                                </View>
                            )}

                            {/* 카드 추가 폼 */}
                            {isAddCardVisible ? (
                                <View className="bg-gray-50 rounded-2xl p-5 mb-4">
                                    <Text className="font-bold text-gray-900 mb-4">새 카드 등록</Text>
                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">카드사 / 은행명</Text>
                                            <TextInput
                                                value={newCardName}
                                                onChangeText={setNewCardName}
                                                placeholder="예: 신한카드"
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">카드 번호</Text>
                                            <TextInput
                                                value={newCardNumber}
                                                onChangeText={setNewCardNumber}
                                                placeholder="0000 0000 0000 0000"
                                                placeholderTextColor="#D1D5DB"
                                                keyboardType="numeric"
                                                maxLength={19}
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">유효기간</Text>
                                            <TextInput
                                                value={newCardExpiry}
                                                onChangeText={setNewCardExpiry}
                                                placeholder="MM / YY"
                                                placeholderTextColor="#D1D5DB"
                                                keyboardType="numeric"
                                                maxLength={5}
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-row gap-3 mt-4">
                                        <TouchableOpacity
                                            onPress={() => setIsAddCardVisible(false)}
                                            className="flex-1 py-3 bg-gray-200 rounded-xl items-center"
                                        >
                                            <Text className="text-gray-600 font-bold">취소</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleAddCard}
                                            className="flex-1 py-3 bg-clony-primary rounded-xl items-center"
                                        >
                                            <Text className="text-white font-bold">등록</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsAddCardVisible(true)}
                                    className="flex-row items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 mb-4"
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#00D182" />
                                    <Text className="text-clony-primary font-bold">새 카드 추가</Text>
                                </TouchableOpacity>
                            )}

                            {/* 안내 문구 */}
                            <View className="bg-blue-50 rounded-xl p-4 flex-row gap-3">
                                <Ionicons name="shield-checkmark-outline" size={18} color="#3B82F6" />
                                <Text className="text-blue-600 text-xs flex-1 leading-5">카드 정보는 암호화되어 안전하게 저장됩니다. Clony는 카드 번호 전체를 저장하지 않습니다.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 배송지 관리 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isAddressModalVisible}
                onRequestClose={() => { setIsAddressModalVisible(false); setIsAddAddressVisible(false); }}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl px-6 pt-4 pb-10" style={{ maxHeight: '90%' }}>
                        {/* Handle Bar */}
                        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">배송지 관리</Text>
                            <TouchableOpacity onPress={() => { setIsAddressModalVisible(false); setIsAddAddressVisible(false); }}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* 배송지 목록 */}
                            {addresses.length > 0 ? (
                                <View className="gap-3 mb-5">
                                    {addresses.map((addr) => (
                                        <View key={addr.id} className={`rounded-2xl border-2 p-4 ${addr.isDefault ? 'border-clony-primary bg-green-50/40' : 'border-gray-100 bg-white'}`}>
                                            {/* 상단: 라벨 + 기본배송지 뱃지 + 버튼들 */}
                                            <View className="flex-row justify-between items-start mb-3">
                                                <View className="flex-row items-center gap-2">
                                                    <View className={`px-2.5 py-1 rounded-full ${addr.isDefault ? 'bg-clony-primary' : 'bg-gray-100'}`}>
                                                        <Text className={`text-xs font-bold ${addr.isDefault ? 'text-white' : 'text-gray-500'}`}>{addr.name || '배송지'}</Text>
                                                    </View>
                                                    {addr.isDefault && (
                                                        <View className="bg-clony-primary/10 px-2 py-0.5 rounded-full">
                                                            <Text className="text-clony-primary text-[10px] font-bold">기본 배송지</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-row gap-2">
                                                    <TouchableOpacity
                                                        onPress={() => handleOpenAddAddress(addr)}
                                                        className="bg-gray-100 px-3 py-1.5 rounded-full"
                                                    >
                                                        <Text className="text-gray-600 text-xs font-bold">수정</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteAddress(addr.id)}
                                                        className="bg-red-50 px-3 py-1.5 rounded-full"
                                                    >
                                                        <Text className="text-red-500 text-xs font-bold">삭제</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            {/* 수령인 / 연락처 */}
                                            <View className="flex-row items-center gap-2 mb-1.5">
                                                <Ionicons name="person-outline" size={13} color="#6B7280" />
                                                <Text className="text-sm font-bold text-gray-800">{addr.recipient}</Text>
                                                <Text className="text-gray-300">|</Text>
                                                <Text className="text-sm text-gray-500">{addr.phone}</Text>
                                            </View>

                                            {/* 주소 */}
                                            <View className="flex-row items-start gap-2 mb-3">
                                                <Ionicons name="location-outline" size={13} color="#6B7280" style={{ marginTop: 2 }} />
                                                <Text className="text-sm text-gray-700 flex-1 leading-5">{addr.address}{addr.detail ? `\n${addr.detail}` : ''}</Text>
                                            </View>

                                            {/* 기본 배송지 설정 버튼 */}
                                            {!addr.isDefault && (
                                                <TouchableOpacity
                                                    onPress={() => handleSetDefaultAddress(addr.id)}
                                                    className="border border-gray-200 rounded-xl py-2.5 items-center"
                                                >
                                                    <Text className="text-gray-500 text-xs font-bold">기본 배송지로 설정</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View className="items-center py-10 mb-5">
                                    <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                                        <Ionicons name="map-outline" size={32} color="#9CA3AF" />
                                    </View>
                                    <Text className="text-gray-400 font-bold">등록된 배송지가 없습니다</Text>
                                    <Text className="text-gray-300 text-xs mt-1">자주 쓰는 배송지를 등록해보세요</Text>
                                </View>
                            )}

                            {/* 새 배송지 추가 폼 */}
                            {isAddAddressVisible ? (
                                <View className="bg-gray-50 rounded-2xl p-5 mb-4">
                                    <Text className="font-bold text-gray-900 mb-4">{editingAddress ? '배송지 수정' : '새 배송지 추가'}</Text>
                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">배송지 이름 (선택)</Text>
                                            <TextInput
                                                value={addrForm.name}
                                                onChangeText={v => setAddrForm(f => ({ ...f, name: v }))}
                                                placeholder="예: 집, 회사"
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View className="flex-row gap-2">
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 font-bold mb-1">수령인 *</Text>
                                                <TextInput
                                                    value={addrForm.recipient}
                                                    onChangeText={v => setAddrForm(f => ({ ...f, recipient: v }))}
                                                    placeholder="홍길동"
                                                    placeholderTextColor="#D1D5DB"
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 font-bold mb-1">연락처 *</Text>
                                                <TextInput
                                                    value={addrForm.phone}
                                                    onChangeText={v => setAddrForm(f => ({ ...f, phone: v }))}
                                                    placeholder="010-0000-0000"
                                                    placeholderTextColor="#D1D5DB"
                                                    keyboardType="phone-pad"
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                                />
                                            </View>
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">주소 *</Text>
                                            <TextInput
                                                value={addrForm.address}
                                                onChangeText={v => setAddrForm(f => ({ ...f, address: v }))}
                                                placeholder="도로명 주소를 입력하세요"
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">상세 주소</Text>
                                            <TextInput
                                                value={addrForm.detail}
                                                onChangeText={v => setAddrForm(f => ({ ...f, detail: v }))}
                                                placeholder="동/호수, 층 등"
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-row gap-3 mt-4">
                                        <TouchableOpacity
                                            onPress={() => { setIsAddAddressVisible(false); setEditingAddress(null); }}
                                            className="flex-1 py-3 bg-gray-200 rounded-xl items-center"
                                        >
                                            <Text className="text-gray-600 font-bold">취소</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSaveAddress}
                                            className="flex-1 py-3 bg-clony-primary rounded-xl items-center"
                                        >
                                            <Text className="text-white font-bold">{editingAddress ? '수정 완료' : '추가'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => handleOpenAddAddress()}
                                    className="flex-row items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 mb-4"
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#00D182" />
                                    <Text className="text-clony-primary font-bold">새 배송지 추가</Text>
                                </TouchableOpacity>
                            )}

                            {/* 안내 */}
                            <View className="bg-amber-50 rounded-xl p-4 flex-row gap-3">
                                <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
                                <Text className="text-amber-700 text-xs flex-1 leading-5">최대 10개의 배송지를 저장할 수 있습니다. 기본 배송지는 주문 시 자동으로 선택됩니다.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 6개 서브 화면 모달 */}
            <OrderHistoryModal visible={activeModal === 'orders'} onClose={closeModal} orders={managedOrders} />
            <ReturnHistoryModal visible={activeModal === 'returns'} onClose={closeModal} returns={returnHistory} />
            <WritableReviewsModal
                visible={activeModal === 'writableReviews'}
                onClose={closeModal}
                items={writableReviewItems}
                setWritableReviewItems={setWritableReviewItems}
                setMyReviews={setMyReviews}
                setPointHistory={setPointHistory}
            />
            <MyReviewsModal visible={activeModal === 'myReviews'} onClose={closeModal} reviews={myReviews} />
            <InquiryModal
                visible={activeModal === 'inquiry'}
                onClose={closeModal}
                inquiries={inquiries}
                setInquiries={setInquiries}
                inquiryText={inquiryText}
                setInquiryText={setInquiryText}
                inquiryCategory={inquiryCategory}
                setInquiryCategory={setInquiryCategory}
                expandedInquiry={expandedInquiry}
                setExpandedInquiry={setExpandedInquiry}
            />
            <NoticeModal visible={activeModal === 'notice'} onClose={closeModal} notices={notices} />
            <CouponModal visible={activeModal === 'coupon'} onClose={closeModal} coupons={myCoupons} />
            <PointModal visible={activeModal === 'point'} onClose={closeModal} history={pointHistory} totalPoints={calculatedPoints} />
            <WishlistModal visible={activeModal === 'wishlist'} onClose={closeModal} wishlist={wishlist} onToggle={toggleWishlist} onAddCart={addToCart} />

            {/* 교환/반품 신청 모달 */}
            <Modal animationType="slide" transparent visible={!!returnModalOrder} onRequestClose={() => setReturnModalOrder(null)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                        <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>교환/반품 신청</Text>
                        {returnModalOrder && <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }} numberOfLines={1}>{returnModalOrder.items[0]}{returnModalOrder.items.length > 1 ? ` 외 ${returnModalOrder.items.length - 1}건` : ''}</Text>}

                        {/* 유형 선택 */}
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 10 }}>신청 유형</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            {(['반품', '교환'] as const).map(t => (
                                <TouchableOpacity key={t} onPress={() => setReturnType(t)}
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: returnType === t ? '#111827' : '#F3F4F6' }}>
                                    <Text style={{ color: returnType === t ? 'white' : '#6B7280', fontWeight: 'bold' }}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 사유 선택 */}
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 10 }}>신청 사유 *</Text>
                        <View style={{ gap: 8, marginBottom: 24 }}>
                            {returnReasons.map(r => (
                                <TouchableOpacity key={r} onPress={() => setReturnReason(r)}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: returnReason === r ? '#00D182' : '#F3F4F6', backgroundColor: returnReason === r ? '#F0FDF4' : 'white' }}>
                                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: returnReason === r ? '#00D182' : '#D1D5DB', backgroundColor: returnReason === r ? '#00D182' : 'white', alignItems: 'center', justifyContent: 'center' }}>
                                        {returnReason === r && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                                    </View>
                                    <Text style={{ color: '#374151', fontWeight: returnReason === r ? 'bold' : 'normal' }}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 안내 */}
                        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                            <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
                            <Text style={{ color: '#92400E', fontSize: 12, flex: 1 }}>수령 후 7일 이내 신청 가능합니다. 단순 변심의 경우 왕복 배송비가 부과됩니다.</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setReturnModalOrder(null)}
                                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmitReturn}
                                style={{ flex: 1, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>신청하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* 구매 확정 확인 모달 */}
            <Modal
                transparent={true}
                visible={isConfirmPurchaseVisible}
                animationType="fade"
                onRequestClose={() => setIsConfirmPurchaseVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-2xl p-6 items-center shadow-2xl">
                        <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                            <Ionicons name="gift" size={32} color="#3B82F6" />
                        </View>
                        <Text className="text-xl font-bold text-gray-900 mb-2">구매를 확정하시겠습니까?</Text>
                        <Text className="text-gray-500 text-center mb-6 text-sm">
                            구매 확정 후에는 교환/반품이 어렵습니다.{"\n"}
                            상품을 꼼꼼히 확인하셨나요?
                        </Text>
                        {confirmTargetId && (() => {
                            const targetOrder = managedOrders.find(o => o.id === confirmTargetId);
                            if (!targetOrder) return null;
                            return (
                                <View className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-100">
                                    <Text className="font-bold text-gray-800 mb-1" numberOfLines={1}>
                                        {targetOrder.items[0]}{targetOrder.items.length > 1 ? ` 외 ${targetOrder.items.length - 1}건` : ''}
                                    </Text>
                                    <Text className="text-xs text-gray-500">{targetOrder.date} 주문</Text>
                                </View>
                            );
                        })()}

                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity
                                onPress={() => setIsConfirmPurchaseVisible(false)}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold text-base">취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmPurchaseAction}
                                className="flex-1 py-3.5 bg-clony-primary rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-base">확정하기</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

// Helper Component for Menu Items
const MenuItem = ({ label, icon, badge, isNew, hasSwitch, isDestructive, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-4 active:bg-gray-50">
        <View className="flex-row items-center gap-3">
            <Ionicons name={icon} size={20} color={isDestructive ? "#EF4444" : "#4B5563"} />
            <Text className={`text-sm ${isDestructive ? 'text-red-500 font-bold' : 'text-gray-700'}`}>{label}</Text>
            {isNew && <View className="bg-red-500 px-1.5 py-0.5 rounded"><Text className="text-white text-[10px] font-bold">N</Text></View>}
        </View>
        <View className="flex-row items-center gap-2">
            {badge && <View className="bg-clony-primary px-2 py-0.5 rounded-full"><Text className="text-white text-xs font-bold">{badge}</Text></View>}
            {hasSwitch ? <Switch value={true} trackColor={{ true: '#00D182' }} /> : <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
        </View>
    </TouchableOpacity>
);

// ─── 공통 바텀시트 래퍼 ───────────────────────────────────────────────────────
const BottomSheet = ({ visible, onClose, title, children }: any) => (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, maxHeight: '90%' }}>
                <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{title}</Text>
                    <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#9CA3AF" /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
            </View>
        </View>
    </Modal>
);

// ─── 주문/배송 내역 ───────────────────────────────────────────────────────────
const OrderHistoryModal = ({ visible, onClose, orders }: any) => {
    const [expanded, setExpanded] = useState<string | null>(null);
    return (
        <BottomSheet visible={visible} onClose={onClose} title="주문/배송 내역">
            {orders.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="bag-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>주문 내역이 없습니다</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {orders.map((order: any) => (
                        <TouchableOpacity key={order.id} onPress={() => setExpanded(expanded === order.id ? null : order.id)}
                            style={{ borderWidth: 1.5, borderColor: expanded === order.id ? '#00D182' : '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <View>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{order.date} · {order.id}</Text>
                                    <Text style={{ fontWeight: 'bold', color: '#111827' }} numberOfLines={1}>{order.items[0]}{order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}</Text>
                                </View>
                                {(() => {
                                    const isConfirmed = order.status === '구매확정';
                                    const isDelivered = order.status === '배송완료';
                                    const isInTransit = order.status === '배송중';
                                    const statusColor = isConfirmed ? '#10B981' : isDelivered ? '#3B82F6' : isInTransit ? '#F59E0B' : '#9CA3AF';
                                    return (
                                        <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                            <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}>{order.status}</Text>
                                        </View>
                                    );
                                })()}
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', color: '#111827' }}>{order.total}</Text>
                                <Ionicons name={expanded === order.id ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                            </View>
                            {expanded === order.id && (
                                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 6 }}>
                                    {order.items.map((item: any, i: number) => <Text key={i} style={{ color: '#6B7280', fontSize: 13 }}>• {item}</Text>)}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 }}>
                                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                                        <Text style={{ color: '#6B7280', fontSize: 12 }}>운송장: {order.trackingNo}</Text>
                                    </View>
                                    <TouchableOpacity style={{ marginTop: 8, borderWidth: 1, borderColor: '#00D182', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                                        <Text style={{ color: '#00D182', fontWeight: 'bold', fontSize: 13 }}>배송 조회</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </BottomSheet>
    );
};

// ─── 취소/반품/교환 내역 ──────────────────────────────────────────────────────
const ReturnHistoryModal = ({ visible, onClose, returns }: any) => {
    const typeColor: any = { '취소': '#6B7280', '반품': '#EF4444', '교환': '#3B82F6' };
    return (
        <BottomSheet visible={visible} onClose={onClose} title="취소/반품/교환 내역">
            {returns.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="refresh-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>내역이 없습니다</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {returns.map((r: any) => (
                        <View key={r.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: (typeColor[r.type] || '#6B7280') + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                        <Text style={{ color: typeColor[r.type] || '#6B7280', fontSize: 12, fontWeight: 'bold' }}>{r.type}</Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{r.date}</Text>
                                </View>
                                <View style={{ backgroundColor: r.statusColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                    <Text style={{ color: r.statusColor, fontSize: 12, fontWeight: 'bold' }}>{r.status}</Text>
                                </View>
                            </View>
                            <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{r.item}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>사유: {r.reason}</Text>
                            {r.refund !== '-' && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 }}>
                                    <Text style={{ color: '#6B7280', fontSize: 13 }}>환불 예정 금액</Text>
                                    <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>{r.refund}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </BottomSheet>
    );
};

// ─── 작성 가능한 리뷰 ─────────────────────────────────────────────────────────
const WritableReviewsModal = ({ visible, onClose, items, setWritableReviewItems, setMyReviews, setPointHistory }: any) => {
    const [writtenIds, setWrittenIds] = useState<string[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);
    const [writingId, setWritingId] = useState<string | null>(null);

    const pending = items.filter((i: any) => !writtenIds.includes(i.id));
    const handleSubmit = (item: any) => {
        if (!reviewText.trim()) { Alert.alert('알림', '리뷰 내용을 입력해주세요.'); return; }

        // 실제 리뷰 리스트에 추가
        const newReview = {
            id: Date.now().toString(),
            name: item.name,
            brand: item.brand,
            date: new Date().toISOString().split('T')[0],
            rating: rating,
            content: reviewText,
            helpful: 0,
            image: item.image
        };

        setMyReviews((prev: any) => [newReview, ...prev]);
        setWritableReviewItems((prev: any) => prev.filter((i: any) => i.id !== item.id));

        // 포인트 적립 추가
        setPointHistory((prev: any) => [{
            id: Date.now().toString(),
            type: 'earn',
            title: '리뷰 작성 적립',
            amount: 500,
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
        }, ...prev]);

        setWrittenIds(p => [...p, item.id]);
        setWritingId(null);
        setReviewText('');
        setRating(5);
        Alert.alert('완료', '리뷰가 등록되었습니다! 포인트 500P가 적립됩니다. 🎉');
    };
    return (
        <BottomSheet visible={visible} onClose={onClose} title={`작성 가능한 리뷰 (${pending.length})`}>
            {pending.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#00D182" />
                    <Text style={{ color: '#111827', marginTop: 12, fontWeight: 'bold' }}>모든 리뷰를 작성했어요!</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>소중한 리뷰 감사합니다 💚</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                        <Ionicons name="gift-outline" size={16} color="#10B981" />
                        <Text style={{ color: '#10B981', fontSize: 12, flex: 1 }}>리뷰 작성 시 건당 <Text style={{ fontWeight: 'bold' }}>500P</Text> 적립! 마감일 전에 작성해주세요.</Text>
                    </View>
                    {pending.map((item: any) => (
                        <View key={item.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Image source={item.image} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>{item.name}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{item.brand}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>마감: {item.deadline}</Text>
                                </View>
                            </View>
                            {writingId === item.id ? (
                                <View style={{ gap: 10 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                                <Ionicons name={s <= rating ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        value={reviewText} onChangeText={setReviewText}
                                        placeholder="솔직한 사용 후기를 남겨주세요 (최소 20자)"
                                        placeholderTextColor="#D1D5DB"
                                        multiline numberOfLines={4}
                                        style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, color: '#111827', fontSize: 13, minHeight: 90, textAlignVertical: 'top' }}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity onPress={() => setWritingId(null)} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                                            <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>취소</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleSubmit(item)} style={{ flex: 1, backgroundColor: '#00D182', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>등록</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setWritingId(item.id)}
                                    style={{ backgroundColor: '#00D182', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>리뷰 작성하기</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </BottomSheet>
    );
};

// ─── 내 작성 리뷰 ─────────────────────────────────────────────────────────────
const MyReviewsModal = ({ visible, onClose, reviews }: any) => {
    return (
        <BottomSheet visible={visible} onClose={onClose} title={`내 작성 리뷰 (${reviews.length})`}>
            {reviews.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>작성한 리뷰가 없습니다</Text>
                </View>
            ) : (
                <View style={{ gap: 16, paddingBottom: 16 }}>
                    {reviews.map((r: any) => (
                        <View key={r.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Image source={r.image} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#111827' }}>{r.name}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{r.brand} · {r.date}</Text>
                                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                        {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={14} color="#F59E0B" />)}
                                    </View>
                                </View>
                            </View>
                            <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20, marginBottom: 10 }}>{r.content}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="thumbs-up-outline" size={14} color="#9CA3AF" />
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>도움이 됐어요 {r.helpful}</Text>
                                </View>
                                <TouchableOpacity style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: 'bold' }}>수정</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </BottomSheet>
    );
};

// ─── 1:1 문의 내역 ────────────────────────────────────────────────────────────
const InquiryModal = ({ visible, onClose, inquiries, setInquiries, inquiryText, setInquiryText, inquiryCategory, setInquiryCategory, expandedInquiry, setExpandedInquiry }: any) => {
    const [isWriting, setIsWriting] = useState(false);
    const categories = ['배송', '상품', '결제', '교환/반품', '기타'];
    const handleSubmit = () => {
        if (!inquiryText.trim()) { Alert.alert('알림', '문의 내용을 입력해주세요.'); return; }
        setInquiries((p: any[]) => [{ id: Date.now().toString(), category: inquiryCategory, title: inquiryText.slice(0, 20) + (inquiryText.length > 20 ? '...' : ''), date: new Date().toISOString().slice(0, 10), status: '답변대기', answer: '' }, ...p]);
        setInquiryText('');
        setIsWriting(false);
        Alert.alert('접수 완료', '문의가 접수되었습니다. 1-2 영업일 내 답변드립니다.');
    };
    return (
        <BottomSheet visible={visible} onClose={onClose} title="1:1 문의 내역">
            {!isWriting ? (
                <View style={{ paddingBottom: 16 }}>
                    <TouchableOpacity onPress={() => setIsWriting(true)}
                        style={{ backgroundColor: '#00D182', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <Ionicons name="add-circle-outline" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>새 문의 작성</Text>
                    </TouchableOpacity>
                    {inquiries.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Ionicons name="chatbox-ellipses-outline" size={48} color="#D1D5DB" />
                            <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>문의 내역이 없습니다</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {inquiries.map((inq: any) => (
                                <TouchableOpacity key={inq.id} onPress={() => setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id)}
                                    style={{ borderWidth: 1.5, borderColor: expandedInquiry === inq.id ? '#00D182' : '#F3F4F6', borderRadius: 14, padding: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                                                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: 'bold' }}>{inq.category}</Text>
                                            </View>
                                            <Text style={{ fontWeight: 'bold', color: '#111827', flex: 1 }} numberOfLines={1}>{inq.title}</Text>
                                        </View>
                                        <View style={{ backgroundColor: inq.status === '답변완료' ? '#D1FAE5' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 8 }}>
                                            <Text style={{ color: inq.status === '답변완료' ? '#10B981' : '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>{inq.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{inq.date}</Text>
                                    {expandedInquiry === inq.id && inq.answer ? (
                                        <View style={{ marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12 }}>
                                            <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>💬 답변</Text>
                                            <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20 }}>{inq.answer}</Text>
                                        </View>
                                    ) : expandedInquiry === inq.id && !inq.answer ? (
                                        <View style={{ marginTop: 12, backgroundColor: '#FEF9C3', borderRadius: 10, padding: 12 }}>
                                            <Text style={{ color: '#92400E', fontSize: 12 }}>아직 답변이 등록되지 않았습니다. 빠른 시일 내 답변드리겠습니다.</Text>
                                        </View>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={{ paddingBottom: 16, gap: 14 }}>
                    <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>새 문의 작성</Text>
                    <View>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>문의 유형</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {categories.map(c => (
                                    <TouchableOpacity key={c} onPress={() => setInquiryCategory(c)}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: inquiryCategory === c ? '#00D182' : '#F3F4F6' }}>
                                        <Text style={{ color: inquiryCategory === c ? 'white' : '#6B7280', fontWeight: 'bold', fontSize: 13 }}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>문의 내용 *</Text>
                        <TextInput
                            value={inquiryText} onChangeText={setInquiryText}
                            placeholder="문의하실 내용을 자세히 입력해주세요."
                            placeholderTextColor="#D1D5DB"
                            multiline numberOfLines={5}
                            style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, color: '#111827', fontSize: 13, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' }}
                        />
                    </View>
                    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8 }}>
                        <Ionicons name="time-outline" size={16} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontSize: 12, flex: 1 }}>평균 답변 시간: 1-2 영업일 (주말/공휴일 제외)</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setIsWriting(false)} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                            <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} style={{ flex: 1, backgroundColor: '#00D182', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>접수하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </BottomSheet>
    );
};


// ─── MyScreen에 모달 렌더링 추가 ─────────────────────────────────────────────
// (MyScreen 컴포넌트 내부 return 블록 끝에 추가하기 위해 MyScreen을 수정)

// ─── 공지사항 ─────────────────────────────────────────────────────────────────
const NoticeModal = ({ visible, onClose, notices }: any) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <BottomSheet visible={visible} onClose={onClose} title="공지사항">
            {notices.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>등록된 공지사항이 없습니다</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {notices.map((notice: any) => (
                        <TouchableOpacity key={notice.id} onPress={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                            style={{ borderWidth: 1.5, borderColor: expandedId === notice.id ? '#00D182' : '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                                    <View style={{ backgroundColor: notice.category === '업데이트' ? '#E0F2FE' : notice.category === '점검' ? '#FEF3C7' : '#FCE7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                                        <Text style={{ color: notice.category === '업데이트' ? '#0284C7' : notice.category === '점검' ? '#D97706' : '#DB2777', fontSize: 11, fontWeight: 'bold' }}>{notice.category}</Text>
                                    </View>
                                    <Text style={{ fontWeight: 'bold', color: '#111827', flex: 1, fontSize: 15 }} numberOfLines={1}>{notice.title}</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: expandedId === notice.id ? 12 : 0 }}>{notice.date}</Text>

                            {expandedId === notice.id && (
                                <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                                    <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>{notice.content}</Text>
                                </View>
                            )}

                            <View style={{ position: 'absolute', right: 16, top: 16 }}>
                                <Ionicons name={expandedId === notice.id ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </BottomSheet>
    );
};


// ─── 쿠폰함 ───────────────────────────────────────────────────────────────────
const CouponModal = ({ visible, onClose, coupons }: any) => {
    return (
        <BottomSheet visible={visible} onClose={onClose} title="나의 쿠폰함">
            <View style={{ gap: 12, paddingBottom: 16 }}>
                {coupons.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>보유하신 쿠폰이 없습니다</Text>
                    </View>
                ) : (
                    coupons.map((c: any) => (
                        <View key={c.id} style={{
                            borderWidth: 1, borderColor: c.used ? '#E5E7EB' : '#00D182',
                            borderRadius: 16, padding: 20, backgroundColor: c.used ? '#F9FAFB' : '#F0FDF4',
                            opacity: c.used ? 0.6 : 1, position: 'relative', overflow: 'hidden'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.used ? '#9CA3AF' : '#111827' }}>{c.name}</Text>
                                {c.used && <View style={{ backgroundColor: '#D1D5DB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>사용완료</Text></View>}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: c.used ? '#9CA3AF' : '#00D182', marginBottom: 4 }}>{c.discount}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>{c.minOrder}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: c.used ? '#E5E7EB' : '#DCFCE7', paddingTop: 12 }}>
                                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                                <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>{c.expiry} 까지</Text>
                            </View>
                            {!c.used && (
                                <View style={{ position: 'absolute', right: -20, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', opacity: 0.5 }} />
                            )}
                        </View>
                    ))
                )}
            </View>
        </BottomSheet>
    );
};

// ─── 포인트 내역 ──────────────────────────────────────────────────────────────
const PointModal = ({ visible, onClose, history, totalPoints }: any) => {
    return (
        <BottomSheet visible={visible} onClose={onClose} title="포인트 내역">
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>현재 사용 가능 포인트</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00D182' }}>{totalPoints.toLocaleString()} P</Text>
            </View>
            <View style={{ gap: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                {history.map((h: any) => (
                    <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <View>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{h.title}</Text>
                            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{h.date}</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: h.type === 'earn' ? '#00D182' : '#EF4444' }}>
                            {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} P
                        </Text>
                    </View>
                ))}
            </View>
        </BottomSheet>
    );
};

// ─── 찜한 상품 ────────────────────────────────────────────────────────────────
const WishlistModal = ({ visible, onClose, wishlist, onToggle, onAddCart }: any) => {
    const getImageSource = (product: any) => {
        if (typeof product.imageUrl === 'number') return product.imageUrl;
        if (typeof product.imageUrl === 'string') {
            if (product.imageUrl.startsWith('http')) return { uri: product.imageUrl };
            return { uri: product.imageUrl };
        }
        return require('../assets/product_images/cream.png');
    };

    return (
        <BottomSheet visible={visible} onClose={onClose} title={`찜한 상품 (${(wishlist || []).length})`}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 }}>
                {(!wishlist || wishlist.length === 0) ? (
                    <View style={{ width: '100%', alignItems: 'center', paddingVertical: 48 }}>
                        <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>찜한 상품이 없습니다</Text>
                    </View>
                ) : (
                    wishlist.map((item: any) => (
                        <View key={item.id} style={{ width: '48%', backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' }}>
                            <Image source={getImageSource(item)} style={{ width: '100%', height: 140, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
                            <TouchableOpacity
                                onPress={() => onToggle(item)}
                                style={{ position: 'absolute', right: 10, top: 10, backgroundColor: 'white', borderRadius: 20, padding: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                            >
                                <Ionicons name="heart" size={18} color="#FF4757" />
                            </TouchableOpacity>
                            <View style={{ padding: 12 }}>
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>{item.brand || '화장품'}</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 6 }} numberOfLines={1}>{item.name}</Text>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                                    {item.price ? Number(String(item.price).replace(/[^0-9]/g, '')).toLocaleString() : '0'}원
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        onAddCart(item);
                                        Alert.alert('알림', '장바구니에 담겼습니다.');
                                    }}
                                    style={{ marginTop: 12, backgroundColor: '#111827', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}
                                >
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>장바구니 담기</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </BottomSheet>
    );
};

export default MyScreen;
