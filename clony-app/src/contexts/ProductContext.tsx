import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Product Type (shared with other components ideally, but defining here for now)
export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    imageUrl: any; // string (uri) or number (require)
    matchingScore: number;
    skinType: string;
    keyIngredients: any[];
    warnings: string[];
    reviews: string;
    ingredientComment?: string;
    price: number;
    expiryDate?: string;
    openedDate?: string;
    isOpened?: boolean;
}

interface ProductContextType {
    recentScans: Product[];
    wishlist: Product[];
    cabinet: Product[];
    addProduct: (product: Product) => Promise<void>;
    clearHistory: () => Promise<void>;
    toggleWishlist: (product: Product) => Promise<void>;
    isWishlisted: (productId: string) => boolean;
    addToCabinet: (product: Product) => Promise<void>;
    removeFromCabinet: (productId: string) => Promise<void>;
    removeRecentScan: (productId: string) => Promise<void>;
    updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recentScans, setRecentScans] = useState<Product[]>([]);
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [cabinet, setCabinet] = useState<Product[]>([
        {
            id: 'initial_1',
            name: '1025 독도 토너',
            brand: '라운드랩',
            category: '토너/스킨',
            imageUrl: require('../assets/product_images/toner.png'),
            matchingScore: 92,
            skinType: 'DRNT',
            keyIngredients: [{ name: 'Deep Sea Water', nameKo: '해양심층수' }],
            warnings: [],
            reviews: '',
            price: 24000,
            expiryDate: '2025.12.31',
            isOpened: false
        },
        {
            id: 'initial_2',
            name: '다이브인 저분자 히알루론산 세럼',
            brand: '토리든',
            category: '세럼/앰플',
            imageUrl: require('../assets/product_images/cream.png'),
            matchingScore: 94,
            skinType: 'DSNT',
            keyIngredients: [{ name: 'Hyaluronic Acid', nameKo: '히알루론산' }],
            warnings: [],
            reviews: '',
            price: 22000,
            expiryDate: '2026.06.15',
            isOpened: true,
            openedDate: '2024.02.01'
        }
    ]);

    // Load from AsyncStorage on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedScans = await AsyncStorage.getItem('recent_scans');
            if (storedScans) {
                setRecentScans(JSON.parse(storedScans));
            }
            const storedWishlist = await AsyncStorage.getItem('clony_wishlist');
            if (storedWishlist) {
                const parsed = JSON.parse(storedWishlist);
                setWishlist(Array.isArray(parsed) ? parsed : []);
            }
            const storedCabinet = await AsyncStorage.getItem('clony_cabinet');
            if (storedCabinet) {
                setCabinet(JSON.parse(storedCabinet));
            }
        } catch (e) {
            console.error("Failed to load product data", e);
        }
    };

    const addProduct = async (product: Product) => {
        try {
            const newScans = [product, ...recentScans.filter(p => p.id !== product.id && p.name !== product.name)].slice(0, 20);
            setRecentScans(newScans);
            await AsyncStorage.setItem('recent_scans', JSON.stringify(newScans));
        } catch (e) {
            console.error("Failed to save product", e);
        }
    };

    const clearHistory = async () => {
        try {
            setRecentScans([]);
            await AsyncStorage.removeItem('recent_scans');
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    };

    const removeRecentScan = async (productId: string) => {
        try {
            const newScans = recentScans.filter(p => p.id !== productId);
            setRecentScans(newScans);
            await AsyncStorage.setItem('recent_scans', JSON.stringify(newScans));
        } catch (e) {
            console.error("Failed to remove recent scan", e);
        }
    };

    const toggleWishlist = async (product: Product) => {
        try {
            let newWishlist;
            const exists = wishlist.some(p => p.id === product.id);
            if (exists) {
                newWishlist = wishlist.filter(p => p.id !== product.id);
            } else {
                newWishlist = [product, ...wishlist];
            }
            setWishlist(newWishlist);
            await AsyncStorage.setItem('clony_wishlist', JSON.stringify(newWishlist));
        } catch (e) {
            console.error("Failed to toggle wishlist", e);
        }
    };

    const isWishlisted = (productId: string) => {
        return wishlist.some(p => p.id === productId);
    };

    const addToCabinet = async (product: Product) => {
        try {
            const exists = cabinet.some(p => p.id === product.id);
            if (!exists) {
                const newProduct = {
                    ...product,
                    expiryDate: product.expiryDate || '2026.12.31', // Default mock date
                    isOpened: false
                };
                const newCabinet = [newProduct, ...cabinet];
                setCabinet(newCabinet);
                await AsyncStorage.setItem('clony_cabinet', JSON.stringify(newCabinet));
            }
        } catch (e) {
            console.error("Failed to add to cabinet", e);
        }
    };

    const updateProduct = async (productId: string, updates: Partial<Product>) => {
        try {
            const newCabinet = cabinet.map(p => {
                if (p.id === productId) {
                    return { ...p, ...updates };
                }
                return p;
            });
            setCabinet(newCabinet);
            await AsyncStorage.setItem('clony_cabinet', JSON.stringify(newCabinet));
        } catch (e) {
            console.error("Failed to update product", e);
        }
    };

    const removeFromCabinet = async (productId: string) => {
        try {
            const newCabinet = cabinet.filter(p => p.id !== productId);
            setCabinet(newCabinet);
            await AsyncStorage.setItem('clony_cabinet', JSON.stringify(newCabinet));
        } catch (e) {
            console.error("Failed to remove from cabinet", e);
        }
    };

    return (
        <ProductContext.Provider value={{
            recentScans,
            wishlist,
            cabinet,
            addProduct,
            clearHistory,
            toggleWishlist,
            isWishlisted,
            addToCabinet,
            removeFromCabinet,
            removeRecentScan,
            updateProduct
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProduct = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProduct must be used within a ProductProvider');
    }
    return context;
};
