import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportScreen = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);

    const calendarData: { [key: number]: number } = {
        1: 85,
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const isFutureDate = (day: number) => {
        const today = new Date();
        if (currentDate.getFullYear() > today.getFullYear() ||
            (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() > today.getMonth())) {
            return true;
        }
        if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
            return day > today.getDate();
        }
        return false;
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-clony-primary";
        if (score >= 60) return "bg-yellow-400";
        return "bg-red-400";
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="pt-14 px-6 pb-6 bg-white border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">Skin Report</Text>
                <Text className="text-gray-500">이번 달 피부 변화를 확인하세요</Text>
            </View>

            <View className="flex-row justify-between items-center px-8 py-6">
                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                    <Ionicons name="chevron-forward" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            <View className="px-6 mb-10">
                <View className="flex-row mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <View key={d} className="flex-1 items-center">
                            <Text className={`font-bold ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</Text>
                        </View>
                    ))}
                </View>

                <View className="flex-row flex-wrap">
                    {days.map((day, idx) => {
                        const score = (day && !isFutureDate(day)) ? calendarData[day] : null;

                        return (
                            <TouchableOpacity
                                key={idx}
                                disabled={!day || (!!day && isFutureDate(day))}
                                onPress={() => day && setSelectedDate(day)}
                                className="w-[14.28%] aspect-square items-center justify-center relative mb-2"
                            >
                                {day && (
                                    <>
                                        <View className={`w-8 h-8 rounded-full items-center justify-center ${selectedDate === day ? 'bg-gray-900' : ''} ${isFutureDate(day) ? 'opacity-30' : ''}`}>
                                            <Text className={`font-bold ${selectedDate === day ? 'text-white' : (idx % 7 === 0 ? 'text-red-400' : 'text-gray-800')}`}>{day}</Text>
                                        </View>
                                        {score && (
                                            <View className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${getScoreColor(score)}`} />
                                        )}
                                    </>
                                )}
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </View>

            <View className="px-6 pb-20">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                    {selectedDate ? `${currentDate.getMonth() + 1}월 ${selectedDate}일 리포트` : '날짜를 선택해주세요'}
                </Text>

                {selectedDate && calendarData[selectedDate] ? (
                    <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-gray-500 font-bold">피부 점수</Text>
                            <View className={`px-3 py-1 rounded-full ${getScoreColor(calendarData[selectedDate])}`}>
                                <Text className="text-white font-bold">{calendarData[selectedDate]}점</Text>
                            </View>
                        </View>
                        <Text className="text-gray-800 leading-relaxed">
                            {calendarData[selectedDate] >= 80 ? "피부 상태가 아주 좋아요! 💧 수분 관리가 잘 되고 있습니다." :
                                calendarData[selectedDate] >= 60 ? "평범한 상태입니다. 😐 자외선 차단에 조금 더 신경 써주세요." :
                                    "피부 컨디션이 좋지 않아요. 🚨 충분한 수면과 보습이 필요합니다."}
                        </Text>
                    </View>
                ) : (
                    <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100 items-center">
                        <Text className="text-gray-400">기록된 데이터가 없습니다.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default ReportScreen;
