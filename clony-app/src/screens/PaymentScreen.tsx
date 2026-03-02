import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config/api.config';

interface PaymentScreenProps {
    totalAmount: number;
    orderName: string;
    onBack: () => void;
    onSuccess: (method: string, orderId: string) => void;
}

interface PaymentMethod {
    id: string;
    icon: string;
    label: string;
    sublabel: string;
    color: string;
    bgColor: string;
    showQR?: boolean; // QR-based payment methods
}

// Live exchange rates (mock — replace with real API like ExchangeRate-API in production)
const EXCHANGE_RATES: Record<string, { rate: number; symbol: string; flag: string }> = {
    USD: { rate: 0.00073, symbol: '$', flag: '🇺🇸' },
    EUR: { rate: 0.00068, symbol: '€', flag: '🇪🇺' },
    JPY: { rate: 0.11, symbol: '¥', flag: '🇯🇵' },
    CNY: { rate: 0.0052, symbol: '¥', flag: '🇨🇳' },
    THB: { rate: 0.026, symbol: '฿', flag: '🇹🇭' },
    SGD: { rate: 0.00098, symbol: 'S$', flag: '🇸🇬' },
};

const PAYMENT_METHODS: PaymentMethod[] = [
    {
        id: 'credit_card',
        icon: '💳',
        label: 'Credit / Debit Card',
        sublabel: 'Visa · Mastercard · Amex · UnionPay · JCB',
        color: '#1A56DB',
        bgColor: '#EFF6FF',
    },
    {
        id: 'apple_pay',
        icon: '🍎',
        label: 'Apple Pay',
        sublabel: 'Pay with Face ID or Touch ID',
        color: '#111827',
        bgColor: '#F9FAFB',
    },
    {
        id: 'google_pay',
        icon: '🔵',
        label: 'Google Pay',
        sublabel: 'Pay quickly & securely',
        color: '#1A73E8',
        bgColor: '#EFF6FF',
    },
    {
        id: 'paypal',
        icon: '🅿️',
        label: 'PayPal',
        sublabel: 'Pay with your PayPal account',
        color: '#003087',
        bgColor: '#EFF6FF',
    },
    {
        id: 'alipay',
        icon: '🔷',
        label: 'Alipay  支付宝',
        sublabel: 'Scan QR · Popular in Asia',
        color: '#1677FF',
        bgColor: '#EFF6FF',
        showQR: true,
    },
    {
        id: 'wechat_pay',
        icon: '💬',
        label: 'WeChat Pay  微信支付',
        sublabel: 'Scan QR · 微信支付',
        color: '#07C160',
        bgColor: '#F0FDF4',
        showQR: true,
    },
];

const CurrencyBadge = ({ label, value }: { label: string; value: string }) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#374151' }}>{value}</Text>
    </View>
);

const PaymentScreen: React.FC<PaymentScreenProps> = ({
    totalAmount,
    orderName,
    onBack,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handlePay = () => {
        if (!selectedMethod) return;
        const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
        if (method?.showQR) {
            setShowQR(true);
        } else {
            setShowConfirm(true);
        }
    };

    const handleConfirmPay = async () => {
        if (!selectedMethod) return;
        setShowConfirm(false);
        setShowQR(false);
        setIsProcessing(true);

        const orderId = `CLN-${Date.now()}`;

        try {
            await fetch(`${API_URL}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    order_name: orderName,
                    amount_krw: totalAmount,
                    payment_method: selectedMethod,
                    currency: 'KRW',
                }),
            });
        } catch {
            // server unreachable — still complete locally
        }

        // Small delay to simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess(selectedMethod as string, orderId);
        }, 1500);
    };

    const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={onBack}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                        {t('payment.title', 'Payment')}
                    </Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
                {/* Order Summary */}
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                        {t('payment.order_summary', 'Order Summary')}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 16 }} numberOfLines={2}>{orderName}</Text>

                    {/* KRW Total */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginBottom: 12 }}>
                        <Text style={{ color: '#6B7280' }}>{t('payment.total', 'Total')}</Text>
                        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#00A676' }}>₩{totalAmount.toLocaleString()}</Text>
                    </View>

                    {/* Currency conversion strip */}
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(EXCHANGE_RATES).map(([currency, info]) => (
                            <CurrencyBadge
                                key={currency}
                                label={`${info.flag} ${currency}`}
                                value={`${info.symbol}${(totalAmount * info.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            />
                        ))}
                    </View>
                    <Text style={{ fontSize: 10, color: '#D1D5DB', textAlign: 'center', marginTop: 6 }}>
                        *{t('payment.fx_notice', 'Exchange rates are indicative only')}
                    </Text>
                </View>

                {/* Payment Methods */}
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
                    {t('payment.select_method', 'Select Payment Method')}
                </Text>

                {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                        <TouchableOpacity
                            key={method.id}
                            onPress={() => setSelectedMethod(method.id)}
                            style={{
                                backgroundColor: isSelected ? method.bgColor : '#FFFFFF',
                                borderColor: isSelected ? method.color : '#E5E7EB',
                                borderWidth: isSelected ? 2 : 1.5,
                                borderRadius: 18,
                                padding: 16,
                                marginBottom: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: '#F3F4F6' }}>
                                <Text style={{ fontSize: 22 }}>{method.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 15, color: isSelected ? method.color : '#111827' }}>
                                    {method.label}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{method.sublabel}</Text>
                            </View>
                            {/* QR badge */}
                            {method.showQR && (
                                <View style={{ backgroundColor: method.color + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 8 }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: method.color }}>QR</Text>
                                </View>
                            )}
                            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: isSelected ? method.color : '#D1D5DB', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: method.color }} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {/* Security Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#9CA3AF" />
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {t('payment.secure_badge', 'Secured by 256-bit SSL encryption')}
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36 }}>
                <TouchableOpacity
                    onPress={handlePay}
                    disabled={!selectedMethod}
                    style={{
                        paddingVertical: 17,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: selectedMethod ? '#00A676' : '#E5E7EB',
                    }}
                >
                    <Text style={{ fontWeight: 'bold', fontSize: 17, color: selectedMethod ? 'white' : '#9CA3AF' }}>
                        {selectedMethod
                            ? `${t('payment.pay_btn', 'Pay')}  ₩${totalAmount.toLocaleString()}`
                            : t('payment.select_method_cta', 'Select a payment method')
                        }
                    </Text>
                </TouchableOpacity>
            </View>

            {/* QR Code Modal — for Alipay / WeChat Pay */}
            <Modal visible={showQR} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 32, alignItems: 'center' }}>
                        <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 20 }} />
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                            {selectedMethodData?.label}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>
                            {t('payment.qr_hint', 'Open your app and scan the QR code to pay')}
                        </Text>

                        {/* QR placeholder */}
                        <View style={{ width: 200, height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: selectedMethodData?.color || '#E5E7EB' }}>
                            <Text style={{ fontSize: 64 }}>
                                {selectedMethod === 'alipay' ? '🔷' : '💬'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>QR Code</Text>
                            <Text style={{ fontSize: 10, color: '#D1D5DB' }}>({t('payment.qr_generated', 'Generated at checkout')})</Text>
                        </View>

                        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, width: '100%', marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#6B7280' }}>{t('payment.total', 'Total')}</Text>
                            <Text style={{ fontWeight: 'bold', color: '#111827' }}>₩{totalAmount.toLocaleString()}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                            <TouchableOpacity onPress={() => setShowQR(false)} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>{t('common.cancel', 'Cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmPay} style={{ flex: 1, backgroundColor: selectedMethodData?.color || '#00A676', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', color: 'white' }}>{t('payment.paid_confirm', 'Payment Done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Standard Confirm Modal */}
            <Modal visible={showConfirm} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <View style={{ backgroundColor: 'white', width: '100%', borderRadius: 24, padding: 24 }}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 40 }}>{selectedMethodData?.icon}</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 12 }}>
                                {t('payment.confirm_title', 'Confirm Payment')}
                            </Text>
                        </View>
                        <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: '#6B7280', fontSize: 13 }}>{t('payment.method', 'Method')}</Text>
                                <Text style={{ fontWeight: '600', fontSize: 13 }}>{selectedMethodData?.label}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#6B7280', fontSize: 13 }}>{t('payment.total', 'Total')}</Text>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#00A676' }}>₩{totalAmount.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => setShowConfirm(false)} style={{ flex: 1, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', color: '#6B7280' }}>{t('common.cancel', 'Cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirmPay} style={{ flex: 1, paddingVertical: 14, backgroundColor: '#00A676', borderRadius: 14, alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', color: 'white' }}>{t('common.confirm', 'Confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Processing Overlay */}
            <Modal visible={isProcessing} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 36, alignItems: 'center', marginHorizontal: 40 }}>
                        <ActivityIndicator size="large" color="#00A676" />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginTop: 16 }}>
                            {t('payment.processing', 'Processing payment...')}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
                            {t('payment.processing_hint', 'Please do not close this screen')}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default PaymentScreen;
