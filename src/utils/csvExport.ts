import { PhoneNumber } from '@/services/vapiService';

export interface ExportableData {
    [key: string]: string | number | boolean | null | undefined;
}

interface Ticket {
    id: string;
    status: string;
    createdAt: string;
    duration?: number;
    summary?: string;
    costs?: {
        total: number;
        stt: number;
        llm: number;
        tts: number;
        vapi: number;
    };
}

interface CallStats {
    totalCalls: number;
    incomingCalls: number;
    averageDuration: number;
    callsPerDay: Array<{
        date: string;
        calls: number;
    }>;
}

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    language: string;
    created_at: string;
    updated_at?: string;
    assigned_assistant_names?: string[];
    default_assistant_name?: string;
    assistant_access?: string;
    qa_form_submitted?: boolean;
    created_by?: string;
    questions?: {
        [key: string]: { en: string; he: string };
    };
}

interface QAFormData {
    [key: string]: { en: string; he: string };
}

export function convertToCSV(data: ExportableData[], headers: { [key: string]: string }): string {
    if (data.length === 0) return '';

    // Create header row
    const headerRow = Object.values(headers).join(',');

    // Create data rows
    const rows = data.map(item => {
        return Object.keys(headers).map(key => {
            const value = item[key];
            // Handle special cases (null, undefined, etc.)
            if (value === null || value === undefined) return '';
            // Escape commas and quotes in strings
            if (typeof value === 'string') {
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }
            return String(value);
        }).join(',');
    });

    return `${headerRow}\n${rows.join('\n')}`;
}

export function downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function formatPhoneNumbersForCSV(phoneNumbers: PhoneNumber[]) {
    return phoneNumbers.map(phone => ({
        id: phone.id,
        number: phone.number,
        assistantId: phone.assistantId,
        status: phone.status,
        createdAt: phone.createdAt
    }));
}

export function formatTicketsForCSV(tickets: Ticket[], isAdmin: boolean = false) {
    return tickets.map(ticket => {
        const costMultiplier = isAdmin ? 2 : 1;
        return {
            id: ticket.id,
            status: ticket.status,
            createdAt: ticket.createdAt,
            duration: ticket.duration,
            summary: ticket.summary,
            total_cost: (ticket.costs?.total || 0) * costMultiplier,
            stt_cost: (ticket.costs?.stt || 0) * costMultiplier,
            llm_cost: (ticket.costs?.llm || 0) * costMultiplier,
            tts_cost: (ticket.costs?.tts || 0) * costMultiplier,
            vapi_cost: (ticket.costs?.vapi || 0) * costMultiplier
        };
    });
}

export function formatCallStatsForCSV(stats: CallStats) {
    const callsPerDay = stats.callsPerDay || [];
    return callsPerDay.map((day) => ({
        date: day.date,
        calls: day.calls,
        total_calls: stats.totalCalls,
        incoming_calls: stats.incomingCalls,
        average_duration: stats.averageDuration
    }));
}

export function formatUsersForCSV(users: User[]) {
    // Define standard QA fields
    const standardQAFields = [
        'propertyName',
        'location',
        'breakfastService',
        'lunchService',
        'dinnerService',
        'poolHours',
        'spaServices',
        'checkoutProcedures',
        'ironingFacilities',
        'iceMachineLocation',
        'kidsClubServices',
        'synagogueServices',
        'gymFacilities',
        'businessLounge',
        'accessibilityFeatures',
        'uniqueAmenities',
        'contactPerson',
        'contactEmail',
        'contactPhone'
    ];

    return users.map(user => {
        // Start with base user data
        const userData: Record<string, string | boolean | undefined> = {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            assistant_access: user.assistant_access,
            language: user.language,
            assigned_assistants: (user.assigned_assistant_names || []).join('; '),
            default_assistant: user.default_assistant_name || '',
            qa_form_submitted: user.qa_form_submitted ? 'Yes' : 'No',
            created_at: user.created_at,
            updated_at: user.updated_at || '',
            created_by: user.created_by || ''
        };

        // Add QA form data
        if (user.questions) {
            // Add standard fields
            standardQAFields.forEach(field => {
                const qaData = user.questions?.[field];
                if (qaData) {
                    userData[`qa_${field}_en`] = qaData.en || '';
                    userData[`qa_${field}_he`] = qaData.he || '';
                } else {
                    userData[`qa_${field}_en`] = '';
                    userData[`qa_${field}_he`] = '';
                }
            });

            // Add custom fields
            Object.entries(user.questions)
                .filter(([key]) => !standardQAFields.includes(key))
                .forEach(([key, value]) => {
                    userData[`qa_custom_${key}_en`] = value.en || '';
                    userData[`qa_custom_${key}_he`] = value.he || '';
                });
        } else {
            // Add empty values for all QA fields if no questions data exists
            standardQAFields.forEach(field => {
                userData[`qa_${field}_en`] = '';
                userData[`qa_${field}_he`] = '';
            });
        }

        return userData;
    });
}

export function formatQAForCSV(formData: QAFormData, customQuestions: Array<{ key: string; value: { en: string; he: string } }>) {
    const standardFields = Object.entries(formData).map(([key, value]) => ({
        key,
        english_value: value.en,
        hebrew_value: value.he
    }));

    const customFields = customQuestions.map(({ key, value }) => ({
        key,
        english_value: value.en,
        hebrew_value: value.he
    }));

    return [...standardFields, ...customFields];
} 