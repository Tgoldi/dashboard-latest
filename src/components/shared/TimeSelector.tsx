/** @jsxImportSource react */
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/useTheme";

interface TimeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TimeSelector({ value, onChange, placeholder = "Select time" }: TimeSelectorProps) {
    const { language } = useTheme();
    const isRTL = language === 'he';

    // Parse the current value
    const parseTimeValue = (fullValue: string): { from: string; to: string } => {
        const defaultValue = { from: '09:00', to: '18:00' };
        if (!fullValue) return defaultValue;

        const enMatch = fullValue.match(/from\s+(\d{2}:\d{2})\s+till\s+(\d{2}:\d{2})/);
        const heMatch = fullValue.match(/מ-(\d{2}:\d{2})\s+עד\s+(\d{2}:\d{2})/);
        
        if (enMatch) {
            return {
                from: enMatch[1],
                to: enMatch[2]
            };
        }
        
        if (heMatch) {
            return {
                from: heMatch[1],
                to: heMatch[2]
            };
        }

        return defaultValue;
    };

    const { from, to } = parseTimeValue(value);

    const handleFromChange = (newFrom: string) => {
        const format = isRTL ? `מ-${newFrom} עד ${to}` : `from ${newFrom} till ${to}`;
        onChange(format);
    };

    const handleToChange = (newTo: string) => {
        const format = isRTL ? `מ-${from} עד ${newTo}` : `from ${from} till ${newTo}`;
        onChange(format);
    };

    return (
        <div className="flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <Input
                type="time"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-[140px] text-right"
                dir="ltr"
            />
            <span className="text-sm text-muted-foreground">
                {isRTL ? "עד" : "till"}
            </span>
            <Input
                type="time"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-[140px] text-right"
                dir="ltr"
            />
        </div>
    );
} 