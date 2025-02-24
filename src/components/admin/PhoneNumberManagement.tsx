import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Plus, Pencil, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import vapiService from "@/services/vapiService";
import { VapiAssistant } from "@/types/user";
import { convertToCSV, downloadCSV, formatPhoneNumbersForCSV } from '@/utils/csvExport';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface PhoneNumber {
    id: string;
    number: string;
    assistantId: string;
    status: string;
    createdAt: string;
}

interface PhoneNumberDialogProps {
    open: boolean;
    onClose: () => void;
    editingNumber?: PhoneNumber | null;
    availableAssistants: VapiAssistant[];
}

function PhoneNumberDialog({ open, onClose, editingNumber, availableAssistants }: PhoneNumberDialogProps) {
    const { t } = useTheme();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        number: editingNumber?.number || "",
        assistantId: editingNumber?.assistantId || availableAssistants[0]?.id || ""
    });

    useEffect(() => {
        if (editingNumber) {
            setFormData({
                number: editingNumber.number,
                assistantId: editingNumber.assistantId
            });
        } else {
            setFormData({
                number: "",
                assistantId: availableAssistants[0]?.id || ""
            });
        }
    }, [editingNumber, availableAssistants]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (editingNumber) {
                await vapiService.updatePhoneNumber(editingNumber.id, formData.number, formData.assistantId);
                toast({
                    title: t('success'),
                    description: t('phoneNumberUpdated')
                });
            } else {
                await vapiService.createPhoneNumber(formData.number, formData.assistantId);
                toast({
                    title: t('success'),
                    description: t('phoneNumberCreated')
                });
            }

            queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
            onClose();
        } catch (error) {
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('errorManagingPhoneNumber'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editingNumber ? t('editPhoneNumber') : t('addPhoneNumber')}
                    </DialogTitle>
                    <DialogDescription>
                        {editingNumber ? t('editPhoneNumberDescription') : t('addPhoneNumberDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="number" className="text-right">
                                {t('phoneNumber')}
                            </label>
                            <Input
                                id="number"
                                value={formData.number}
                                onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        {availableAssistants.length > 1 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="assistant" className="text-right">
                                    {t('assistant')}
                                </label>
                                <Select
                                    value={formData.assistantId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, assistantId: value }))}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('selectAssistant')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAssistants.map((assistant) => (
                                            <SelectItem key={assistant.id} value={assistant.id}>
                                                {assistant.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('saving') : editingNumber ? t('update') : t('create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function PhoneNumberManagement() {
    const { t } = useTheme();
    const { user } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingNumber, setEditingNumber] = useState<PhoneNumber | null>(null);
    const [deletingNumber, setDeletingNumber] = useState<PhoneNumber | null>(null);

    // Fetch phone numbers
    const { data: phoneNumbers = [], isLoading } = useQuery({
        queryKey: ['phone-numbers'],
        queryFn: async () => {
            const response = await vapiService.getPhoneNumbers();
            return response;
        }
    });

    // Fetch available assistants based on user role
    const { data: assistantsResponse } = useQuery({
        queryKey: ['assistants', user?.id],
        queryFn: async () => {
            if (!user) return { data: [] };
            return await vapiService.getAssistants();
        },
        enabled: !!user
    });

    const availableAssistants = assistantsResponse?.data || [];

    const handleDelete = async (phoneNumber: PhoneNumber) => {
        try {
            await vapiService.deletePhoneNumber(phoneNumber.id);
            queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
            toast({
                title: t('success'),
                description: t('phoneNumberDeleted')
            });
        } catch (error) {
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('errorDeletingPhoneNumber'),
                variant: "destructive"
            });
        } finally {
            setDeletingNumber(null);
        }
    };

    const handleExport = () => {
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) return;

        const headers = {
            id: t('phoneNumberId'),
            number: t('phoneNumber'),
            assistantId: t('assistantId'),
            status: t('status'),
            createdAt: t('created')
        };

        const csvData = formatPhoneNumbersForCSV(phoneNumbers);
        const csvContent = convertToCSV(csvData, headers);
        downloadCSV(csvContent, `phone-numbers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    if (isLoading) {
        return <div>{t('loading')}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('phoneNumbers')}</h1>
                    <p className="text-muted-foreground">{t('phoneNumberManagement')}</p>
                </div>
                <div className="flex gap-2">
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                        <Button onClick={handleExport} variant="outline">
                            {t('exportCSV')}
                        </Button>
                    )}
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('addPhoneNumber')}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {phoneNumbers.map((phoneNumber: PhoneNumber) => {
                    const assistant = availableAssistants.find(a => a.id === phoneNumber.assistantId);
                    return (
                        <Card key={phoneNumber.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Phone className="h-4 w-4 text-primary" />
                                            </div>
                                            {phoneNumber.number}
                                        </CardTitle>
                                        {assistant && (
                                            <p className="text-sm text-muted-foreground">
                                                {assistant.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingNumber(phoneNumber);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingNumber(phoneNumber)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {t('status')}: {phoneNumber.status}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <PhoneNumberDialog
                open={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditingNumber(null);
                }}
                editingNumber={editingNumber}
                availableAssistants={availableAssistants}
            />

            <AlertDialog open={!!deletingNumber} onOpenChange={() => setDeletingNumber(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('confirmDeletePhoneNumber')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingNumber && handleDelete(deletingNumber)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 