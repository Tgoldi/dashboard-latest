import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import vapiService from '../services/vapiService';
import { VapiAssistant } from '../types/user';
import { AssistantSettings } from '../lib/supabase';

export function useVapiAssistant() {
  const { user } = useUser();
  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user?.assignedVapiIds?.length) {
      loadAssistants();
    } else {
      setAssistants([]);
      setIsLoading(false);
    }
  }, [user?.assignedVapiIds]);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const assistantsData = await vapiService.getAssistants();
      setAssistants((assistantsData as { data: VapiAssistant[] }).data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load assistants'));
    } finally {
      setIsLoading(false);
    }
  };

  const createAssistant = async (name: string, language: string) => {
    try {
      setError(null);
      const settings: AssistantSettings = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 150,
        systemPrompt: '',
        name,
        language,
        settings: {
          voice_id: language === 'en' ? 'en-US-Studio-M' : 'he-IL-Standard-A',
          initial_message: language === 'en' ? 'Hello! How can I help you today?' : 'שלום! כיצד אוכל לעזור לך היום?'
        }
      };
      const newAssistant = await vapiService.createAssistant(settings) as VapiAssistant;
      setAssistants(prev => [...prev, newAssistant]);
      return newAssistant;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create assistant'));
      throw err;
    }
  };

  const updateAssistant = async (assistantId: string, settings: Partial<AssistantSettings>) => {
    try {
      setError(null);
      const updatedAssistant = await vapiService.updateAssistant(assistantId, settings) as VapiAssistant;
      setAssistants(prev => 
        prev.map(assistant => 
          assistant.id === assistantId ? updatedAssistant : assistant
        )
      );
      return updatedAssistant;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update assistant'));
      throw err;
    }
  };

  const deleteAssistant = async (assistantId: string) => {
    try {
      setError(null);
      await vapiService.deleteAssistant(assistantId);
      setAssistants(prev => prev.filter(assistant => assistant.id !== assistantId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete assistant'));
      throw err;
    }
  };

  return {
    assistants,
    isLoading,
    error,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    refreshAssistants: loadAssistants
  };
} 