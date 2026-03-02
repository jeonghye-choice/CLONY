import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image, Dimensions, Share, Alert, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface AnalysisResultProps {
    skinCode: string; // e.g., "OSNW"
    onClose: () => void;
    result?: any;
    score?: number;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, score, skinCode, onClose }) => {
    const { t } = useTranslation();

    const skinDescription = t(`analysis.descriptions.${skinCode}`, { defaultValue: t('home.cabinet.skin_types.unknown') });
    const skinTitle = t(`home.cabinet.skin_types.${skinCode}`, { defaultValue: skinCode });

    // --- Axis Data for Chart (Normalize 0-100) ---
    const data = [
        { label: t('analysis.traits.oily'), value: skinCode.includes('O') ? 90 : 20 },
        { label: t('analysis.traits.sensitive'), value: skinCode.includes('S') ? 85 : 15 },
        { label: t('analysis.traits.pigmented'), value: skinCode.includes('P') ? 80 : 25 },
        { label: t('analysis.traits.wrinkled'), value: skinCode.includes('W') ? 75 : 30 },
        { label: t('analysis.traits.active'), value: 70 }, // Potential for more data
    ];

    const radarSize = width * 0.8; // Increase container slightly
    const center = radarSize / 2;
    const radius = (radarSize / 2) * 0.65; // Decrease radius to give more space for labels
    const angleStep = (Math.PI * 2) / data.length;

    const getCoordinates = (value: number, angle: number) => {
        const x = center + (radius * (value / 100)) * Math.cos(angle - Math.PI / 2);
        const y = center + (radius * (value / 100)) * Math.sin(angle - Math.PI / 2);
        return `${x},${y}`;
    };

    const points = data.map((d, i) => getCoordinates(d.value, i * angleStep)).join(' ');
    const gridPoints = [20, 40, 60, 80, 100].map(level =>
        data.map((_, i) => getCoordinates(level, i * angleStep)).join(' ')
    );

    // --- Product Filter State ---
    const [selectedCategory, setSelectedCategory] = useState('all');
    const categoryKeys = ['all', 'cleansing', 'toner', 'serum', 'moisturizing', 'suncare'];

    const handleShare = async () => {
        try {
            await Share.share({
                message: `[Clony Skin Analysis] \nMy skin type is ${skinCode} (${skinTitle})! \nScore: ${score} ✨\n#Clony #SkinCare #AIAnalysis`,
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    return (
        <Modal animationType="slide" transparent={false} visible={true}>
            <View className="flex-1 bg-white">
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Header */}
                    <View className="p-6 pt-12 flex-row justify-between items-center">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="black" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold">{t('analysis.title')}</Text>
                        <TouchableOpacity onPress={handleShare}>
                            <Ionicons name="share-social" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Score Section */}
                    <View className="px-6 pt-6 pb-4 bg-white">
                        <Text className="text-gray-500 text-lg mb-1">{t('analysis.subtitle')}</Text>
                        <View className="flex-row items-baseline gap-2">
                            <Text className="text-4xl font-bold text-clony-primary">{skinCode}</Text>
                        </View>
                        <Text className="text-xl text-gray-800 font-bold mt-1">{skinTitle}</Text>
                    </View>

                    {/* Skin MBTI Detailed Analysis - NEW */}
                    <View className="px-6 mb-8">
                        <View className="bg-clony-primary/5 rounded-[32px] p-6 border border-clony-primary/10">
                            <Text className="text-gray-900 font-bold text-lg mb-1">{t('baumann.detail.title')}</Text>

                            {/* Dimension 1: Oily vs Dry */}
                            <View className="mb-6">
                                <View className="flex-row justify-between mb-2">
                                    <Text className={`text-xs font-bold ${skinCode[0] === 'D' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.od_dry')}</Text>
                                    <View className="bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                        <Text className="text-[10px] font-black text-gray-900">{t('baumann.detail.od_title')}</Text>
                                    </View>
                                    <Text className={`text-xs font-bold ${skinCode[0] === 'O' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.od_oily')}</Text>
                                </View>
                                <View className="h-3 bg-white rounded-full overflow-hidden flex-row border border-gray-50">
                                    <View className={`h-full ${skinCode[0] === 'D' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[0] === 'D' ? 70 : 30 }} />
                                    <View className="w-[1px] h-full bg-gray-200" />
                                    <View className={`h-full ${skinCode[0] === 'O' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[0] === 'O' ? 70 : 30 }} />
                                </View>
                            </View>

                            {/* Dimension 2: Sensitive vs Resistant */}
                            <View className="mb-6">
                                <View className="flex-row justify-between mb-2">
                                    <Text className={`text-xs font-bold ${skinCode[1] === 'R' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.sr_resistant')}</Text>
                                    <View className="bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                        <Text className="text-[10px] font-black text-gray-900">{t('baumann.detail.sr_title')}</Text>
                                    </View>
                                    <Text className={`text-xs font-bold ${skinCode[1] === 'S' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.sr_sensitive')}</Text>
                                </View>
                                <View className="h-3 bg-white rounded-full overflow-hidden flex-row border border-gray-50">
                                    <View className={`h-full ${skinCode[1] === 'R' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[1] === 'R' ? 80 : 20 }} />
                                    <View className="w-[1px] h-full bg-gray-200" />
                                    <View className={`h-full ${skinCode[1] === 'S' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[1] === 'S' ? 80 : 20 }} />
                                </View>
                            </View>

                            {/* Dimension 3: Pigmented vs Non-pigmented */}
                            <View className="mb-6">
                                <View className="flex-row justify-between mb-2">
                                    <Text className={`text-xs font-bold ${skinCode[2] === 'N' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.pn_non')}</Text>
                                    <View className="bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                        <Text className="text-[10px] font-black text-gray-900">{t('baumann.detail.pn_title')}</Text>
                                    </View>
                                    <Text className={`text-xs font-bold ${skinCode[2] === 'P' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.pn_pigmented')}</Text>
                                </View>
                                <View className="h-3 bg-white rounded-full overflow-hidden flex-row border border-gray-50">
                                    <View className={`h-full ${skinCode[2] === 'N' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[2] === 'N' ? 65 : 35 }} />
                                    <View className="w-[1px] h-full bg-gray-200" />
                                    <View className={`h-full ${skinCode[2] === 'P' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[2] === 'P' ? 65 : 35 }} />
                                </View>
                            </View>

                            {/* Dimension 4: Wrinkled vs Tight */}
                            <View>
                                <View className="flex-row justify-between mb-2">
                                    <Text className={`text-xs font-bold ${skinCode[3] === 'T' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.tw_tight')}</Text>
                                    <View className="bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                        <Text className="text-[10px] font-black text-gray-900">{t('baumann.detail.tw_title')}</Text>
                                    </View>
                                    <Text className={`text-xs font-bold ${skinCode[3] === 'W' ? 'text-clony-primary' : 'text-gray-400'}`}>{t('baumann.detail.tw_wrinkled')}</Text>
                                </View>
                                <View className="h-3 bg-white rounded-full overflow-hidden flex-row border border-gray-50">
                                    <View className={`h-full ${skinCode[3] === 'T' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[3] === 'T' ? 75 : 25 }} />
                                    <View className="w-[1px] h-full bg-gray-200" />
                                    <View className={`h-full ${skinCode[3] === 'W' ? 'bg-clony-primary' : 'bg-gray-100'}`} style={{ flex: skinCode[3] === 'W' ? 75 : 25 }} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Chart Section (Radar Graph Style) */}
                    <View className="mt-4 px-6 items-center">
                        <View className="bg-[#F8FAFC] rounded-[40px] p-6 w-full items-center shadow-sm border border-gray-100">
                            <Text className="text-gray-900 font-black text-[22px] mb-8 w-full text-left">
                                {t('analysis.balance_report')}
                            </Text>

                            <View style={{ width: radarSize, height: radarSize }}>
                                <Svg width={radarSize} height={radarSize}>
                                    <G>
                                        {/* Grid Background */}
                                        {gridPoints.map((gp, i) => (
                                            <Polygon
                                                key={i}
                                                points={gp}
                                                fill="none"
                                                stroke="#E2E8F0"
                                                strokeWidth="1"
                                            />
                                        ))}

                                        {/* Axis Lines */}
                                        {data.map((_, i) => {
                                            const end = getCoordinates(100, i * angleStep).split(',');
                                            return (
                                                <Line
                                                    key={i}
                                                    x1={center}
                                                    y1={center}
                                                    x2={end[0]}
                                                    y2={end[1]}
                                                    stroke="#E2E8F0"
                                                    strokeWidth="1"
                                                />
                                            );
                                        })}

                                        {/* Data Polygon */}
                                        <Polygon
                                            points={points}
                                            fill="rgba(0, 166, 118, 0.2)"
                                            stroke="#00A676"
                                            strokeWidth="3"
                                        />

                                        {/* Labels */}
                                        {data.map((d, i) => {
                                            const pos = getCoordinates(125, i * angleStep).split(',');
                                            return (
                                                <SvgText
                                                    key={i}
                                                    x={pos[0]}
                                                    y={pos[1]}
                                                    fill="#64748B"
                                                    fontSize="10"
                                                    fontWeight="bold"
                                                    textAnchor="middle"
                                                    alignmentBaseline="middle"
                                                >
                                                    {d.label}
                                                </SvgText>
                                            );
                                        })}
                                    </G>
                                </Svg>
                            </View>

                            <View className="mt-8 flex-row gap-6 w-full justify-center">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-3 h-3 rounded-full bg-[#00A676]" />
                                    <Text className="text-xs text-gray-500 font-bold">{t('analysis.traits.current_status')}</Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-3 h-3 rounded-full bg-gray-200" />
                                    <Text className="text-xs text-gray-500 font-bold">{t('analysis.traits.average')}</Text>
                                </View>
                            </View>
                        </View>
                    </View>


                    {/* Action Button */}
                    <View className="px-6 mt-12 mb-12">
                        {/* Product Recommendations */}
                        <Text className="text-gray-900 font-bold text-lg mb-4">{t('analysis.solution_title')}</Text>

                        {/* Category Filter Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            <View className="flex-row gap-2 pr-4">
                                {categoryKeys.map((key, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedCategory(key)}
                                        className={`px-4 py-2 rounded-full border ${selectedCategory === key ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={`text-xs font-bold ${selectedCategory === key ? 'text-white' : 'text-gray-500'}`}>{t(`analysis.categories.${key}`)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Product List */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                            {getFilteredProducts(skinCode, selectedCategory, t).map((product, index) => (
                                <TouchableOpacity key={index} className="bg-white rounded-xl w-40 border border-gray-100 p-3 shadow-sm mr-4">
                                    <View className="w-full h-32 bg-gray-50 rounded-lg mb-3 items-center justify-center">
                                        <Ionicons name="cube-outline" size={40} color="#ccc" />
                                    </View>
                                    <View className="flex-row items-center gap-1 mb-1">
                                        <View className="bg-clony-primary/10 px-1.5 py-0.5 rounded">
                                            <Text className="text-[10px] text-clony-primary font-bold">{product.categoryLabel}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-900 font-bold text-sm mb-1 leading-tight">{product.name}</Text>
                                    <Text className="text-gray-400 text-[10px]">{product.reason}</Text>
                                </TouchableOpacity>
                            ))}
                            {getFilteredProducts(skinCode, selectedCategory, t).length === 0 && (
                                <View className="w-full h-32 items-center justify-center bg-gray-50 rounded-xl px-4">
                                    <Text className="text-gray-400 text-sm">{t('analysis.no_recommendations')}</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Medical Disclaimer */}
                        <View className="mt-8 mb-4 px-2">
                            <Text className="text-gray-400 text-[10px] text-center leading-relaxed">
                                {t('analysis.disclaimer')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-black py-4 rounded-2xl items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">{t('analysis.back_to_home')}</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </Modal>
    );
};

// --- Product Database (Keys for i18n) ---
const PRODUCT_DB: Record<string, any[]> = {
    O: [
        { id: "dr_g_red_blemish", category: "moisturizing" },
        { id: "anua_heartleaf_77", category: "toner" },
        { id: "innisfree_no_sebum", category: "suncare" },
        { id: "round_lab_dokdo_cleanser", category: "cleansing" }
    ],
    D: [
        { id: "torriden_dive_in", category: "serum" },
        { id: "physiogel_dmt", category: "moisturizing" },
        { id: "bioderma_sensibio", category: "cleansing" },
        { id: "dalba_waterfull", category: "suncare" }
    ],
    S: [
        { id: "aestura_atobarrier", category: "moisturizing" },
        { id: "laroche_posay_cica", category: "moisturizing" },
        { id: "mediheal_teatree_pad", category: "toner" },
        { id: "dr_g_green_mild", category: "suncare" }
    ],
    R: [
        { id: "goodal_vit_c", category: "serum" },
        { id: "ma_nyo_pure_oil", category: "cleansing" },
        { id: "skinfood_carrot_pad", category: "toner" }
    ],
    N: [
        { id: "round_lab_birch_sun", category: "suncare" },
        { id: "wellage_hyaluronic", category: "serum" }
    ],
    P: [
        { id: "isoi_blemish", category: "serum" },
        { id: "numbuzin_5_pad", category: "toner" },
        { id: "missha_vit_c", category: "serum" }
    ],
    W: [
        { id: "sulwhasoo_ginseng", category: "moisturizing" },
        { id: "ahc_eye_cream", category: "moisturizing" },
        { id: "dr_g_black_snail", category: "moisturizing" }
    ],
    T: [
        { id: "mediheal_collagen_pad", category: "toner" },
        { id: "cnp_propolis", category: "serum" }
    ]
};

const getFilteredProducts = (code: string, category: string, t: any) => {
    const traits = [code[0], code[1], code[2], code[3]];
    let allRecs: any[] = [];

    traits.forEach(trait => {
        if (PRODUCT_DB[trait]) {
            allRecs = [...allRecs, ...PRODUCT_DB[trait]];
        }
    });

    // Dedup by id
    allRecs = Array.from(new Set(allRecs.map(a => a.id)))
        .map(id => {
            const base = allRecs.find(a => a.id === id);
            return {
                ...base,
                name: t(`products.${id}.name`),
                reason: t(`products.${id}.reason`),
                categoryLabel: t(`analysis.categories.${base.category}`)
            };
        });

    let filteredRecs = allRecs;
    if (category !== 'all') {
        filteredRecs = allRecs.filter(p => p.category === category);
    }

    return filteredRecs.slice(0, 10);
};

export default AnalysisResult;
