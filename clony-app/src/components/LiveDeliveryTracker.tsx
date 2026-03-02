import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LiveDeliveryTrackerProps {
    orderId: string;
    orderName: string;
    deliveryAddress: string;
    onGoHome: () => void;
}

const DELIVERY_STAGES = [
    {
        id: 0,
        icon: 'receipt-outline' as const,
        labelKey: 'delivery.stage_ordered',
        defaultLabel: 'Order Confirmed',
        descKey: 'delivery.stage_ordered_desc',
        defaultDesc: 'Your order has been received.',
        color: '#8B5CF6',
        minutesFromNow: 0,
    },
    {
        id: 1,
        icon: 'cube-outline' as const,
        labelKey: 'delivery.stage_preparing',
        defaultLabel: 'Preparing Your Items',
        descKey: 'delivery.stage_preparing_desc',
        defaultDesc: 'Staff is picking your products.',
        color: '#F59E0B',
        minutesFromNow: 3,
    },
    {
        id: 2,
        icon: 'bicycle-outline' as const,
        labelKey: 'delivery.stage_on_the_way',
        defaultLabel: 'On the Way',
        descKey: 'delivery.stage_on_the_way_desc',
        defaultDesc: 'Your rider is heading to you.',
        color: '#3B82F6',
        minutesFromNow: 7,
    },
    {
        id: 3,
        icon: 'location-outline' as const,
        labelKey: 'delivery.stage_nearby',
        defaultLabel: 'Almost There!',
        descKey: 'delivery.stage_nearby_desc',
        defaultDesc: 'Rider is nearby. Please be ready.',
        color: '#10B981',
        minutesFromNow: 12,
    },
    {
        id: 4,
        icon: 'checkmark-circle-outline' as const,
        labelKey: 'delivery.stage_delivered',
        defaultLabel: 'Delivered!',
        descKey: 'delivery.stage_delivered_desc',
        defaultDesc: 'Your order has been delivered. Enjoy!',
        color: '#00A676',
        minutesFromNow: 15,
    },
];

// Auto-advance timing in milliseconds (sped up for demo: 1 stage every 4 seconds)
const STAGE_INTERVAL_MS = 4000;

const LiveDeliveryTracker: React.FC<LiveDeliveryTrackerProps> = ({
    orderId,
    orderName,
    deliveryAddress,
    onGoHome,
}) => {
    const { t } = useTranslation();
    const [currentStage, setCurrentStage] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isDelivered = currentStage === DELIVERY_STAGES.length - 1;

    // Pulse animation for the active stage icon
    useEffect(() => {
        if (isDelivered) return;
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [currentStage, isDelivered]);

    // Elapsed timer
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-advance stages
    useEffect(() => {
        if (isDelivered) return;
        const interval = setInterval(() => {
            setCurrentStage(prev => {
                const next = Math.min(prev + 1, DELIVERY_STAGES.length - 1);
                // Animate progress bar
                Animated.timing(progressAnim, {
                    toValue: next / (DELIVERY_STAGES.length - 1),
                    duration: 600,
                    useNativeDriver: false,
                }).start();
                return next;
            });
        }, STAGE_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [isDelivered]);

    const activeStage = DELIVERY_STAGES[currentStage];
    const estimatedMinutes = Math.max(
        0,
        DELIVERY_STAGES[DELIVERY_STAGES.length - 1].minutesFromNow - Math.floor(elapsedSeconds / (STAGE_INTERVAL_MS / 1000)) * 3
    );

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View
                className="px-6 pt-14 pb-6"
                style={{ backgroundColor: activeStage.color }}
            >
                <View className="flex-row justify-between items-start mb-4">
                    <View>
                        <Text className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                            {t('delivery.order_tracking', 'Order Tracking')}
                        </Text>
                        <Text className="text-white font-mono text-sm">{orderId}</Text>
                    </View>
                    <View className="bg-white/20 rounded-xl px-3 py-1.5">
                        <Text className="text-white text-xs font-bold">⏱ {formatTime(elapsedSeconds)}</Text>
                    </View>
                </View>

                {/* Active Stage Banner */}
                <View className="flex-row items-center gap-4">
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
                            <Ionicons name={activeStage.icon} size={32} color="white" />
                        </View>
                    </Animated.View>
                    <View className="flex-1">
                        <Text className="text-white text-xl font-bold">
                            {t(activeStage.labelKey, activeStage.defaultLabel)}
                        </Text>
                        <Text className="text-white/80 text-sm mt-1">
                            {t(activeStage.descKey, activeStage.defaultDesc)}
                        </Text>
                    </View>
                </View>

                {/* ETA */}
                {!isDelivered && (
                    <View className="mt-4 bg-white/20 rounded-xl px-4 py-3 flex-row items-center justify-between">
                        <Text className="text-white/80 text-sm">{t('delivery.eta', 'Estimated arrival')}</Text>
                        <Text className="text-white font-bold text-base">
                            {t('delivery.eta_minutes', '~{{min}} min', { min: estimatedMinutes })}
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Progress Bar */}
                <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                    <Text className="text-sm font-bold text-gray-700 mb-3">
                        {t('delivery.progress', 'Delivery Progress')}
                    </Text>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <Animated.View
                            style={{
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                                backgroundColor: activeStage.color,
                            }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <Text className="text-xs text-gray-400 text-right">
                        {currentStage + 1} / {DELIVERY_STAGES.length} {t('delivery.stages', 'stages')}
                    </Text>
                </View>

                {/* Stage Timeline */}
                <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                    <Text className="text-sm font-bold text-gray-700 mb-4">
                        {t('delivery.timeline', 'Timeline')}
                    </Text>
                    {DELIVERY_STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentStage;
                        const isActive = idx === currentStage;
                        const isFuture = idx > currentStage;
                        return (
                            <View key={stage.id} className="flex-row">
                                {/* Dot & Line */}
                                <View className="items-center mr-4" style={{ width: 24 }}>
                                    <View
                                        className="w-6 h-6 rounded-full items-center justify-center z-10"
                                        style={{
                                            backgroundColor: isCompleted || isActive ? stage.color : '#E5E7EB',
                                        }}
                                    >
                                        {isCompleted ? (
                                            <Ionicons name="checkmark" size={12} color="white" />
                                        ) : isActive ? (
                                            <View className="w-2.5 h-2.5 rounded-full bg-white" />
                                        ) : null}
                                    </View>
                                    {idx < DELIVERY_STAGES.length - 1 && (
                                        <View
                                            className="w-0.5 flex-1 my-1"
                                            style={{
                                                backgroundColor: isCompleted ? stage.color : '#E5E7EB',
                                                minHeight: 24,
                                            }}
                                        />
                                    )}
                                </View>

                                {/* Text */}
                                <View className="flex-1 pb-5">
                                    <Text
                                        className="font-bold text-sm"
                                        style={{ color: isFuture ? '#D1D5DB' : '#111827' }}
                                    >
                                        {t(stage.labelKey, stage.defaultLabel)}
                                    </Text>
                                    {(isCompleted || isActive) && (
                                        <Text className="text-xs text-gray-400 mt-0.5">
                                            {t(stage.descKey, stage.defaultDesc)}
                                        </Text>
                                    )}
                                    {isActive && !isDelivered && (
                                        <View
                                            className="self-start mt-1.5 px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: stage.color + '20' }}
                                        >
                                            <Text className="text-xs font-bold" style={{ color: stage.color }}>
                                                {t('delivery.in_progress', 'In Progress')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Order Info */}
                <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                    <Text className="text-sm font-bold text-gray-700 mb-3">
                        {t('delivery.order_info', 'Order Info')}
                    </Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-xs text-gray-400">{t('delivery.items', 'Items')}</Text>
                        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1} style={{ maxWidth: '60%' }}>
                            {orderName}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-xs text-gray-400">{t('delivery.destination', 'Destination')}</Text>
                        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1} style={{ maxWidth: '60%' }}>
                            {deliveryAddress}
                        </Text>
                    </View>
                </View>

                {/* Go Home Button (shown only after delivery) */}
                {isDelivered && (
                    <View className="mt-2">
                        <View className="bg-green-50 rounded-2xl p-5 mb-4 items-center border border-green-100">
                            <Text className="text-4xl mb-3">🎉</Text>
                            <Text className="text-lg font-bold text-gray-900">
                                {t('delivery.delivered_title', 'Delivered Successfully!')}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-1 text-center">
                                {t('delivery.delivered_desc', 'Thank you for shopping with Clony.')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onGoHome}
                            className="bg-clony-primary py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-base">
                                {t('payment.go_home', 'Back to Home')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default LiveDeliveryTracker;
