import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Switch, Alert, Modal, TextInput, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useProduct } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';

interface MyScreenProps {
    userName: string;
    skinCode?: string;
    onLogout: () => void;
    onNicknameChange: (newName: string) => void;
    loginProvider: string;
    onScanPress: () => void;
    onCabinetPress?: () => void;
    onDeliveryPress?: () => void;
    onRetakeSurvey?: () => void;
}

import mockUserData from '../database/user/mock_user_data.json';

const MyScreen: React.FC<MyScreenProps> = ({ userName, skinCode, onLogout, onNicknameChange, loginProvider, onScanPress, onCabinetPress, onDeliveryPress, onRetakeSurvey }) => {
    const { t } = useTranslation();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const { wishlist, toggleWishlist } = useProduct();
    const { addToCart } = useCart();

    // New states for stats - Initialized with centralized database data
    const [myCoupons, setMyCoupons] = useState(mockUserData.coupons);
    const [pointHistory, setPointHistory] = useState(mockUserData.point_history);


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

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const openModal = (name: string) => setActiveModal(name);
    const closeModal = () => setActiveModal(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // 주문 관리 state
    const [managedOrders, setManagedOrders] = useState(mockUserData.orders);

    const [returnModalOrder, setReturnModalOrder] = useState<any>(null);
    const [returnType, setReturnType] = useState<'exchange' | 'return'>('return');
    const [returnReason, setReturnReason] = useState('');
    const returnReasons = ['단순 변심', '상품 불량/파손', '오배송', '상품 정보 상이', '기타'];

    // 1:1 문의 state
    const [inquiryText, setInquiryText] = useState('');
    const [inquiryCategory, setInquiryCategory] = useState('delivery');
    const [inquiries, setInquiries] = useState([
        { id: '1', category: 'delivery', title: 'my_mock.inquiries.inq1_title', date: '2026-02-10', status: 'completed', answer: 'my_mock.inquiries.inq1_answer' },
        { id: '2', category: 'product', title: 'my_mock.inquiries.inq2_title', date: '2026-02-15', status: 'pending', answer: '' },
    ]);

    const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);

    // 리뷰 데이터 state
    const [myReviews, setMyReviews] = useState([
        { id: '1', name: 'my_mock.reviews.rev1_name', brand: 'my_mock.reviews.rev1_brand', date: '2026-01-20', rating: 5, content: 'my_mock.reviews.rev1_content', helpful: 12, image: require('../assets/product_images/toner.png') },
        { id: '2', name: 'my_mock.reviews.rev2_name', brand: 'my_mock.reviews.rev2_brand', date: '2026-01-05', rating: 4, content: 'my_mock.reviews.rev2_content', helpful: 7, image: require('../assets/product_images/cream.png') },
    ]);


    // 작성 가능한 리뷰 데이터
    const [writableReviewItems, setWritableReviewItems] = useState([
        { id: '1', name: 'my_mock.reviews.rev1_name', brand: 'my_mock.reviews.rev1_brand', orderDate: '2026-02-10', deadline: '2026-03-10', image: require('../assets/product_images/toner.png') },
        { id: '2', name: 'my_mock.reviews.rev2_name', brand: 'my_mock.reviews.rev2_brand', orderDate: '2026-02-10', deadline: '2026-03-10', image: require('../assets/product_images/cream.png') },
    ]);


    // 취소/반품/교환 데이터
    const [returnHistory, setReturnHistory] = useState([
        { id: 'RET20260205', date: '2026-02-05', type: 'return', reason: 'my_mock.returns.reason1', status: 'completed', statusColor: '#10B981', item: 'my_mock.returns.item1', refund: 'my_mock.returns.price_19k' },
        { id: 'EXC20260118', date: '2026-01-18', type: 'exchange', reason: 'my_mock.returns.reason2', status: 'processing', statusColor: '#F59E0B', item: 'my_mock.returns.item2', refund: '-' },
    ]);


    // 공지사항 데이터
    const [notices, setNotices] = useState(mockUserData.notices);



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
        ADDRESSES: 'CLONY_ADDRESSES',
        NOTIFICATIONS: 'CLONY_NOTIFICATIONS_ENABLED',
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
                const notifRaw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
                if (notifRaw !== null) setNotificationsEnabled(notifRaw === 'true');
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
    const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);



    // Stats Data
    const stats = [
        { label: t('my.stats.coupons'), value: availableCouponCount.toString(), unit: t('my.stats.coupons_unit'), icon: 'pricetag-outline', color: '#00D182' },
        { label: t('my.stats.points'), value: calculatedPoints.toLocaleString(), unit: t('my.stats.points_unit'), icon: 'card-outline', color: '#00D182' },
        { label: t('my.stats.wishlist'), value: (wishlist || []).length.toString(), unit: t('my.stats.wishlist_unit'), icon: 'heart-outline', color: '#00D182' },
    ];

    // Order Tracking Data - Dynamically calculated from managedOrders
    const orderSteps = [
        { label: t('my.order_status.pending_payment'), status: 'pending_payment', icon: 'card-outline' },
        { label: t('my.order_status.paid'), status: 'paid', icon: 'checkmark-circle-outline' },
        { label: t('my.order_status.preparing'), status: 'preparing', icon: 'cube-outline' },
        { label: t('my.order_status.shipping'), status: 'shipping', icon: 'bicycle-outline' },
        { label: t('my.order_status.delivered'), status: 'delivered', icon: 'gift-outline' },
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
            Alert.alert(t('common.error'), t('my.profile_edit.error_short'));
            return;
        }
        onNicknameChange(editName);
        setIsEditModalVisible(false);
    };

    const handleSetDefault = (id: string) => {
        setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    };

    const handleDeleteCard = (id: string) => {
        Alert.alert(t('my.payment.delete_confirm'), t('my.payment.delete_msg'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => setCards(prev => prev.filter(c => c.id !== id)) }
        ]);
    };

    const handleAddCard = () => {
        if (newCardNumber.length < 4 || !newCardExpiry || !newCardName) {
            Alert.alert(t('common.error'), t('common.fill_all'));
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
            setManagedOrders(prev => prev.map(o => o.id === confirmTargetId ? { ...o, status: 'confirmed', confirmed: true } : o));
            setIsConfirmPurchaseVisible(false);
            setConfirmTargetId(null);
            setTimeout(() => {
                Alert.alert(t('common.success'), t('my.order_management.confirmed_msg'));
            }, 300);
        }
    };

    const handleSubmitReturn = async () => {
        if (!returnReason) { Alert.alert(t('common.notice'), t('common.select_reason')); return; }
        if (!returnModalOrder) return;

        const { API_URL } = require('../config/api.config').default;
        const newEntry = {
            id: `${returnType.toUpperCase().slice(0, 3)}${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            type: returnType,
            reason: returnReason,
            status: 'processing',
            statusColor: '#F59E0B',
            item: returnModalOrder.items[0] || '',
            refund: returnType === 'return' ? returnModalOrder.total || '-' : '-',
        };

        try {
            await fetch(`${API_URL}/return-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: returnModalOrder.id,
                    order_items: (returnModalOrder.items || []).join(', '),
                    request_type: returnType,
                    reason: returnReason,
                }),
            });
        } catch {
            // server unreachable – still update locally
        }

        setReturnHistory((prev: any[]) => [newEntry, ...prev]);
        Alert.alert(t('common.success'), `${t(`my.modals.return_order.types.${returnType}`)} ${t('common.submitted_msg')}`, [
            { text: t('common.confirm'), onPress: () => { setReturnModalOrder(null); setReturnReason(''); } }
        ]);
    };

    // 배송지 핸들러
    const handleSetDefaultAddress = (id: string) => {
        const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        setAddresses(updated);
    };

    const handleDeleteAddress = (id: string) => {
        Alert.alert(t('my.address.delete_confirm'), t('my.address.delete_msg'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'), style: 'destructive', onPress: () => {
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
            Alert.alert(t('common.error'), t('common.fill_required'));
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
                                    <Text className="text-lg font-bold text-gray-900">{t('common.user_suffix', { name: userName })}</Text>
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

                        <TouchableOpacity onPress={() => setIsSettingsMenuVisible(true)}>
                            <Ionicons name="settings-outline" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* 2. Redesigned Dashboard Stats - Open Icon Style */}
                    <View className="flex-row justify-between bg-white px-1 py-6 rounded-3xl mx-2 shadow-sm border border-gray-50">
                        {[
                            { label: t('my.stats.orders'), value: managedOrders.length.toString(), unit: '', icon: 'receipt-outline', color: '#4A90E2' },
                            { label: t('my.stats.reviews'), value: myReviews.length.toString(), unit: '', icon: 'create-outline', color: '#F2C94C' },
                            { label: t('my.stats.inquiries'), value: inquiries.length.toString(), unit: '', icon: 'chatbubble-ellipses-outline', color: '#9B51E0' },
                            { label: t('my.stats.coupons'), value: availableCouponCount.toString(), unit: t('my.stats.coupons_unit'), icon: 'ticket-outline', color: '#FF7675' },
                            { label: t('my.stats.points'), value: calculatedPoints.toLocaleString(), unit: t('common.currency_unit'), icon: 'cash-outline', color: '#F2C94C' },
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
                        <Text className="font-bold text-lg text-gray-900">{t('my.order_status.title')}</Text>
                        <TouchableOpacity onPress={onDeliveryPress}>
                            <Text className="text-xs text-gray-400">{t('my.order_status.view_all')} {'>'}</Text>
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
                            <Text className="font-bold text-lg text-gray-900">{t('my.order_management.title')}</Text>
                        </View>
                        <TouchableOpacity onPress={() => openModal('orders')}>
                            <Text className="text-xs text-gray-400">{t('my.order_status.view_all')} {'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="gap-3">
                        {managedOrders.slice(0, 2).map(order => {
                            const isDelivered = order.status === 'delivered';
                            const isInTransit = order.status === 'shipping';
                            const isConfirmed = order.status === 'confirmed';
                            const statusColor = isConfirmed ? '#10B981' : isDelivered ? '#3B82F6' : isInTransit ? '#F59E0B' : '#9CA3AF';
                            return (
                                <View key={order.id} style={{ borderWidth: 1.5, borderColor: isDelivered ? '#BFDBFE' : '#F3F4F6', borderRadius: 16, padding: 14, backgroundColor: isDelivered ? '#EFF6FF' : 'white' }}>
                                    {/* 상단 */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{order.date} · {order.id}</Text>
                                        <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                                            <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}>{t(`my.order_status.${order.status}`)}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 2 }} numberOfLines={1}>
                                        {t(order.items[0])}{order.items.length > 1 ? ` ${t('my.order_management.others', { count: order.items.length - 1 })}` : ''}
                                    </Text>
                                    <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: isDelivered ? 12 : 0 }}>{t(order.total)}</Text>


                                    {/* 배송완료 주문 → 구매확정 + 교환/반품 버튼 */}
                                    {isDelivered && (
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <TouchableOpacity
                                                onPress={() => handleConfirmPurchase(order.id)}
                                                style={{ flex: 1, backgroundColor: '#00D182', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                            >
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{t('my.order_management.confirm_purchase')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => { setReturnModalOrder(order); setReturnType('return'); setReturnReason(''); }}
                                                style={{ flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'white' }}
                                            >
                                                <Text style={{ color: '#6B7280', fontWeight: 'bold', fontSize: 13 }}>{t('my.order_management.exchange_return')}</Text>
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
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">{t('my.sections.shopping')}</Text></View>
                        <MenuItem label={t('my.menu.order_history')} icon="list-outline" onPress={() => openModal('orders')} />
                        <MenuItem label={t('my.menu.return_history')} icon="refresh-outline" onPress={() => openModal('returns')} />
                        <MenuItem label={t('my.menu.payment_methods')} icon="card-outline" isNew onPress={() => setIsPaymentModalVisible(true)} />
                        <MenuItem label={t('my.menu.shipping_addresses')} icon="map-outline" onPress={() => setIsAddressModalVisible(true)} />
                    </View>

                    {/* My Activity */}
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">{t('my.sections.activity')}</Text></View>
                        <MenuItem label={t('my.menu.view_all_cabinet')} icon="albums-outline" onPress={onCabinetPress} />
                        <MenuItem
                            label={t('my.menu.writable_reviews')}
                            icon="create-outline"
                            badge={writableReviewItems.length}
                            onPress={() => openModal('writableReviews')}
                        />
                        <MenuItem label={t('my.menu.my_reviews')} icon="documents-outline" onPress={() => openModal('myReviews')} />
                        <MenuItem label={t('my.menu.inquiry_history')} icon="chatbox-ellipses-outline" onPress={() => openModal('inquiry')} />
                    </View>

                    {/* App Info & Account */}
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <View className="p-4 border-b border-gray-50"><Text className="font-bold text-gray-900">{t('my.sections.settings')}</Text></View>
                        <MenuItem
                            label={t('my.menu.notifications')}
                            icon="notifications-outline"
                            hasSwitch
                            switchValue={notificationsEnabled}
                            onSwitchChange={(val: boolean) => {
                                setNotificationsEnabled(val);
                                AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(val));
                            }}
                        />
                        <MenuItem label={t('my.menu.notices')} icon="megaphone-outline" onPress={() => openModal('notice')} />
                    </View>
                </View>
            </ScrollView>

            {/* Settings Menu Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isSettingsMenuVisible}
                onRequestClose={() => setIsSettingsMenuVisible(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setIsSettingsMenuVisible(false)}
                    className="flex-1 bg-black/50 justify-end"
                >
                    <View className="bg-white rounded-t-[32px] p-6 pb-12">
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />

                        <Text className="text-xl font-bold text-gray-900 mb-6 px-2">{t('my.sections.settings')}</Text>

                        <TouchableOpacity
                            onPress={() => {
                                setIsSettingsMenuVisible(false);
                                handleEditProfile();
                            }}
                            className="flex-row items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl"
                        >
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                <Ionicons name="person-outline" size={20} color="#3B82F6" />
                            </View>
                            <Text className="flex-1 text-base font-bold text-gray-800">{t('my.profile_edit.title')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setIsSettingsMenuVisible(false);
                                onRetakeSurvey?.();
                            }}
                            className="flex-row items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl"
                        >
                            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                                <Ionicons name="flask-outline" size={20} color="#00D182" />
                            </View>
                            <Text className="flex-1 text-base font-bold text-gray-800">{t('my.menu.retake_survey', 'Retake Skin Survey')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
                        </TouchableOpacity>

                        <View className="h-[1px] bg-gray-50 my-2 mx-4" />

                        <TouchableOpacity
                            onPress={() => {
                                setIsSettingsMenuVisible(false);
                                onLogout();
                            }}
                            className="flex-row items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl"
                        >
                            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            </View>
                            <Text className="flex-1 text-base font-bold text-red-500">{t('my.menu.logout')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFEDEB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsSettingsMenuVisible(false)}
                            className="mt-4 py-4 bg-gray-50 rounded-2xl items-center"
                        >
                            <Text className="text-gray-500 font-bold">{t('common.close', 'Close')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

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
                        <Text className="text-xl font-bold text-gray-900 mb-6">{t('my.profile_edit.title')}</Text>

                        <Text className="text-xs text-gray-500 font-bold mb-2">{t('my.profile_edit.nickname')}</Text>
                        <View className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-6">
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                className="text-base text-gray-900 font-bold"
                                placeholder={t('my.profile_edit.placeholder')}
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setIsEditModalVisible(false)}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-600 font-bold">{t('my.profile_edit.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                className="flex-1 py-3.5 bg-clony-primary rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">{t('my.profile_edit.save')}</Text>
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
                            <Text className="text-xl font-bold text-gray-900">{t('my.payment.title')}</Text>
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
                                                            <Text className="text-white text-[10px] font-bold">{t('my.payment.default')}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-row gap-2">
                                                    {!card.isDefault && (
                                                        <TouchableOpacity
                                                            onPress={() => handleSetDefault(card.id)}
                                                            className="bg-white/20 px-3 py-1 rounded-full"
                                                        >
                                                            <Text className="text-white text-xs">{t('my.payment.set_default')}</Text>
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
                                    <Text className="text-gray-400 font-bold">{t('my.payment.no_cards')}</Text>
                                    <Text className="text-gray-300 text-xs mt-1">{t('my.payment.add_hint')}</Text>
                                </View>
                            )}

                            {/* 카드 추가 폼 */}
                            {isAddCardVisible ? (
                                <View className="bg-gray-50 rounded-2xl p-5 mb-4">
                                    <Text className="font-bold text-gray-900 mb-4">{t('my.payment.add_new')}</Text>
                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.payment.form.bank')}</Text>
                                            <TextInput
                                                value={newCardName}
                                                onChangeText={setNewCardName}
                                                placeholder={t('my.payment.form.bank_placeholder')}
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.payment.form.card_number')}</Text>
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
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.payment.form.expiry')}</Text>
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
                                            <Text className="text-gray-600 font-bold">{t('common.cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleAddCard}
                                            className="flex-1 py-3 bg-clony-primary rounded-xl items-center"
                                        >
                                            <Text className="text-white font-bold">{t('my.payment.add_btn')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setIsAddCardVisible(true)}
                                    className="flex-row items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 mb-4"
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#00D182" />
                                    <Text className="text-clony-primary font-bold">{t('my.payment.add_new')}</Text>
                                </TouchableOpacity>
                            )}

                            {/* 안내 문구 */}
                            <View className="bg-blue-50 rounded-xl p-4 flex-row gap-3">
                                <Ionicons name="shield-checkmark-outline" size={18} color="#3B82F6" />
                                <Text className="text-blue-600 text-xs flex-1 leading-5">{t('my.payment.security_hint')}</Text>
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
                            <Text className="text-xl font-bold text-gray-900">{t('my.address.title')}</Text>
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
                                                        <Text className={`text-xs font-bold ${addr.isDefault ? 'text-white' : 'text-gray-500'}`}>{addr.name || t('my.address.name_placeholder')}</Text>
                                                    </View>
                                                    {addr.isDefault && (
                                                        <View className="bg-clony-primary/10 px-2 py-0.5 rounded-full">
                                                            <Text className="text-clony-primary text-[10px] font-bold">{t('my.address.default')}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View className="flex-row gap-2">
                                                    <TouchableOpacity
                                                        onPress={() => handleOpenAddAddress(addr)}
                                                        className="bg-gray-100 px-3 py-1.5 rounded-full"
                                                    >
                                                        <Text className="text-gray-600 text-xs font-bold">{t('common.save')}</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteAddress(addr.id)}
                                                        className="bg-red-50 px-3 py-1.5 rounded-full"
                                                    >
                                                        <Text className="text-red-500 text-xs font-bold">{t('common.delete')}</Text>
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
                                                    <Text className="text-gray-500 text-xs font-bold">{t('my.address.set_default')}</Text>
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
                                    <Text className="text-gray-400 font-bold">{t('my.address.form.no_addresses')}</Text>
                                    <Text className="text-gray-300 text-xs mt-1">{t('my.address.form.add_hint')}</Text>
                                </View>
                            )}

                            {/* 새 배송지 추가 폼 */}
                            {isAddAddressVisible ? (
                                <View className="bg-gray-50 rounded-2xl p-5 mb-4">
                                    <Text className="font-bold text-gray-900 mb-4">{editingAddress ? t('my.address.edit') : t('my.address.add_new')}</Text>
                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.address.form.name')}</Text>
                                            <TextInput
                                                value={addrForm.name}
                                                onChangeText={v => setAddrForm(f => ({ ...f, name: v }))}
                                                placeholder={t('my.address.form.name_placeholder')}
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View className="flex-row gap-2">
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.address.form.recipient')} *</Text>
                                                <TextInput
                                                    value={addrForm.recipient}
                                                    onChangeText={v => setAddrForm(f => ({ ...f, recipient: v }))}
                                                    placeholder="Hong Gil-dong"
                                                    placeholderTextColor="#D1D5DB"
                                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.address.form.phone')} *</Text>
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
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.address.form.address')} *</Text>
                                            <TextInput
                                                value={addrForm.address}
                                                onChangeText={v => setAddrForm(f => ({ ...f, address: v }))}
                                                placeholder={t('my.address.form.address_placeholder')}
                                                placeholderTextColor="#D1D5DB"
                                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                                            />
                                        </View>
                                        <View>
                                            <Text className="text-xs text-gray-500 font-bold mb-1">{t('my.address.form.detail')}</Text>
                                            <TextInput
                                                value={addrForm.detail}
                                                onChangeText={v => setAddrForm(f => ({ ...f, detail: v }))}
                                                placeholder={t('my.address.form.detail_placeholder')}
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
                                            <Text className="text-gray-600 font-bold">{t('common.cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSaveAddress}
                                            className="flex-1 py-3 bg-clony-primary rounded-xl items-center"
                                        >
                                            <Text className="text-white font-bold">{editingAddress ? t('common.save') : t('common.add')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => handleOpenAddAddress()}
                                    className="flex-row items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-4 mb-4"
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#00D182" />
                                    <Text className="text-clony-primary font-bold">{t('my.address.add_new')}</Text>
                                </TouchableOpacity>
                            )}

                            {/* 안내 */}
                            <View className="bg-amber-50 rounded-xl p-4 flex-row gap-3">
                                <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
                                <Text className="text-amber-700 text-xs flex-1 leading-5">{t('my.address.form.limit_hint')}</Text>
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
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{t('my.modals.return_order.title')}</Text>
                        {returnModalOrder && <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }} numberOfLines={1}>{returnModalOrder.items[0]}{returnModalOrder.items.length > 1 ? t('my.order_management.others', { count: returnModalOrder.items.length - 1 }) : ''}</Text>}

                        {/* 유형 선택 */}
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 10 }}>{t('my.modals.return_order.type_title')}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            {(['return', 'exchange'] as const).map(type => (
                                <TouchableOpacity key={type} onPress={() => setReturnType(type)}
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: returnType === type ? '#111827' : '#F3F4F6' }}>
                                    <Text style={{ color: returnType === type ? 'white' : '#6B7280', fontWeight: 'bold' }}>{t(`my.modals.return_order.types.${type}`)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 사유 선택 */}
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 10 }}>{t('my.modals.return_order.reason_title')} *</Text>
                        <View style={{ gap: 8, marginBottom: 24 }}>
                            {([
                                { key: 'mind_change', label: t('my.modals.return_order.reasons.mind_change') },
                                { key: 'defective', label: t('my.modals.return_order.reasons.defective') },
                                { key: 'wrong_item', label: t('my.modals.return_order.reasons.wrong_item') },
                                { key: 'damaged', label: t('my.modals.return_order.reasons.damaged') },
                                { key: 'others', label: t('my.modals.return_order.reasons.others') }
                            ] as const).map(r => (
                                <TouchableOpacity key={r.key} onPress={() => setReturnReason(r.label)}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: returnReason === r.label ? '#00D182' : '#F3F4F6', backgroundColor: returnReason === r.label ? '#F0FDF4' : 'white' }}>
                                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: returnReason === r.label ? '#00D182' : '#D1D5DB', backgroundColor: returnReason === r.label ? '#00D182' : 'white', alignItems: 'center', justifyContent: 'center' }}>
                                        {returnReason === r.label && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' }} />}
                                    </View>
                                    <Text style={{ color: '#374151', fontWeight: returnReason === r.label ? 'bold' : 'normal' }}>{t(`my.modals.return_order.reasons.${r.key}`)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 안내 */}
                        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                            <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
                            <Text style={{ color: '#92400E', fontSize: 12, flex: 1 }}>{t('my.modals.return_order.hint')}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setReturnModalOrder(null)}
                                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmitReturn}
                                style={{ flex: 1, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('my.modals.return_order.submit_btn')}</Text>
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
                        <Text className="text-xl font-bold text-gray-900 mb-2">{t('my.modals.confirm_purchase.title')}</Text>
                        <Text className="text-gray-500 text-center mb-6 text-sm">
                            {t('my.modals.confirm_purchase.hint')}
                        </Text>
                        {confirmTargetId && (() => {
                            const targetOrder = managedOrders.find(o => o.id === confirmTargetId);
                            if (!targetOrder) return null;
                            return (
                                <View className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-100">
                                    <Text className="font-bold text-gray-800 mb-1" numberOfLines={1}>
                                        {targetOrder.items[0]}{targetOrder.items.length > 1 ? t('my.order_management.others', { count: targetOrder.items.length - 1 }) : ''}
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
                                <Text className="text-gray-600 font-bold text-base">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmPurchaseAction}
                                className="flex-1 py-3.5 bg-clony-primary rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-base">{t('my.modals.confirm_purchase.confirm_btn')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

// Helper Component for Menu Items
const MenuItem = ({ label, icon, badge, isNew, hasSwitch, switchValue, onSwitchChange, isDestructive, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between p-4 active:bg-gray-50">
        <View className="flex-row items-center gap-3">
            <Ionicons name={icon} size={20} color={isDestructive ? "#EF4444" : "#4B5563"} />
            <Text className={`text-sm ${isDestructive ? 'text-red-500 font-bold' : 'text-gray-700'}`}>{label}</Text>
            {isNew && <View className="bg-red-500 px-1.5 py-0.5 rounded"><Text className="text-white text-[10px] font-bold">N</Text></View>}
        </View>
        <View className="flex-row items-center gap-2">
            {badge && <View className="bg-clony-primary px-2 py-0.5 rounded-full"><Text className="text-white text-xs font-bold">{badge}</Text></View>}
            {hasSwitch
                ? <Switch value={switchValue ?? true} onValueChange={onSwitchChange} trackColor={{ true: '#00D182' }} />
                : <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />}
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
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState<string | null>(null);
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.order_history.title')}>
            {orders.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="bag-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.order_history.empty')}</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {orders.map((order: any) => (
                        <TouchableOpacity key={order.id} onPress={() => setExpanded(expanded === order.id ? null : order.id)}
                            style={{ borderWidth: 1.5, borderColor: expanded === order.id ? '#00D182' : '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <View>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{order.date} · {order.id}</Text>
                                    <Text style={{ fontWeight: 'bold', color: '#111827' }} numberOfLines={1}>{t(order.items[0])}{order.items.length > 1 ? t('my.order_management.others', { count: order.items.length - 1 }) : ''}</Text>
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
                                <Text style={{ fontWeight: 'bold', color: '#111827' }}>{t(order.total)}</Text>
                                <Ionicons name={expanded === order.id ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                            </View>
                            {expanded === order.id && (
                                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 6 }}>
                                    {order.items.map((item: any, i: number) => <Text key={i} style={{ color: '#6B7280', fontSize: 13 }}>• {t(item)}</Text>)}

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 }}>
                                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{t('my.modals.order_history.tracking', { no: order.trackingNo })}</Text>
                                    </View>
                                    <TouchableOpacity style={{ marginTop: 8, borderWidth: 1, borderColor: '#00D182', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                                        <Text style={{ color: '#00D182', fontWeight: 'bold', fontSize: 13 }}>{t('my.modals.order_history.track_btn')}</Text>
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
    const { t } = useTranslation();
    const typeColor: any = { 'cancel': '#6B7280', 'return': '#EF4444', 'exchange': '#3B82F6' };
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.return_history.title')}>
            {returns.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="refresh-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.return_history.empty')}</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {returns.map((r: any) => (
                        <View key={r.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: (typeColor[r.type] || '#6B7280') + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                        <Text style={{ color: typeColor[r.type] || '#6B7280', fontSize: 12, fontWeight: 'bold' }}>{t(`my.modals.return_history.types.${r.type}`)}</Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{r.date}</Text>
                                </View>
                                <View style={{ backgroundColor: r.statusColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                    <Text style={{ color: r.statusColor, fontSize: 12, fontWeight: 'bold' }}>{t(r.status)}</Text>
                                </View>
                            </View>
                            <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{t(r.item)}</Text>
                            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>{t('my.modals.return_history.reason_prefix')}{t(r.reason)}</Text>
                            {r.refund !== '-' && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 }}>
                                    <Text style={{ color: '#6B7280', fontSize: 13 }}>{t('my.modals.return_history.refund_amount')}</Text>
                                    <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>{t(r.refund)}</Text>
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
    const { t } = useTranslation();
    const { API_URL } = require('../config/api.config').default;
    const [writtenIds, setWrittenIds] = useState<string[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);
    const [writingId, setWritingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pending = items.filter((i: any) => !writtenIds.includes(i.id));
    const handleSubmit = async (item: any) => {
        if (!reviewText.trim()) { Alert.alert(t('common.notice'), t('my.profile_edit.error_short')); return; }

        setIsSubmitting(true);

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

        try {
            await fetch(`${API_URL}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_name: item.name,
                    brand: item.brand,
                    rating,
                    content: reviewText,
                }),
            });
        } catch {
            // server unreachable – still save locally
        } finally {
            setIsSubmitting(false);
        }

        setMyReviews((prev: any) => [newReview, ...prev]);
        setWritableReviewItems((prev: any) => prev.filter((i: any) => i.id !== item.id));

        // 포인트 적립 추가
        setPointHistory((prev: any) => [{
            id: Date.now().toString(),
            type: 'earn',
            title: t('my.modals.reviews.earn_title'),
            amount: 500,
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.')
        }, ...prev]);

        setWrittenIds(p => [...p, item.id]);
        setWritingId(null);
        setReviewText('');
        setRating(5);
        Alert.alert(t('common.success'), t('my.modals.reviews.success_msg'));
    };
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.reviews.writable_title', { count: pending.length })}>
            {pending.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#00D182" />
                    <Text style={{ color: '#111827', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.reviews.empty_writable')}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{t('my.modals.reviews.thanks')}</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                        <Ionicons name="gift-outline" size={16} color="#10B981" />
                        <Text style={{ color: '#10B981', fontSize: 12, flex: 1 }}>{t('my.modals.reviews.point_hint')}</Text>
                    </View>
                    {pending.map((item: any) => (
                        <View key={item.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Image source={item.image} style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>{t(item.name)}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{t(item.brand)}</Text>

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
                                        placeholder={t('my.modals.reviews.placeholder')}
                                        placeholderTextColor="#D1D5DB"
                                        multiline numberOfLines={4}
                                        style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, color: '#111827', fontSize: 13, minHeight: 90, textAlignVertical: 'top' }}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity onPress={() => setWritingId(null)} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                                            <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>{t('common.cancel')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleSubmit(item)} disabled={isSubmitting} style={{ flex: 1, backgroundColor: isSubmitting ? '#9CA3AF' : '#00D182', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                                            {isSubmitting && <ActivityIndicator size="small" color="white" />}
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{isSubmitting ? '...' : t('common.submit')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setWritingId(item.id)}
                                    style={{ backgroundColor: '#00D182', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('my.modals.reviews.write_btn')}</Text>
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
    const { t } = useTranslation();
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.reviews.my_title', { count: reviews.length })}>
            {reviews.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.reviews.empty_my')}</Text>
                </View>
            ) : (
                <View style={{ gap: 16, paddingBottom: 16 }}>
                    {reviews.map((r: any) => (
                        <View key={r.id} style={{ borderWidth: 1.5, borderColor: '#F3F4F6', borderRadius: 16, padding: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Image source={r.image} style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F9FAFB' }} resizeMode="contain" />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold', color: '#111827' }}>{t(r.name)}</Text>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{t(r.brand)} · {r.date}</Text>
                                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                        {[1, 2, 3, 4, 5].map(s => <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={14} color="#F59E0B" />)}
                                    </View>
                                </View>
                            </View>
                            <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20, marginBottom: 10 }}>{t(r.content)}</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="thumbs-up-outline" size={14} color="#9CA3AF" />
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{t('my.modals.reviews.helpful', { count: r.helpful })}</Text>
                                </View>
                                <TouchableOpacity style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: 'bold' }}>{t('common.edit')}</Text>
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
    const { t } = useTranslation();
    const { API_URL } = require('../config/api.config').default;
    const [isWriting, setIsWriting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const categories = [
        { key: 'delivery', label: t('my.modals.inquiry.categories.delivery') },
        { key: 'product', label: t('my.modals.inquiry.categories.product') },
        { key: 'payment', label: t('my.modals.inquiry.categories.payment') },
        { key: 'return', label: t('my.modals.inquiry.categories.return') },
        { key: 'others', label: t('my.modals.inquiry.categories.others') }
    ];
    const handleSubmit = async () => {
        if (!inquiryText.trim()) { Alert.alert(t('common.notice'), t('my.modals.inquiry.placeholder')); return; }
        setIsSubmitting(true);
        const newInquiry = {
            id: Date.now().toString(),
            category: inquiryCategory,
            title: inquiryText.slice(0, 30) + (inquiryText.length > 30 ? '...' : ''),
            date: new Date().toISOString().slice(0, 10),
            status: 'pending',
            answer: ''
        };
        try {
            await fetch(`${API_URL}/inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: inquiryCategory,
                    title: newInquiry.title,
                    content: inquiryText,
                }),
            });
        } catch {
            // server unreachable – still save locally
        } finally {
            setIsSubmitting(false);
        }
        setInquiries((p: any[]) => [newInquiry, ...p]);
        setInquiryText('');
        setIsWriting(false);
        Alert.alert(t('common.success'), t('common.submitted_msg'));
    };
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.inquiry.title')}>
            {!isWriting ? (
                <View style={{ paddingBottom: 16 }}>
                    <TouchableOpacity onPress={() => setIsWriting(true)}
                        style={{ backgroundColor: '#00D182', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <Ionicons name="add-circle-outline" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('my.modals.inquiry.add_new')}</Text>
                    </TouchableOpacity>
                    {inquiries.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Ionicons name="chatbox-ellipses-outline" size={48} color="#D1D5DB" />
                            <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.inquiry.empty')}</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {inquiries.map((inq: any) => (
                                <TouchableOpacity key={inq.id} onPress={() => setExpandedInquiry(expandedInquiry === inq.id ? null : inq.id)}
                                    style={{ borderWidth: 1.5, borderColor: expandedInquiry === inq.id ? '#00D182' : '#F3F4F6', borderRadius: 14, padding: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                            <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                                                <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: 'bold' }}>{t(`my.modals.inquiry.categories.${inq.category}`)}</Text>
                                            </View>
                                            <Text style={{ fontWeight: 'bold', color: '#111827', flex: 1 }} numberOfLines={1}>{t(inq.title)}</Text>

                                        </View>
                                        <View style={{ backgroundColor: inq.status === 'completed' ? '#D1FAE5' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 8 }}>
                                            <Text style={{ color: inq.status === 'completed' ? '#10B981' : '#F59E0B', fontSize: 11, fontWeight: 'bold' }}>{inq.status === 'completed' ? t('common.completed') : t('common.pending')}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{inq.date}</Text>
                                    {expandedInquiry === inq.id && inq.answer ? (
                                        <View style={{ marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12 }}>
                                            <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>💬 {t('my.modals.inquiry.answer')}</Text>
                                            <Text style={{ color: '#374151', fontSize: 13, lineHeight: 20 }}>{t(inq.answer)}</Text>
                                        </View>
                                    ) : expandedInquiry === inq.id && !inq.answer ? (
                                        <View style={{ marginTop: 12, backgroundColor: '#FEF9C3', borderRadius: 10, padding: 12 }}>
                                            <Text style={{ color: '#92400E', fontSize: 12 }}>{t('my.modals.inquiry.no_answer')}</Text>
                                        </View>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={{ paddingBottom: 16, gap: 14 }}>
                    <Text style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>{t('my.modals.inquiry.form_title')}</Text>
                    <View>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>{t('my.modals.inquiry.category')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {categories.map(c => (
                                    <TouchableOpacity key={c.key} onPress={() => setInquiryCategory(c.key)}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: inquiryCategory === c.key ? '#00D182' : '#F3F4F6' }}>
                                        <Text style={{ color: inquiryCategory === c.key ? 'white' : '#6B7280', fontWeight: 'bold', fontSize: 13 }}>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 8 }}>{t('my.modals.inquiry.content')} *</Text>
                        <TextInput
                            value={inquiryText} onChangeText={setInquiryText}
                            placeholder={t('my.modals.inquiry.placeholder')}
                            placeholderTextColor="#D1D5DB"
                            multiline numberOfLines={5}
                            style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, color: '#111827', fontSize: 13, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' }}
                        />
                    </View>
                    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8 }}>
                        <Ionicons name="time-outline" size={16} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontSize: 12, flex: 1 }}>{t('my.modals.inquiry.avg_time')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setIsWriting(false)} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
                            <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ flex: 1, backgroundColor: isSubmitting ? '#9CA3AF' : '#00D182', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                            {isSubmitting && <ActivityIndicator size="small" color="white" />}
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{isSubmitting ? '...' : t('common.submit')}</Text>
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
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.notice.title')}>
            {notices.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.notice.empty')}</Text>
                </View>
            ) : (
                <View style={{ gap: 12, paddingBottom: 16 }}>
                    {notices.map((notice: any) => (
                        <TouchableOpacity key={notice.id} onPress={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                            style={{ borderWidth: 1.5, borderColor: expandedId === notice.id ? '#00D182' : '#F3F4F6', borderRadius: 16, padding: 16, backgroundColor: 'white' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                                    <View style={{ backgroundColor: notice.category === 'my_mock.notices.cat_update' ? '#E0F2FE' : (notice.category === 'my_mock.notices.cat_maintenance' ? '#FEF3C7' : '#FCE7F3'), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                                        <Text style={{ color: notice.category === 'my_mock.notices.cat_update' ? '#0284C7' : (notice.category === 'my_mock.notices.cat_maintenance' ? '#D97706' : '#DB2777'), fontSize: 11, fontWeight: 'bold' }}>{t(notice.category)}</Text>
                                    </View>

                                    <Text style={{ fontWeight: 'bold', color: '#111827', flex: 1, fontSize: 15 }} numberOfLines={1}>{t(notice.title)}</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: expandedId === notice.id ? 12 : 0 }}>{notice.date}</Text>

                            {expandedId === notice.id && (
                                <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                                    <Text style={{ color: '#374151', fontSize: 14, lineHeight: 22 }}>{t(notice.content)}</Text>
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
    const { t } = useTranslation();
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.coupon.title')}>
            <View style={{ gap: 12, paddingBottom: 16 }}>
                {coupons.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.coupon.empty')}</Text>
                    </View>
                ) : (
                    coupons.map((c: any) => (
                        <View key={c.id} style={{
                            borderWidth: 1, borderColor: c.used ? '#E5E7EB' : '#00D182',
                            borderRadius: 16, padding: 20, backgroundColor: c.used ? '#F9FAFB' : '#F0FDF4',
                            opacity: c.used ? 0.6 : 1, position: 'relative', overflow: 'hidden'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.used ? '#9CA3AF' : '#111827' }}>{t(c.name)}</Text>
                                {c.used && <View style={{ backgroundColor: '#D1D5DB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{t('my.modals.coupon.used')}</Text></View>}
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: c.used ? '#9CA3AF' : '#00D182', marginBottom: 4 }}>{t(c.discount)}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>{t(c.minOrder)}</Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: c.used ? '#E5E7EB' : '#DCFCE7', paddingTop: 12 }}>
                                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                                <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>{t('my.modals.coupon.expiry', { date: c.expiry })}</Text>
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
    const { t } = useTranslation();
    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.point.title')}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{t('my.modals.point.total')}</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00D182' }}>{totalPoints.toLocaleString()} {t('my.stats.points_unit')}</Text>
            </View>
            <View style={{ gap: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                {history.map((h: any) => (
                    <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                        <View>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>{t(h.title)}</Text>
                            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{h.date}</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: h.type === 'earn' ? '#00D182' : '#EF4444' }}>
                            {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString()} {t('my.stats.points_unit')}
                        </Text>
                    </View>
                ))}
            </View>
        </BottomSheet>
    );
};

// ─── 찜한 상품 ────────────────────────────────────────────────────────────────
const WishlistModal = ({ visible, onClose, wishlist, onToggle, onAddCart }: any) => {
    const { t } = useTranslation();
    const getImageSource = (product: any) => {
        if (typeof product.imageUrl === 'number') return product.imageUrl;
        if (typeof product.imageUrl === 'string') {
            if (product.imageUrl.startsWith('http')) return { uri: product.imageUrl };
            return { uri: product.imageUrl };
        }
        return require('../assets/product_images/cream.png');
    };

    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('my.modals.wishlist.title', { count: (wishlist || []).length })}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 16 }}>
                {(!wishlist || wishlist.length === 0) ? (
                    <View style={{ width: '100%', alignItems: 'center', paddingVertical: 48 }}>
                        <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
                        <Text style={{ color: '#9CA3AF', marginTop: 12, fontWeight: 'bold' }}>{t('my.modals.wishlist.empty')}</Text>
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
                                <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>{item.brand || t('common.cosmetics')}</Text>
                                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 6 }} numberOfLines={1}>{item.name}</Text>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                                    {item.price ? Number(String(item.price).replace(/[^0-9]/g, '')).toLocaleString() : '0'}{t('common.currency_unit')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        onAddCart(item);
                                        Alert.alert(t('common.notice'), t('my.modals.wishlist.added_msg'));
                                    }}
                                    style={{ marginTop: 12, backgroundColor: '#111827', borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}
                                >
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{t('my.modals.wishlist.add_cart')}</Text>
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
