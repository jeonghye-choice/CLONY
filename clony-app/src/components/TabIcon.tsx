import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabIconProps {
    name: any;
    label: string;
    active: boolean;
    onPress: () => void;
}

const TabIcon: React.FC<TabIconProps> = ({ name, label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} className="items-center justify-center flex-1">
        <Ionicons name={name} size={24} color={active ? '#00D182' : '#9CA3AF'} />
        <Text className={`text-[10px] mt-1 ${active ? 'text-clony-primary font-bold' : 'text-gray-400'}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default TabIcon;
