import React from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface InteractiveMapProps {
    stores: any[];
    language: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ stores, language }) => {
    if (stores.length === 0) return null;

    return (
        <MapView
            key={`${stores[0].latitude}-${stores[0].longitude}`}
            style={{ width: '100%', height: '100%' }}
            initialRegion={{
                latitude: stores[0].latitude,
                longitude: stores[0].longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
        >
            {stores.map((store: any) => (
                <Marker
                    key={store.id}
                    coordinate={{
                        latitude: store.latitude,
                        longitude: store.longitude,
                    }}
                    title={language === 'en' ? (store.nameEn || store.name) : store.name}
                    description={language === 'en' ? (store.addressEn || store.address) : store.address}
                />
            ))}
        </MapView>
    );
};

export default InteractiveMap;
