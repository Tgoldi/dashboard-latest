import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '@/contexts/useTheme';
import { TranslationKey } from '@/utils/translations';
import { convertToCSV, downloadCSV, formatCallStatsForCSV } from '@/utils/csvExport';
import { format } from 'date-fns';
import { useUser } from '@/contexts/useUser';
import { Button } from '@/components/ui/button';

interface CallStatsPieChartProps {
    data: {
        completed: number;
        failed: number;
        userHangup: number;
        assistantHangup: number;
    };
}

const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24'];

// Map data keys to translation keys
const translationKeys: Record<keyof CallStatsPieChartProps['data'], TranslationKey> = {
    completed: 'completed',
    failed: 'failed',
    userHangup: 'userHangup',
    assistantHangup: 'assistantHangup'
};

// Define the type for the Legend entry
interface LegendEntry {
    value: string;
    payload: {
        name: string;
        value: number;
        percentage: string;
    };
}

export function CallStatsPieChart({ data }: CallStatsPieChartProps) {
    const { t, language } = useTheme();
    const { user } = useUser();
    const isRTL = language === 'he';

    // Calculate total
    const total = Object.values(data).reduce((a, b) => a + b, 0);

    // Filter out categories with zero values and create chart data
    const chartData = Object.entries(data)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
            name: t(translationKeys[key as keyof typeof data]),
            value: value,
            percentage: ((value / total) * 100).toFixed(0)
        }));

    const handleExport = () => {
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) return;

        const headers = {
            date: t('date'),
            calls: t('calls'),
            total_calls: t('totalCalls'),
            incoming_calls: t('incomingCalls'),
            average_duration: t('averageDuration')
        };

        const csvData = formatCallStatsForCSV({
            totalCalls: Object.values(data).reduce((a, b) => a + b, 0),
            incomingCalls: data.completed || 0,
            averageDuration: 0, // Since we don't have this data in the pie chart
            callsPerDay: [{
                date: format(new Date(), 'yyyy-MM-dd'),
                calls: Object.values(data).reduce((a, b) => a + b, 0)
            }]
        });
        const csvContent = convertToCSV(csvData, headers);
        downloadCSV(csvContent, `call-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">{t('noResults')}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-end mb-4">
                {(user?.role === 'owner' || user?.role === 'admin') && (
                    <Button onClick={handleExport} variant="outline">
                        {t('exportCSV')}
                    </Button>
                )}
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => {
                            const item = chartData.find(d => d.name === value);
                            return `${value}: ${item?.value} (${item?.percentage}%)`;
                        }}
                        wrapperStyle={{
                            paddingTop: '20px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
} 