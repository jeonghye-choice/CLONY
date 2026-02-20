import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function CustomAlert({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    confirmText = '확인',
    cancelText = '취소'
}: CustomAlertProps) {
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                damping: 15,
                stiffness: 150,
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success': return { name: 'checkmark-circle', color: '#34D399' };
            case 'error': return { name: 'alert-circle', color: '#EF4444' };
            case 'warning': return { name: 'warning', color: '#F59E0B' };
            default: return { name: 'information-circle', color: '#6366F1' };
        }
    };

    const iconInfo = getIcon();

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View className="flex-1 bg-black/50 items-center justify-center px-8">
                <Animated.View
                    style={{ transform: [{ scale: scaleValue }] }}
                    className="bg-white w-full rounded-3xl p-6 items-center shadow-xl"
                >
                    {/* Icon Header */}
                    <View className="mb-4 bg-gray-50 p-4 rounded-full">
                        <Ionicons name={iconInfo.name as any} size={48} color={iconInfo.color} />
                    </View>

                    {/* Text Content */}
                    <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</Text>
                    <Text className="text-gray-500 text-center mb-6 leading-relaxed">{message}</Text>

                    {/* Buttons */}
                    <View className="flex-row gap-3 w-full">
                        {onConfirm && (
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 py-3.5 bg-gray-100 rounded-xl items-center"
                            >
                                <Text className="text-gray-700 font-bold">{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => {
                                if (onConfirm) onConfirm();
                                else onClose();
                            }}
                            className={`flex-1 py-3.5 rounded-xl items-center ${type === 'error' ? 'bg-red-500' : 'bg-clony-primary'}`}
                        >
                            <Text className="text-white font-bold">{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
