import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FABProps {
    onPress: () => void;
}

const FAB: React.FC<FABProps> = ({ onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        className="absolute bottom-6 right-6 w-16 h-16 bg-clony-primary rounded-full items-center justify-center shadow-lg border-4 border-white z-50 overflow-hidden"
        style={{ elevation: 5 }}
    >
        <Ionicons name="scan-outline" size={30} color="white" />
    </TouchableOpacity>
);

export default FAB;
