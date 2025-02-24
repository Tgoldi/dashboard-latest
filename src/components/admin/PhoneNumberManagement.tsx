import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from '@/contexts/useTheme';
import vapiService from "@/services/vapiService";

interface PhoneNumber {
    id: string;
    number: string;
    status: string;
}

interface PhoneNumberManagementProps {
    userId?: string;  // Optional - if provided, shows only numbers for that user
}

export function PhoneNumberManagement({ userId }: PhoneNumberManagementProps) {
    const { t } = useTheme();
    const queryClient = useQueryClient();
    const [newNumber, setNewNumber] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNumber, setEditNumber] = useState('');

    // Fetch phone numbers
    const { data: phoneNumbers, isLoading } = useQuery({
        queryKey: ['phoneNumbers', userId],
        queryFn: () => userId ? 
            vapiService.getPhoneNumbersByUser(userId) : 
            vapiService.getPhoneNumbers()
    });

    // Add new phone number
    const addMutation = useMutation({
        mutationFn: (number: string) => vapiService.createPhoneNumber(number),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
            setNewNumber('');
        }
    });

    // Update phone number
    const updateMutation = useMutation({
        mutationFn: ({ id, number }: { id: string; number: string }) => 
            vapiService.updatePhoneNumber(id, number),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
            setEditingId(null);
            setEditNumber('');
        }
    });

    const handleAdd = () => {
        if (newNumber) {
            addMutation.mutate(newNumber);
        }
    };

    const handleUpdate = (id: string) => {
        if (editNumber) {
            updateMutation.mutate({ id, number: editNumber });
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('phoneNumbers')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Add new number */}
                    <div className="flex gap-2">
                        <Input
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                            placeholder={t('enterNewPhoneNumber')}
                        />
                        <Button onClick={handleAdd}>{t('add')}</Button>
                    </div>

                    {/* List of phone numbers */}
                    <div className="space-y-2">
                        {phoneNumbers?.map((phone: PhoneNumber) => (
                            <div key={phone.id} className="flex items-center gap-2">
                                {editingId === phone.id ? (
                                    <>
                                        <Input
                                            value={editNumber}
                                            onChange={(e) => setEditNumber(e.target.value)}
                                        />
                                        <Button onClick={() => handleUpdate(phone.id)}>
                                            {t('save')}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setEditingId(null)}
                                        >
                                            {t('cancel')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span>{phone.number}</span>
                                        <span className="text-sm text-muted-foreground">
                                            ({phone.status})
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditingId(phone.id);
                                                setEditNumber(phone.number);
                                            }}
                                        >
                                            {t('edit')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 