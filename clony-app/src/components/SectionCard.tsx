import React from 'react';
import { View, Text } from 'react-native';

interface SectionCardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = "" }) => (
    <View className={`bg-white rounded-[24px] p-6 mb-4 shadow-sm ${className}`}>
        {title && <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</Text>}
        {children}
    </View>
);

export default SectionCard;
