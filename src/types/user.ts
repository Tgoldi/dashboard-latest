export type UserRole = 'owner' | 'admin' | 'editor' | 'user';
export type AssistantAccess = 'single' | 'all';

export interface VapiAssistant {
  id: string;
  name: string;
  language: string;
  settings?: {
    voice_id?: string;
    initial_message?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    model?: string;
  };
}

export interface HotelQuestions {
  // Property Information
  propertyName: string;
  location: string;
  // Services & Amenities
  breakfastService: string;
  lunchService: string;
  dinnerService: string;
  poolHours: string;
  spaServices: string;
  // Additional Facilities
  checkoutProcedures: string;
  ironingFacilities: string;
  iceMachineLocation: string;
  kidsClubServices: string;
  synagogueServices: string;
  gymFacilities: string;
  businessLounge: string;
  // Special Requirements
  accessibilityFeatures: string;
  uniqueAmenities: string;
  // Contact Information
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export type UserQuestions = HotelQuestions;

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  assistant_access: AssistantAccess;
  language: string;
  assigned_assistants?: string[];
  assigned_assistant_names?: string[];
  default_assistant_id?: string | null;
  default_assistant_name?: string | null;
  questions?: UserQuestions;
  qa_form_submitted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  name?: string;
  questions?: UserQuestions;
}

export interface UserLoginData {
  email: string;
  password: string;
} 