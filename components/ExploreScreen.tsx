import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IngredientDictionaryScreen from './IngredientDictionaryScreen';
import CommunityScreen from './CommunityScreen';

const ExploreScreen: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<'Ingredient' | 'Community'>('Ingredient');

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header with Sub-tabs */}
            <View className="bg-white px-6 pt-14 pb-4">
                <Text className="text-2xl font-bold text-gray-900 mb-4">탐색</Text>

                {/* Sub-tab Selector */}
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => setActiveSubTab('Ingredient')}
                        className={`flex-1 py-3 rounded-xl ${activeSubTab === 'Ingredient' ? 'bg-clony-primary' : 'bg-gray-100'}`}
                    >
                        <Text className={`text-center font-bold ${activeSubTab === 'Ingredient' ? 'text-white' : 'text-gray-600'}`}>
                            성분 사전
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveSubTab('Community')}
                        className={`flex-1 py-3 rounded-xl ${activeSubTab === 'Community' ? 'bg-clony-primary' : 'bg-gray-100'}`}
                    >
                        <Text className={`text-center font-bold ${activeSubTab === 'Community' ? 'text-white' : 'text-gray-600'}`}>
                            커뮤니티
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {activeSubTab === 'Ingredient' && <IngredientDictionaryScreen />}
            {activeSubTab === 'Community' && <CommunityScreen />}
        </View>
    );
};

export default ExploreScreen;
