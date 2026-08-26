import { api } from '@/lib/axios';

export interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  assigned_to: string | null;
  pet_id: string | null;
  appointment_id: string | null;
  medical_record_id: string | null;
  created_at: string;
  updated_at: string;
  unreadMessageCount: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_auth_id: string;
  sender_type: 'Client' | 'Staff' | 'System';
  content: string;
  created_at: string;
  updated_at: string;
}

export const messagesService = {
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get<{ success: boolean; data: Conversation[] }>('/portal/conversations');
    return data.data;
  },

  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    const { data } = await api.get<{ success: boolean; data: Message[] }>(`/portal/conversations/${conversationId}/messages`);
    return data.data;
  },
};
