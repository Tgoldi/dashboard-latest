import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { ChevronDown, Search, Filter, Play, Pause, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import vapiService from "@/services/vapiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { PlayCircle } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/useUser";
import { convertToCSV, downloadCSV, formatTicketsForCSV } from '@/utils/csvExport';

interface TicketCosts {
    total: number;
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
}

interface Message {
    role: 'assistant' | 'user' | 'system' | 'bot';
    content: string;
    timestamp: string;
}

interface Transcript {
    id: string;
    callId: string;
    timestamp: string;
    content: string;
    speaker: 'user' | 'bot';
    recordingUrl?: string;
    messages?: Message[];
}

interface TranscriptData {
    messages: Message[];
    recordingUrl?: string;
}

interface Ticket {
    id: string;
    status: string;
    createdAt: string;
    duration?: number;
    summary?: string;
    costs?: TicketCosts;
    assistantId?: string;
    endedBy?: 'user' | 'assistant' | 'system';
    transcript?: Transcript;
}

interface TicketListProps {
    tickets: Ticket[];
    isLoading?: boolean;
    assistantId?: string;
}

interface DateRange {
    from: Date | null;
    to: Date | null;
}

interface SortConfig {
    key: keyof Ticket | "costs.total";
    direction: "asc" | "desc";
}

/**
 * TicketList Component
 * Displays a list of recent tickets/calls with their summaries and details
 */
export function TicketList({ tickets, isLoading, assistantId = '672ab50d-5c05-46dd-975b-5c4afb742244' }: TicketListProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user } = useUser();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "createdAt", direction: "desc" });
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
    const [currentAudio, setCurrentAudio] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { language } = useTheme();
    const isRTL = language === 'he';

    // Fetch assistants data
    const { data: assistantsResponse } = useQuery({
        queryKey: ['assistants'],
        queryFn: async () => {
            const response = await vapiService.getAssistants();
            return response;
        }
    });

    const assistants = assistantsResponse?.data || [];

    // Get assistant name by ID
    const getAssistantName = (assistantId?: string) => {
        if (!assistantId) return t('name');
        const assistant = assistants.find(a => a.id === assistantId);
        return assistant?.name || t('name');
    };

    // Add audio event listeners
    const handleEnded = useCallback(() => {
        if (currentAudio) {
            setIsPlaying({ [currentAudio]: false });
        }
        setCurrentAudio(null);
    }, [currentAudio]);

    const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error('Error playing audio:', e);
        if (currentAudio) {
            setIsPlaying({ [currentAudio]: false });
        }
        setCurrentAudio(null);
        toast({
            title: t('error'),
            description: t('errorPlayingRecording'),
            variant: "destructive"
        });
    }, [currentAudio, toast, t]);

    const handlePlayRecording = async (ticketId: string, recordingUrl?: string) => {
        try {
            if (currentAudio === ticketId) {
                // If the same audio is playing, pause it
                if (audioRef.current?.paused) {
                    await audioRef.current?.play();
                    setIsPlaying({ [ticketId]: true });
                } else {
                    audioRef.current?.pause();
                    setIsPlaying({ [ticketId]: false });
                }
            } else {
                // If a different audio is selected
                setIsPlaying({ [ticketId]: true });
                setCurrentAudio(ticketId);

                const url = recordingUrl || await vapiService.getCallRecording(ticketId);
                if (audioRef.current) {
                    audioRef.current.src = url;
                    await audioRef.current.play();
                }
            }
        } catch (error) {
            console.error('Error playing recording:', error);
            toast({
                title: t('error'),
                description: t('errorPlayingRecording'),
                variant: "destructive"
            });
            setIsPlaying({});
            setCurrentAudio(null);
        }
    };

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDialogOpen(true);
    };

    /**
     * Formats the duration from seconds to a readable string
     */
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    /**
     * Formats the cost to a readable string with currency
     */
    const formatCost = (cost: number): string => {
        // Double the cost for admin users
        const finalCost = user?.role === 'admin' ? cost * 2 : cost;
        
        return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(finalCost);
    };

    // Filter tickets for the specific assistant and remove cost info for non-admin users
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || ticket.status === statusFilter;
        const matchesAssistant = !assistantId || ticket.assistantId === assistantId;
        
        // Date range filtering
        const matchesDateRange = !dateRange.from || !dateRange.to || isWithinInterval(
            parseISO(ticket.createdAt),
            { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) }
        );

        // Remove cost information for non-admin/owner users
        if (user?.role !== 'admin' && user?.role !== 'owner' && ticket.costs) {
            delete ticket.costs;
        }

        return matchesSearch && matchesStatus && matchesAssistant && matchesDateRange;
    });

    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const key = sortConfig.key;
        const aValue = key === "costs.total" ? (a.costs?.total || 0) : a[key as keyof Ticket];
        const bValue = key === "costs.total" ? (b.costs?.total || 0) : b[key as keyof Ticket];

        // For admin users, double the cost values for sorting
        const aValueFinal = key === "costs.total" && user?.role === 'admin' ? (aValue as number) * 2 : aValue;
        const bValueFinal = key === "costs.total" && user?.role === 'admin' ? (bValue as number) * 2 : bValue;

        // Handle undefined values
        if (aValueFinal === undefined && bValueFinal === undefined) return 0;
        if (aValueFinal === undefined) return 1;
        if (bValueFinal === undefined) return -1;

        if (typeof aValueFinal === "string" && typeof bValueFinal === "string") {
            const aString = aValueFinal.toLowerCase();
            const bString = bValueFinal.toLowerCase();
            if (aString < bString) return sortConfig.direction === "asc" ? -1 : 1;
            if (aString > bString) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        }

        if (aValueFinal < bValueFinal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValueFinal > bValueFinal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof Ticket | "costs.total") => {
        setSortConfig((current: SortConfig) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
            case "in_progress":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
            case "failed":
                return "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300 border border-slate-200 dark:border-slate-800";
        }
    };

    const handleExport = () => {
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) return;

        const headers = {
            id: t('ticketId'),
            status: t('status'),
            createdAt: t('createdAt'),
            duration: t('duration'),
            summary: t('summary'),
            total_cost: t('totalCost'),
            stt_cost: t('sttCost'),
            llm_cost: t('llmCost'),
            tts_cost: t('ttsCost'),
            vapi_cost: t('vapiCost')
        };

        const csvData = formatTicketsForCSV(tickets, user.role === 'admin');
        const csvContent = convertToCSV(csvData, headers);
        downloadCSV(csvContent, `tickets-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <Card className="flex flex-col h-full">
                <CardContent className="p-1">
                    <LoadingSkeleton />
                </CardContent>
            </Card>
        );
    }

    if (filteredTickets.length === 0) {
        return (
            <Card className="flex flex-col h-full">
                <CardContent className="p-1">
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                        <p>No tickets available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="flex flex-col h-full overflow-hidden border-0 bg-gradient-to-b from-background to-background/80 backdrop-blur-xl">
                <CardContent className="flex-1 min-h-0 p-0">
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* Filter Bar */}
                        <div className="flex-none flex flex-wrap gap-2 p-4 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-8 h-9 w-full bg-background/50 border-muted"
                                    placeholder={t('search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-9 bg-background/50 border-muted">
                                        <Filter className="h-4 w-4 mr-2" />
                                        {statusFilter || t('allStatus')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                        {t('allStatus')}
                                    </DropdownMenuItem>
                                    {Array.from(new Set(tickets.map(ticket => ticket.status))).map(status => (
                                        <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DateRangePicker
                                value={{
                                    from: dateRange.from || undefined,
                                    to: dateRange.to || undefined
                                }}
                                onChange={(date) => setDateRange({
                                    from: date.from || null,
                                    to: date.to || null
                                })}
                            />
                            {(user?.role === 'owner' || user?.role === 'admin') && (
                                <Button variant="outline" onClick={handleExport} className="h-9 bg-background/50 border-muted">
                                    {t('exportCSV')}
                                </Button>
                            )}
                        </div>

                        {/* Audio Player */}
                        <audio
                            ref={audioRef}
                            className="hidden"
                            onEnded={handleEnded}
                            onError={handleError}
                            controls
                        />

                        {/* Table */}
                        <div className="flex-1 min-h-0 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
                                    <TableRow className="border-b border-muted/40">
                                        <TableHead onClick={() => handleSort("id")} className="cursor-pointer h-10 text-muted-foreground font-medium">
                                            {t('assistants')}
                                            {sortConfig.key === "id" && (
                                                <ChevronDown className={`inline ml-1 h-4 w-4 ${sortConfig.direction === "desc" ? "transform rotate-180" : ""}`} />
                                            )}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort("status")} className="cursor-pointer h-10 text-muted-foreground font-medium">
                                            {t('status')}
                                            {sortConfig.key === "status" && (
                                                <ChevronDown className={`inline ml-1 h-4 w-4 ${sortConfig.direction === "desc" ? "transform rotate-180" : ""}`} />
                                            )}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer h-10 text-muted-foreground font-medium">
                                            {t('created')}
                                            {sortConfig.key === "createdAt" && (
                                                <ChevronDown className={`inline ml-1 h-4 w-4 ${sortConfig.direction === "desc" ? "transform rotate-180" : ""}`} />
                                            )}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort("duration")} className="cursor-pointer text-right h-10 text-muted-foreground font-medium">
                                            {t('duration')}
                                            {sortConfig.key === "duration" && (
                                                <ChevronDown className={`inline ml-1 h-4 w-4 ${sortConfig.direction === "desc" ? "transform rotate-180" : ""}`} />
                                            )}
                                        </TableHead>
                                        {user?.role !== 'editor' && (
                                            <TableHead onClick={() => handleSort("costs.total")} className="cursor-pointer text-right h-10 text-muted-foreground font-medium">
                                                {t('cost')}
                                                {sortConfig.key === "costs.total" && (
                                                    <ChevronDown className={`inline ml-1 h-4 w-4 ${sortConfig.direction === "desc" ? "transform rotate-180" : ""}`} />
                                                )}
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTickets.map((ticket) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                                            onClick={() => handleTicketClick(ticket)}
                                        >
                                            <TableCell className="py-3 flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayRecording(ticket.id, ticket.transcript?.recordingUrl);
                                                    }}
                                                >
                                                    {isPlaying[ticket.id] ? (
                                                        <Pause className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <span className="font-medium text-foreground/90">{getAssistantName(ticket.assistantId)}</span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge className={cn(getStatusColor(ticket.status))}>
                                                    {ticket.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3">{format(new Date(ticket.createdAt), 'PPp')}</TableCell>
                                            <TableCell className="text-right py-3">{ticket.duration ? formatDuration(ticket.duration) : '-'}</TableCell>
                                            {user?.role !== 'editor' && (
                                                <TableCell className="text-right py-3">{ticket.costs ? formatCost(ticket.costs.total) : '-'}</TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-b from-background to-background/80 backdrop-blur-xl">
                    <DialogHeader className="border-b border-muted/40 pb-4">
                        <DialogTitle className="text-xl font-semibold">{t('transcript')}</DialogTitle>
                        <DialogDescription id="ticket-dialog-description" className="text-muted-foreground">
                            {selectedTicket?.summary || t('noTranscriptsAvailable')}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">{t('clientDetails')}</TabsTrigger>
                                <TabsTrigger value="transcript">{t('transcript')}</TabsTrigger>
                            </TabsList>
                            <div className="flex-1 overflow-auto px-1">
                                <TabsContent value="details" className="mt-0 h-full data-[state=active]:pb-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{t('assistants')}</p>
                                                <p>{getAssistantName(selectedTicket.assistantId)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
                                                <Badge className={cn(getStatusColor(selectedTicket.status))}>
                                                    {selectedTicket.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{t('created')}</p>
                                                <p>{format(new Date(selectedTicket.createdAt), 'PPp')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{t('duration')}</p>
                                                <p>{selectedTicket.duration ? formatDuration(selectedTicket.duration) : '-'}</p>
                                            </div>
                                        </div>
                                        {selectedTicket.summary && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">{t('summary')}</p>
                                                <p className="text-sm">{selectedTicket.summary}</p>
                                            </div>
                                        )}
                                        {selectedTicket.costs && user?.role !== 'editor' && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">{t('cost')}</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Total: </span>
                                                        {formatCost(selectedTicket.costs.total)}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">STT: </span>
                                                        {formatCost(selectedTicket.costs.stt)}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">LLM: </span>
                                                        {formatCost(selectedTicket.costs.llm)}
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">TTS: </span>
                                                        {formatCost(selectedTicket.costs.tts)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePlayRecording(selectedTicket.id, selectedTicket.transcript?.recordingUrl)}
                                                className="flex items-center gap-2"
                                            >
                                                {isPlaying[selectedTicket.id] ? (
                                                    <>
                                                        <Pause className="h-4 w-4" />
                                                        {t('pauseRecording')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4" />
                                                        {t('playRecording')}
                                                    </>
                                                )}
                                            </Button>
                                            {selectedTicket.transcript?.recordingUrl && (
                                                <audio ref={audioRef} className="hidden" />
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="transcript" className="mt-0 h-full data-[state=active]:pb-6">
                                    {selectedTicket.transcript ? (
                                        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-sm font-medium">{getAssistantName(selectedTicket.assistantId)}</span>
                                            </div>
                                            <div className="space-y-2">
                                                {selectedTicket.transcript.messages?.slice(1).map((message, index) => {
                                                    return (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "flex",
                                                            message.role === "assistant" || message.role === "bot" ? "justify-start" : "justify-end"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                                                                message.role === "assistant" || message.role === "bot"
                                                                    ? "bg-white dark:bg-gray-800 rounded-tl-none text-foreground"
                                                                    : "bg-[#0084ff] text-white rounded-tr-none"
                                                            )}
                                                        >
                                                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                                            <div className="flex justify-end mt-1">
                                                                <span className={cn(
                                                                    "text-[10px]",
                                                                    message.role === "assistant" || message.role === "bot"
                                                                        ? "text-muted-foreground" 
                                                                        : "text-white/70"
                                                                )}>
                                                                    {format(new Date(message.timestamp), 'p')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )})}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            {t('noTranscriptsAvailable')}
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
} 