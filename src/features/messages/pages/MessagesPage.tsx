import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messagesService } from '@/services/messages.service';
import { MessageSquare, Search, AlertCircle, RefreshCcw, User, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Use Intl.DateTimeFormat instead of date-fns to avoid dependency issues
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
};

export const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Conversations
  const { 
    data: conversations = [], 
    isLoading: isConversationsLoading, 
    isError: isConversationsError,
    refetch: refetchConversations 
  } = useQuery({
    queryKey: ['portal-conversations'],
    queryFn: messagesService.getConversations,
  });

  // Fetch Messages for selected conversation
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['portal-messages', selectedConversationId],
    queryFn: () => messagesService.getConversationMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
  });

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      (conv.subject && conv.subject.toLowerCase().includes(lowerQuery)) ||
      (conv.status && conv.status.toLowerCase().includes(lowerQuery))
    );
  }, [conversations, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Messages</h1>
            <p className="text-slate-400">View your conversations with our team.</p>
          </div>
        </div>

        <div className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 lg:grid-cols-3">
          
          {/* Left Column - Conversation List */}
          <div className="flex flex-col border-r border-slate-700 bg-slate-800/80">
            {/* Search Bar */}
            <div className="border-b border-slate-700 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-sm text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {isConversationsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                </div>
              ) : isConversationsError ? (
                <div className="p-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-red-800 bg-red-900/20 p-4 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
                    <p className="text-sm text-red-200">Failed to load conversations.</p>
                    <button 
                      onClick={() => refetchConversations()}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center p-4 text-center text-slate-400">
                  <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">{searchQuery ? "No matching conversations found." : "No conversations yet."}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full p-4 text-left transition-colors hover:bg-slate-700/50 ${
                        selectedConversationId === conv.id ? 'bg-slate-700 border-l-2 border-teal-500' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 overflow-hidden">
                          <h3 className="truncate font-medium text-slate-200">
                            {conv.subject || 'No Subject'}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              conv.status === 'Active' ? 'bg-green-500/20 text-green-400' : 
                              conv.status === 'Archived' ? 'bg-slate-500/20 text-slate-400' : 
                              'bg-orange-500/20 text-orange-400'
                            }`}>
                              {conv.status}
                            </span>
                            <span>•</span>
                            <span>{formatDate(conv.updated_at)}</span>
                          </div>
                        </div>
                        {conv.unreadMessageCount > 0 && (
                          <div className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-slate-900">
                            {conv.unreadMessageCount}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Messages */}
          <div className="flex flex-col bg-slate-900/50 lg:col-span-2">
            {!selectedConversationId ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="mb-4 h-16 w-16 opacity-20" />
                <h3 className="text-lg font-medium text-slate-400">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to view its messages.</p>
              </div>
            ) : isMessagesLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              </div>
            ) : isMessagesError ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <div className="flex max-w-sm flex-col items-center justify-center rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
                  <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
                  <h3 className="mb-2 font-medium text-red-200">Failed to load messages</h3>
                  <button 
                    onClick={() => refetchMessages()}
                    className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Header */}
                <div className="border-b border-slate-700 bg-slate-800/80 p-4">
                  {(() => {
                    const activeConv = conversations.find(c => c.id === selectedConversationId);
                    return (
                      <div>
                        <h2 className="text-lg font-semibold text-white">{activeConv?.subject || 'No Subject'}</h2>
                        <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                          <span>Status: {activeConv?.status}</span>
                          {activeConv?.assigned_to && (
                            <>
                              <span>•</span>
                              <span>Assigned to Staff ID: {activeConv.assigned_to.slice(0, 8)}...</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                      No messages in this conversation.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_auth_id === user?.id || msg.sender_type === 'Client';
                      
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[80%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isMe ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                              {isMe ? <User className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <span className="mb-1 text-xs text-slate-400">
                                {isMe ? 'You' : msg.sender_type} • {formatDate(msg.created_at)}
                              </span>
                              <div className={`rounded-2xl px-4 py-2 ${
                                isMe 
                                  ? 'bg-teal-600 text-white rounded-tr-none' 
                                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {msg.content}
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
