import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image, Dimensions, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnalysisResultProps {
    skinCode: string; // e.g., "OSNW"
    onClose: () => void;
    result?: any;
    score?: number;
}

const skinDescriptions: Record<string, any> = {
    "OSPT": { title: "트러블 유목민 지성 (OSPT)", desc: "피지가 많고 민감하며 잡티가 생기기 쉬운 타입입니다. 오일 프리 제품과 진정, 미백 관리가 동시에 필요합니다.", tags: ["지성", "민감성", "색소성", "탄력"] },
    "OSNT": { title: "겉은 번들, 속은 예민 (OSNT)", desc: "겉은 번들거리지만 속은 당기는 수분 부족형 지성입니다. 홍조나 트러블이 잦으니 유수분 밸런스와 진정에 집중하세요.", tags: ["지성", "민감성", "비색소", "탄력"] },
    "OSPW": { title: "자극 약한 어른 지성 (OSPW)", desc: "피지 분비가 활발하면서도 자극에 약하고 주름 고민이 있는 타입입니다. 저자극 안티에이징 케어가 필수적입니다.", tags: ["지성", "민감성", "색소성", "주름"] },
    "OSNW": { title: "예민하고 거친 지성 (OSNW)", desc: "민감한 지성이면서 피부 결이 거칠고 잔주름이 생기기 쉽습니다. 수분 공급과 장벽 강화에 신경 써주세요.", tags: ["지성", "민감성", "비색소", "주름"] },
    "ORPT": { title: "천하무적 건강 지성 (ORPT)", desc: "피지는 많지만 피부 장벽이 튼튼하고 잡티만 주의하면 되는 축복받은 지성입니다. 모공과 색소 관리에 집중하세요.", tags: ["지성", "저항성", "색소성", "탄력"] },
    "ORNT": { title: "축복받은 꿀광 지성 (ORNT)", desc: "피부 장벽이 매우 견고하고 탄력 있는 타입입니다. 과다 피지만 적절히 조절하면 최상의 피부 상태를 유지할 수 있습니다.", tags: ["지성", "저항성", "비색소", "탄력"] },
    "ORPW": { title: "잡티 고민 튼튼 지성 (ORPW)", desc: "피부가 튼튼하지만 유분으로 인한 트러블 흔적이나 주름이 고민인 타입입니다. 각질 관리와 레티놀 케어를 권장합니다.", tags: ["지성", "저항성", "색소성", "주름"] },
    "ORNW": { title: "관리 편한 노화 지성 (ORNW)", desc: "피지는 많지만 민감하지는 않은 노화 진행형 지성입니다. 강력한 안티에이징 성분도 잘 받아들이는 강점이 있습니다.", tags: ["지성", "저항성", "비색소", "주름"] },
    "DSPT": { title: "잡티 많은 민감 건성 (DSPT)", desc: "피부가 매우 건조하고 얇아서 외부 자극에 민감하며 잡티가 잘 생깁니다. 보습과 자외선 차단이 무엇보다 중요합니다.", tags: ["건성", "민감성", "색소성", "탄력"] },
    "DSNT": { title: "수분이 필요한 사막 피부 (DSNT)", desc: "피지 분비가 적어 매우 건조하며 장벽이 약해 쉽게 붉어집니다. 고보습 세라마이드 크림으로 장벽을 세워주세요.", tags: ["건성", "민감성", "비색소", "탄력"] },
    "DSPW": { title: "심술궂은 종합 고민형 (DSPW)", desc: "건조함, 민감도, 주름, 잡티 고민을 모두 가진 고난도 타입입니다. 충분한 영양 공급과 저자극 미백/항노화가 필요합니다.", tags: ["건성", "민감성", "색소성", "주름"] },
    "DSNW": { title: "주름 깊은 민감 건성 (DSNW)", desc: "매우 건조하고 예민하며 주름이 잘 생기는 타입입니다. 오일 성분이 포함된 고보습 항산화 제품을 추천합니다.", tags: ["건성", "민감성", "비색소", "주름"] },
    "DRPT": { title: "잡티 주의 건강 건성 (DRPT)", desc: "수분은 부족하지만 피부가 튼튼한 편입니다. 잡티가 생기기 쉬우니 비타민 C 성분과 보습을 함께 챙겨주세요.", tags: ["건성", "저항성", "색소성", "탄력"] },
    "DRNT": { title: "매끄러운 중건성 (DRNT)", desc: "피부가 건조한 편이지만 결이 매끄럽고 건강합니다. 수분 위주의 보습만 잘해주면 맑고 투명한 피부를 유지합니다.", tags: ["건성", "저항성", "비색소", "탄력"] },
    "DRPW": { title: "잡티/주름 건강 건성 (DRPW)", desc: "건조함으로 인해 주름이 깊어지기 쉽고 잡티가 눈에 띄는 타입입니다. 리치한 제형의 안티에이징 크림이 효과적입니다.", tags: ["건성", "저항성", "색소성", "주름"] },
    "DRNW": { title: "탄력 저하 건강 건성 (DRNW)", desc: "피부 장벽은 튼튼하지만 수분 부족으로 인한 주름이 고민인 타입입니다. 영양감이 풍부한 보습제로 탄력을 관리하세요.", tags: ["건성", "저항성", "비색소", "주름"] },
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, score, skinCode, onClose }) => {
    const profile = skinDescriptions[skinCode] || {
        title: `${skinCode} 타입`,
        desc: "피부 데이터 분석 결과, 맞춤형 관리가 필요한 상태입니다.",
        tags: [skinCode.includes('O') ? '지성' : '건성', skinCode.includes('S') ? '민감성' : '저항성']
    };

    // Axis Data for Chart
    const isOily = skinCode.includes('O');
    const isSensitive = skinCode.includes('S');
    const isPigmented = skinCode.includes('P');
    const isWrinkled = skinCode.includes('W');

    // --- Product Filter State ---
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const categories = ['전체', '클렌징', '토너/패드', '세럼/앰플', '보습', '선케어'];




    const handleShare = async () => {
        try {
            await Share.share({
                message: `[Clony 피부 진단] \n내 피부 타입은 ${skinCode}입니다! \n피부 점수: ${score}점 ✨\n#Clony #피부진단 #홈케어`,
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
                        <Text className="text-lg font-bold">분석 결과</Text>
                        <TouchableOpacity onPress={handleShare}>
                            <Ionicons name="share-social" size={28} color="black" />
                        </TouchableOpacity>
                    </View>



                    {/* Score Section */}
                    <View className="px-6 pt-6 pb-6 bg-white">
                        <Text className="text-gray-500 text-lg mb-1">나의 피부 타입은</Text>
                        <View className="flex-row items-baseline gap-2">
                            <Text className="text-4xl font-bold text-clony-primary">{skinCode}</Text>
                            <Text className="text-xl text-gray-800 font-bold">{profile.title}</Text>
                        </View>
                    </View>



                    {/* Chart Section */}
                    <View className="mt-8 px-6">
                        <Text className="text-gray-900 font-bold text-lg mb-6 text-center">피부 균형 보고서</Text>

                        {/* Row 1: Hydration */}
                        <View className="mb-6">
                            <View className="flex-row justify-between mb-2">
                                <Text className={`font-bold text-xs ${!isOily ? 'text-clony-primary' : 'text-gray-300'}`}>DRY (건성)</Text>
                                <Text className={`font-bold text-xs ${isOily ? 'text-clony-primary' : 'text-gray-300'}`}>OILY (지성)</Text>
                            </View>
                            <View className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                                <View className={`absolute top-0 bottom-0 w-1/2 bg-clony-primary rounded-full ${isOily ? 'right-0' : 'left-0'}`} />
                            </View>
                        </View>

                        {/* Row 2: Sensitivity */}
                        <View className="mb-6">
                            <View className="flex-row justify-between mb-2">
                                <Text className={`font-bold text-xs ${!isSensitive ? 'text-clony-primary' : 'text-gray-300'}`}>RESISTANT</Text>
                                <Text className={`font-bold text-xs ${isSensitive ? 'text-clony-primary' : 'text-gray-300'}`}>SENSITIVE</Text>
                            </View>
                            <View className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                                <View className={`absolute top-0 bottom-0 w-1/2 bg-clony-primary rounded-full ${isSensitive ? 'right-0' : 'left-0'}`} />
                            </View>
                        </View>

                        {/* Row 3: Pigmentation */}
                        <View className="mb-6">
                            <View className="flex-row justify-between mb-2">
                                <Text className={`font-bold text-xs ${!isPigmented ? 'text-clony-primary' : 'text-gray-300'}`}>NON-PIGMENTED</Text>
                                <Text className={`font-bold text-xs ${isPigmented ? 'text-clony-primary' : 'text-gray-300'}`}>PIGMENTED</Text>
                            </View>
                            <View className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                                <View className={`absolute top-0 bottom-0 w-1/2 bg-clony-primary rounded-full ${isPigmented ? 'right-0' : 'left-0'}`} />
                            </View>
                        </View>

                        {/* Row 4: Wrinkle */}
                        <View>
                            <View className="flex-row justify-between mb-2">
                                <Text className={`font-bold text-xs ${!isWrinkled ? 'text-clony-primary' : 'text-gray-300'}`}>TIGHT (탄력)</Text>
                                <Text className={`font-bold text-xs ${isWrinkled ? 'text-clony-primary' : 'text-gray-300'}`}>WRINKLED (주름)</Text>
                            </View>
                            <View className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                                <View className={`absolute top-0 bottom-0 w-1/2 bg-clony-primary rounded-full ${isWrinkled ? 'right-0' : 'left-0'}`} />
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <View className="px-6 mt-8 mb-12">
                        {/* Product Recommendations */}
                        <Text className="text-gray-900 font-bold text-lg mb-4">맞춤 솔루션 제품</Text>

                        {/* Category Filter Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            <View className="flex-row gap-2 pr-4">
                                {categories.map((cat, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={`text-xs font-bold ${selectedCategory === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Product List */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                            {getFilteredProducts(skinCode, selectedCategory).map((product, index) => (
                                <TouchableOpacity key={index} className="bg-white rounded-xl w-40 border border-gray-100 p-3 shadow-sm mr-4">
                                    <View className="w-full h-32 bg-gray-50 rounded-lg mb-3 items-center justify-center">
                                        <Ionicons name="cube-outline" size={40} color="#ccc" />
                                    </View>
                                    <View className="flex-row items-center gap-1 mb-1">
                                        <View className="bg-clony-primary/10 px-1.5 py-0.5 rounded">
                                            <Text className="text-[10px] text-clony-primary font-bold">{product.category}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-900 font-bold text-sm mb-1 leading-tight">{product.name}</Text>
                                    <Text className="text-gray-400 text-[10px]">{product.reason}</Text>
                                </TouchableOpacity>
                            ))}
                            {getFilteredProducts(skinCode, selectedCategory).length === 0 && (
                                <View className="w-full h-32 items-center justify-center bg-gray-50 rounded-xl px-4">
                                    <Text className="text-gray-400 text-sm">해당 카테고리의 추천 제품이 없습니다.</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Medical Disclaimer */}
                        <View className="mt-8 mb-4 px-2">
                            <Text className="text-gray-400 text-[10px] text-center leading-relaxed">
                                본 결과는 AI 분석에 기반한 참고용 데이터이며, 의학적 진단이 아닙니다. 정확한 진단과 처방은 전문의와 상담하시기 바랍니다.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-black py-4 rounded-2xl items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">홈으로 돌아가기</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </Modal>
    );
};

// --- Product Database (Real MVP Data) ---
const PRODUCT_DB = {
    O: [ // Oily (지성)
        { name: "닥터지 레드 블레미쉬 클리어 수딩 크림", category: "보습", reason: "피지는 잡고 수분은 채워주는 지성 필수템" },
        { name: "아누아 어성초 77 토너", category: "토너", reason: "과다 피지와 트러블 진정에 효과적" },
        { name: "이니스프리 노세범 미네랄 파우더", category: "선케어", reason: "번들거리는 유분을 뽀송하게 잡아줌" },
        { name: "라운드랩 독도 클렌저", category: "클렌징", reason: "미세먼지와 노폐물을 말끔하게 세정" }
    ],
    D: [ // Dry (건성)
        { name: "토리든 다이브인 저분자 히알루론산 세럼", category: "세럼", reason: "속건조를 해결하는 수분 폭탄" },
        { name: "피지오겔 DMT 페이셜 크림", category: "보습", reason: "72시간 지속되는 강력한 보습 장벽" },
        { name: "바이오더마 센시비오 H2O", category: "클렌징", reason: "세안 후에도 당김 없는 촉촉한 클렌징" },
        { name: "달바 워터풀 에센스 선크림", category: "선케어", reason: "로션처럼 촉촉한 수분광 선크림" }
    ],
    S: [ // Sensitive (민감성)
        { name: "에스트라 아토베리어365 크림", category: "보습", reason: "무너진 피부 장벽을 탄탄하게 복구" },
        { name: "라로슈포제 시카플라스트 밤 B5", category: "보습", reason: "손상된 피부를 급속 진정시키는 SOS 크림" },
        { name: "메디힐 티트리 트러블 패드", category: "패드", reason: "자극 없이 순하게 진정 케어" },
        { name: "닥터지 그린 마일드 업 선 플러스", category: "선케어", reason: "민감한 피부도 안심하는 무기자차" }
    ],
    R: [ // Resistant (저항성/건강)
        { name: "구달 청귤 비타C 잡티 세럼", category: "세럼", reason: "피부를 더 맑고 생기있게 톤업" },
        { name: "마녀공장 퓨어 클렌징 오일", category: "클렌징", reason: "블랙헤드와 피지를 부드럽게 녹여줌" },
        { name: "스킨푸드 당근 패드", category: "패드", reason: "수분 충전과 피부결 정돈을 동시에" }
    ],
    N: [ // Non-Pigmented (비색소)
        { name: "라운드랩 자작나무 수분 선크림", category: "선케어", reason: "백탁 없이 산뜻한 데일리 선크림" },
        { name: "웰라쥬 리얼 히알루로닉 블루 100", category: "세럼", reason: "순도 100% 히알루론산의 수분 광채" }
    ],
    P: [ // Pigmented (색소성)
        { name: "아이소이 잡티 세럼", category: "세럼", reason: "거뭇한 잡티와 흔적을 지워주는 1등 세럼" },
        { name: "넘버즈인 5번 글루타치온 필름 패드", category: "패드", reason: "항산화 성분으로 붙이는 미백 케어" },
        { name: "미샤 비타씨플러스 잡티씨 앰플", category: "세럼", reason: "기미와 주근깨를 집중적으로 케어" }
    ],
    W: [ // Wrinkled (주름)
        { name: "설화수 자음생크림", category: "보습", reason: "피부 자생력을 높여 탄력을 되살림" },
        { name: "AHC 텐 레볼루션 리얼 아이크림", category: "보습", reason: "얼굴 전체에 바르는 고농축 안티에이징" },
        { name: "닥터지 블랙 스네일 크림", category: "보습", reason: "쫀쫀한 영양감으로 주름과 탄력 케어" }
    ],
    T: [ // Tight (탄력/탱탱)
        { name: "메디힐 콜라겐 채움 패드", category: "패드", reason: "처진 피부에 쫀쫀한 힘을 채워줌" },
        { name: "CNP 프로폴리스 에너지 앰플", category: "세럼", reason: "꿀광 피부를 위한 집중 영양 공급" }
    ]
};

const getFilteredProducts = (code: string, category: string) => {
    // 1. Gather all tailored recommendations
    const traits = [code[0], code[1], code[2], code[3]]; // e.g. ['O', 'S', 'N', 'W']
    let allRecs: any[] = [];

    traits.forEach(trait => {
        if (PRODUCT_DB[trait as keyof typeof PRODUCT_DB]) {
            allRecs = [...allRecs, ...PRODUCT_DB[trait as keyof typeof PRODUCT_DB]];
        }
    });

    // 2. Dedup by name
    allRecs = Array.from(new Set(allRecs.map(a => a.name)))
        .map(name => {
            return allRecs.find(a => a.name === name);
        });

    // 3. Filter by Category
    let filteredRecs = allRecs;
    if (category !== '전체') {
        filteredRecs = allRecs.filter(p => {
            if (category === '토너/패드') return p.category === '토너' || p.category === '패드';
            if (category === '세럼/앰플') return p.category === '세럼' || p.category === '앰플';
            return p.category === category;
        });
    }

    return filteredRecs.slice(0, 10); // Limit to 10
};


export default AnalysisResult;
