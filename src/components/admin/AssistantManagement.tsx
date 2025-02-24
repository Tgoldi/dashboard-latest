/** @jsxImportSource react */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Bot, Languages, Volume2, MessageSquare, Settings2, Phone, Clock, Activity, Calendar, UserIcon, Mail } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from '@/contexts/useTheme';
import vapiService from "@/services/vapiService";
import { VapiAssistant } from "@/types/vapi";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AddUserDialog } from "@/components/admin/AddUserDialog";

export function AssistantManagement() {
    const { t } = useTheme();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editingAssistant, setEditingAssistant] = useState<VapiAssistant | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: assistantsResponse, isLoading, refetch } = useQuery({
        queryKey: ['assistants'],
        queryFn: async () => {
            try {
                const assistantsRes = await vapiService.getAssistants();
                if (!assistantsRes?.data) {
                    throw new Error('No assistants data received');
                }

                const assistantsWithStats = await Promise.all(
                    assistantsRes.data.map(async (assistant) => {
                        try {
                            const [callsRes, transcriptsRes] = await Promise.all([
                                fetch(`/api/assistants/${assistant.id}/analytics/calls`),
                                fetch(`/api/assistants/${assistant.id}/analytics/transcripts`)
                            ]);

                            const [callsData, transcriptsData] = await Promise.all([
                                callsRes.json(),
                                transcriptsRes.json()
                            ]);

                            return {
                                ...assistant,
                                stats: {
                                    totalCalls: callsData.totalCalls || 0,
                                    totalMessages: transcriptsData.length || 0,
                                    averageDuration: Math.round(callsData.averageDuration || 0),
                                    successRate: Math.round((callsData.incomingCalls / callsData.totalCalls) * 100) || 0
                                }
                            };
                        } catch (error) {
                            console.error(`Error fetching stats for assistant ${assistant.id}:`, error);
                            return {
                                ...assistant,
                                stats: {
                                    totalCalls: 0,
                                    totalMessages: 0,
                                    averageDuration: 0,
                                    successRate: 0
                                }
                            };
                        }
                    }) as Promise<VapiAssistant>[]
                );

                return {
                    ...assistantsRes,
                    data: assistantsWithStats
                };
            } catch (error) {
                console.error('Error fetching assistants data:', error);
                throw error;
            }
        },
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    const assistants = assistantsResponse?.data || [];

    const handleDelete = async (assistantId: string) => {
        try {
            await vapiService.deleteAssistant(assistantId);
            refetch();
            toast({
                title: t('success'),
                description: t('assistantDeleted'),
            });
        } catch (error) {
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('errorDeletingAssistant'),
                variant: "destructive",
            });
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('assistants')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('assistantManagement')}
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t('createAssistant')}
                </Button>
            </div>

            <ScrollArea className="flex-1 w-full">
                <div className="p-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {assistants.map((assistant: VapiAssistant) => (
                            <Card key={assistant.id} className="flex flex-col bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-muted/40">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Bot className="h-5 w-5 text-primary" />
                                                </div>
                                                {assistant.name}
                                            </CardTitle>
                                            <div className="text-sm text-muted-foreground flex flex-col gap-1">
                                                <span className="flex items-center gap-2">
                                                    <Languages className="h-4 w-4" />
                                                    {assistant.language}
                                                </span>
                                                <span className="flex items-center gap-2 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    Created {formatDistanceToNow(new Date(assistant.createdAt || Date.now()), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingAssistant(assistant);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(assistant.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-muted-foreground">
                                                <Phone className="h-4 w-4 mr-1" />
                                                <span className="text-sm">{t('totalCalls')}</span>
                                            </div>
                                            <p className="text-2xl font-semibold text-primary">
                                                {assistant.stats?.totalCalls?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-muted-foreground">
                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                <span className="text-sm">{t('messages')}</span>
                                            </div>
                                            <p className="text-2xl font-semibold text-secondary">
                                                {assistant.stats?.totalMessages?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-muted-foreground">
                                                <Clock className="h-4 w-4 mr-1" />
                                                <span className="text-sm">{t('duration')}</span>
                                            </div>
                                            <p className="text-2xl font-semibold text-accent">
                                                {`${assistant.stats?.averageDuration || '0'}m`}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-muted-foreground">
                                                <Activity className="h-4 w-4 mr-1" />
                                                <span className="text-sm">{t('successRate')}</span>
                                            </div>
                                            <p className="text-2xl font-semibold text-success-500">
                                                {`${assistant.stats?.successRate || '0'}%`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                                        <h4 className="text-sm font-medium">{t('settings')}</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('model')}</span>
                                                <span>{assistant.model?.name || 'GPT-4'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('temperature')}</span>
                                                <span>{assistant.settings?.temperature || 0.7}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('maxTokens')}</span>
                                                <span>{assistant.settings?.maxTokens || 2000}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{t('voiceId')}</span>
                                                <span>{assistant.settings?.voice_id || t('assistant.noVoiceSelected')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAssistant ? t('editAssistant') : t('createAssistant')}
                        </DialogTitle>
                        <DialogDescription>
                            {editingAssistant ? t('editAssistantDescription') : t('createAssistantDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    {/* Dialog content implementation */}
                </DialogContent>
            </Dialog>
        </div>
    );
}              