
import React from 'react';
import { View } from 'react-native';
import { useCart } from '../contexts/CartContext';
import OCRResultScreen from '../screens/OCRResultScreen';

// Wrapper to use useCart hook inside App's CartProvider
// Simplified wrapper for OCR Result
export const OCRResultContainer = ({ product, onClose }: any) => {
    return (
        <OCRResultScreen
            product={product}
            onClose={onClose}
        />
    );
};
