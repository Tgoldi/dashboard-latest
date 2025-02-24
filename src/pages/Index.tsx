import { useQuery } from "@tanstack/react-query";
import { Phone, PhoneCall, Ticket, Moon, Sun, Languages, LogOut, HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { TicketList } from "@/components/dashboard/TicketList";
import { useTheme } from '@/contexts/useTheme';
import vapiService, { MOCK_ASSISTANT, CallStats } from "@/services/vapiService";
import socketService from "@/services/socketService";
import type { AssistantData } from "@/services/socketService";
import { VapiCall } from "@/types/vapi";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { VapiAssistant } from "@/types/user";
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/ui/layout";
import { CallStatsPieChart } from "@/components/dashboard/CallStatsPieChart";

// Define interfaces for type safety
interface Call {
  id: string;
  status: string;
  endedReason?: string;
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

interface PieChartStats {
  completed: number;
  failed: number;
  userHangup: number;
  assistantHangup: number;
}

interface DashboardStats extends CallStats {
  callsPerDay: { date: string; calls: number }[];
}

interface VapiMessage {
  role: string;
  message: string;
  time: number;
}

interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
}

const chartColors = {
  blue: {
    stroke: "rgb(59, 130, 246)",
    fill: "rgba(59, 130, 246, 0.2)",
  },
  green: {
    stroke: "rgb(34, 197, 94)",
    fill: "rgba(34, 197, 94, 0.2)",
  },
  yellow: {
    stroke: "rgb(234, 179, 8)",
    fill: "rgba(234, 179, 8, 0.2)",
  },
  purple: {
    stroke: "rgb(168, 85, 247)",
    fill: "rgba(168, 85, 247, 0.2)",
  },
};

const processCallStats = (calls: Call[] = []): PieChartStats | undefined => {
  if (!calls?.length) return undefined;

  console.log('Processing calls for stats. Total calls:', calls.length);
  const stats: PieChartStats = {
    completed: 0,
    failed: 0,
    userHangup: 0,
    assistantHangup: 0
  };

  calls.forEach(call => {
    console.log('Processing call:', {
      id: call.id,
      status: call.status,
      endedReason: call.endedReason
    });
    
    // Group all end reasons into our categories
    const endReason = call.endedReason?.toLowerCase() || '';

    // User-initiated ends
    if (
      endReason.includes('customer-ended-call') ||
      endReason.includes('customer-busy') ||
      endReason.includes('customer-did-not-answer') ||
      endReason.includes('customer-did-not-give-microphone-permission')
    ) {
      stats.userHangup++;
    }
    // Assistant-initiated ends
    else if (
      endReason.includes('assistant-ended-call') ||
      endReason.includes('assistant-said-end-call-phrase') ||
      endReason.includes('assistant-forwarded-call') ||
      endReason.includes('assistant-said-message-with-end-call-enabled')
    ) {
      stats.assistantHangup++;
    }
    // Failed calls (any error or system-initiated end)
    else if (
      endReason.includes('error') ||
      endReason.includes('failed') ||
      endReason.includes('invalid') ||
      endReason.includes('timeout') ||
      endReason === 'silence-timed-out' ||
      endReason.startsWith('pipeline-') ||
      endReason.startsWith('vapifault-') ||
      endReason === 'worker-shutdown' ||
      endReason === 'unknown-error' ||
      endReason === 'db-error' ||
      endReason === 'manually-canceled' ||
      endReason === 'exceeded-max-duration'
    ) {
      stats.failed++;
    }
    // Completed calls (successful completion or no specific end reason)
    else if (
      call.status === 'completed' ||
      !endReason ||
      endReason === 'undefined' ||
      endReason === 'null'
    ) {
      stats.completed++;
    }
    // Any unhandled cases go to failed
    else {
      console.warn('Unhandled end reason:', endReason);
      stats.failed++;
    }
  });

  // Only return stats if there are any non-zero values
  const hasNonZeroValues = Object.values(stats).some(value => value > 0);
  console.log('Final call stats:', hasNonZeroValues ? stats : undefined);
  return hasNonZeroValues ? stats : undefined;
};

export default function Index() {
  const { isDark, toggleTheme, language, setLanguage, t } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [callStats, setCallStats] = useState<DashboardStats | null>(null);
  const isRTL = language === 'he';

  // Get assistantId from URL or fallback to default
  const selectedAssistantId = searchParams.get('assistant') || user?.default_assistant_id || '672ab50d-5c05-46dd-975b-5c4afb742244';

  // Fetch available assistants if user has 'all' access
  const { data: assistantsResponse } = useQuery({
    queryKey: ['assistants'],
    queryFn: () => vapiService.getAssistants(),
    enabled: user?.assistant_access === 'all'
  });

  const assistants = assistantsResponse?.data || [];

  // Fetch ticket stats
  const { data: ticketStats, isLoading: isLoadingTicketStats } = useQuery({
    queryKey: ['ticketStats', selectedAssistantId],
    queryFn: async () => {
      if (!selectedAssistantId) return null;
      try {
        const data = await vapiService.getTicketStats(selectedAssistantId);
        
        // Fetch detailed call information for each call
        const callsWithDetails = await Promise.all(
          (data.calls || []).map(async (call) => {
            try {
              const callDetails = await vapiService.getCallDetails(call.id);
              return {
                ...call,
                endedReason: callDetails.ended_reason || callDetails.endedReason || call.endedReason || 'Customer Ended Call',
                status: callDetails.status || call.status,
                duration: callDetails.duration || call.duration,
                costs: {
                  total: callDetails.costBreakdown?.total || call.costs?.total || 0,
                  stt: callDetails.costBreakdown?.stt || call.costs?.stt || 0,
                  llm: callDetails.costBreakdown?.llm || call.costs?.llm || 0,
                  tts: callDetails.costBreakdown?.tts || call.costs?.tts || 0,
                  vapi: callDetails.costBreakdown?.vapi || call.costs?.vapi || 0
                },
                summary: call.summary || '',
                createdAt: callDetails.createdAt || call.createdAt || new Date().toISOString(),
                transcript: callDetails.messages ? {
                  id: call.id,
                  callId: call.id,
                  timestamp: callDetails.createdAt || new Date().toISOString(),
                  content: '',
                  speaker: 'bot' as const,
                  messages: callDetails.messages
                    .map((msg: VapiMessage) => {
                      console.log('Processing message:', msg);
                      return {
                        role: msg.role,
                        content: msg.message,
                        timestamp: new Date(msg.time * 1000).toISOString()
                      };
                    })
                    .sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                } : undefined
              };
            } catch (error) {
              console.error(`Error fetching details for call ${call.id}:`, error);
              return call;
            }
          })
        );

        console.log('Calls with detailed information:', callsWithDetails);
        
        return {
          ...data,
          calls: callsWithDetails
        };
      } catch (error) {
        console.error('Error fetching ticket stats:', error);
        return {
          open: 0,
          inProgress: 0,
          resolved: 0,
          unassigned: 0,
          totalTickets: 0,
          ticketsPerStatus: [],
          averageDuration: 0,
          totalCost: 0,
          calls: []
        };
      }
    },
    enabled: !!selectedAssistantId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });

  // Subscribe to real-time updates with error handling
  useEffect(() => {
    if (!selectedAssistantId) return;

    // Initial data load with error handling
    vapiService.getCallStats(selectedAssistantId)
      .then(stats => {
        setCallStats(stats as DashboardStats);
      })
      .catch(error => {
        console.error('Error loading initial call stats:', error);
        setCallStats(null);
      });

    // Subscribe to real-time updates
    socketService.connect();
    socketService.subscribeToAssistant(selectedAssistantId);

    const handleAssistantData = (data: AssistantData) => {
      try {
        console.log('Received real-time data:', data);
        setCallStats(data.stats as DashboardStats);
      } catch (error) {
        console.error('Error handling real-time data:', error);
      }
    };

    socketService.addListener('assistant_data', handleAssistantData);

    return () => {
      socketService.removeListener('assistant_data', handleAssistantData);
      socketService.unsubscribeFromAssistant(selectedAssistantId);
    };
  }, [selectedAssistantId]);

  return (
    <Layout>
      <div className="flex flex-col h-full gap-6">
        {/* Stats Cards - Fixed height */}
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('totalCalls')}
            value={ticketStats?.totalTickets}
            trend={10}
            icon={<Phone className="h-4 w-4" />}
            variant="primary"
            callStats={processCallStats(ticketStats?.calls)}
            className="h-[100px]"
          />
          <StatCard
            title={t('openTickets')}
            value={ticketStats?.open}
            icon={<Ticket className="h-4 w-4" />}
            variant="warning"
            className="h-[100px]"
          />
          <StatCard
            title={t('unassignedTickets')}
            value={ticketStats?.unassigned}
            icon={<HelpCircle className="h-4 w-4" />}
            variant="accent"
            className="h-[100px]"
          />
          <StatCard
            title={t('resolvedTickets')}
            value={ticketStats?.resolved}
            icon={<Ticket className="h-4 w-4" />}
            variant="success"
            className="h-[100px]"
          />
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 min-h-0 grid gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Call Volume Chart */}
          <Card className="flex flex-col h-full">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm font-medium">{t('callVolume')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={callStats?.callsPerDay || []}
                  margin={{ top: 0, right: 0, left: -32, bottom: 0 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.split('-')[2]} // Show only day
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke={chartColors.blue.stroke}
                    fill={chartColors.blue.fill}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ticket List */}
          <div className="flex-1 min-h-0">
            <TicketList 
              tickets={ticketStats?.calls || []} 
              isLoading={isLoadingTicketStats} 
              assistantId={selectedAssistantId}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}