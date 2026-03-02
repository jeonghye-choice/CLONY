import React from 'react';
import { View, Text } from 'react-native';

interface InteractiveMapProps {
    stores: any[];
    language: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = () => {
    return (
        <View style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                Interactive Map (Available on iOS/Android Simulator)
            </Text>
        </View>
    );
};

export default InteractiveMap;
