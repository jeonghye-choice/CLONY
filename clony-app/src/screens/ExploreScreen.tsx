import React from 'react';
import { View, Text } from 'react-native';
import IngredientDictionaryScreen from './IngredientDictionaryScreen';
import { useTranslation } from 'react-i18next';

const ExploreScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <View className="flex-1 bg-gray-50">
            <IngredientDictionaryScreen />
        </View>
    );
};

export default ExploreScreen;
