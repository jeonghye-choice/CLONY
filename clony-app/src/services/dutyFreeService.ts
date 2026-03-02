import * as Location from 'expo-location';

export interface Store {
    id: string;
    name: string;
    type: 'OliveYoung' | 'DutyFree' | 'Chicor';
    latitude: number;
    longitude: number;
    address: string;
    distance?: string;
    openTime: string;  // HH:mm
    closeTime: string; // HH:mm
}

export interface ExchangeRate {
    USD: number;
    JPY: number;
    EUR: number;
}

// Mock Data for Diverse Locations (Myeongdong, Gangnam, Seongsu, Hongdae)
const MOCK_STORES: any[] = [
    // Myeongdong Area
    { id: 'md_1', name: '올리브영 명동 플래그십', nameEn: 'Olive Young Myeongdong Flagship', type: 'OliveYoung', latitude: 37.5644, longitude: 126.9850, address: '서울특별시 중구 명동길 53', addressEn: '53 Myeongdong-gil, Jung-gu, Seoul', openTime: '10:00', closeTime: '22:30' },
    { id: 'md_2', name: '신세계면세점 명동점', nameEn: 'Shinsegae Duty Free Myeongdong', type: 'DutyFree', latitude: 37.5608, longitude: 126.9814, address: '서울특별시 중구 퇴계로 77', addressEn: '77 Toegye-ro, Jung-gu, Seoul', openTime: '10:30', closeTime: '20:00' },
    // Gangnam Area
    { id: 'gn_1', name: '올리브영 강남타운', nameEn: 'Olive Young Gangnam Town', type: 'OliveYoung', latitude: 37.5023, longitude: 127.0270, address: '서울특별시 서초구 강남대로 429', addressEn: '429 Gangnam-daero, Seocho-gu, Seoul', openTime: '10:00', closeTime: '22:30' },
    { id: 'gn_2', name: '올리브영 강남중앙점', nameEn: 'Olive Young Gangnam Central', type: 'OliveYoung', latitude: 37.4986, longitude: 127.0278, address: '서울특별시 강남구 강남대로 372', addressEn: '372 Gangnam-daero, Gangnam-gu, Seoul', openTime: '10:00', closeTime: '22:00' },
    // Seongsu Area
    { id: 'ss_1', name: '올리브영 N 성수', nameEn: 'Olive Young N Seongsu', type: 'OliveYoung', latitude: 37.5435, longitude: 127.0543, address: '서울특별시 성동구 연무장7길 13', addressEn: '13 Yeonmujang 7-gil, Seongdong-gu, Seoul', openTime: '10:00', closeTime: '22:00' },
    { id: 'ss_2', name: '올리브영 성수역점', nameEn: 'Olive Young Seongsu Station', type: 'OliveYoung', latitude: 37.5445, longitude: 127.0560, address: '서울특별시 성동구 아차산로 91', addressEn: '91 Achasan-ro, Seongdong-gu, Seoul', openTime: '10:00', closeTime: '22:00' },
    // Hongdae Area
    { id: 'hd_1', name: '올리브영 홍대타운', nameEn: 'Olive Young Hongdae Town', type: 'OliveYoung', latitude: 37.5562, longitude: 126.9230, address: '서울특별시 마포구 양화로 156', addressEn: '156 Yanghwa-ro, Mapo-gu, Seoul', openTime: '10:00', closeTime: '22:30' },
];

// Mock Exchange Rates (KRW to target)
const MOCK_RATES: ExchangeRate = {
    USD: 0.00075, // 1330 KRW
    JPY: 0.11,    // 900 KRW
    EUR: 0.00069, // 1450 KRW
};

export const isStoreOpen = (store: Store): boolean => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= store.openTime && currentTime <= store.closeTime;
};

/** Haversine formula — returns distance in kilometers between two lat/lon points */
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getNearbyStores = async (): Promise<Store[]> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Location permission denied — returning default stores');
            // Fallback: attach Seoul center distances
            const fallbackLat = 37.5665, fallbackLon = 126.9780;
            const fallbackStores = MOCK_STORES.map(store => {
                const km = haversineKm(fallbackLat, fallbackLon, store.latitude, store.longitude);
                return {
                    ...store,
                    distance: km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`,
                    rawDistance: km
                };
            });
            return fallbackStores.sort((a, b) => a.rawDistance - b.rawDistance).slice(0, 4);
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        const userLat = location.coords.latitude;
        const userLon = location.coords.longitude;

        console.log(`[GPS] User location → Lat ${userLat.toFixed(5)}, Lon ${userLon.toFixed(5)}`);

        const storesWithDistance = MOCK_STORES.map(store => {
            const km = haversineKm(userLat, userLon, store.latitude, store.longitude);
            return {
                ...store,
                distance: km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`,
                rawDistance: km,
            };
        });

        return storesWithDistance
            .sort((a, b) => (a as any).rawDistance - (b as any).rawDistance)
            .filter(store => (store as any).rawDistance <= 50) // 50km 이내 매장만
            .slice(0, 4); // 가장 가까운 4개
    } catch (error) {
        console.error('[GPS] Error fetching location:', error);
        return MOCK_STORES.slice(0, 3);
    }
};

export const convertPrice = (priceKRW: number, currency: keyof ExchangeRate): string => {
    const rate = MOCK_RATES[currency];
    const converted = priceKRW * rate;

    if (currency === 'USD') return `$${converted.toFixed(2)}`;
    if (currency === 'EUR') return `€${converted.toFixed(2)}`;
    if (currency === 'JPY') return `¥${converted.toFixed(0)}`;
    return `${priceKRW.toLocaleString()}원`;
};

export const calculateDutyFreePrice = (priceKRW: number): number => {
    return Math.floor(priceKRW * 0.88);
};
