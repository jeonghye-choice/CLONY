
import React from 'react';
import { View } from 'react-native';
import { useCart } from '../contexts/CartContext';
import OCRResultScreen from '../components/OCRResultScreen';

// Wrapper to use useCart hook inside App's CartProvider
export const OCRResultContainer = ({ product, onAddToCart, onClose, onCartPress }: any) => {
    const { addToCart } = useCart();

    const handleAdd = () => {
        const safeId = typeof product.id === 'string' ? parseInt(product.id.replace('scan_', '')) : product.id;
        const imageUrl = product.imageUrl || product.image_url;
        // Fix: Handle local require images (number) correctly vs remote URLs (string)
        const imageSource = (typeof imageUrl === 'string') ? { uri: imageUrl } : imageUrl;

        addToCart({
            productId: safeId || 999,
            brand: product.brand,
            name: product.name,
            price: product.price,
            quantity: 1,
            matchingScore: product.matchingScore,
            category: product.category,
            image: imageSource
        });
        onAddToCart();
    };

    return (
        <OCRResultScreen
            product={product}
            onAddToCart={handleAdd}
            onClose={onClose}
            onCartPress={onCartPress}
        />
    );
};
