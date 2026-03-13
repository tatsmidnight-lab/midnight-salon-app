'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: string;
  participant_name?: string;
  participant_role?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  sender_name?: string;
  sender_role?: string;
  content?: string;
  created_at?: string;
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConvos() {
      try {
        const res = await fetch('/api/messages/get-conversations-list');
        if (!res.ok) throw new Error('Failed to load conversations');
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingConvos(false);
      }
    }
    fetchConvos();
  }, []);

  async function openConversation(convo: Conversation) {
    setSelectedConvo(convo);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/get-conversation?with=${convo.id}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/30',
    artist: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    customer: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Message Moderation</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">Read-only view of all conversations</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Conversation list */}
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] flex flex-col overflow-hidden ${selectedConvo ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <p className="text-sm font-semibold text-white">All Conversations</p>
            <p className="text-xs text-[#a0a0a0] mt-0.5">{conversations.length} total</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-[#2a2a2a] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageSquare size={36} className="text-[#2a2a2a] mb-3" />
                <p className="text-[#a0a0a0] text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a2a]">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => openConversation(convo)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors
                      ${selectedConvo?.id === convo.id ? 'bg-[#c9a84c]/5 border-l-2 border-[#c9a84c]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {convo.participant_name || 'Unknown'}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${roleColors[convo.participant_role || ''] || 'text-[#a0a0a0] border-[#2a2a2a]'}`}
                          >
                            {convo.participant_role || 'user'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#a0a0a0] truncate">{convo.last_message || 'No messages'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-[10px] text-[#a0a0a0]">
                          {convo.last_message_at ? new Date(convo.last_message_at).toLocaleDateString() : ''}
                        </p>
                        {(convo.unread_count || 0) > 0 && (
                          <span className="bg-[#c9a84c] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {convo.unread_count}
                          </span>
                        )}
                        <ChevronRight size={14} className="text-[#2a2a2a]" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Message thread */}
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] lg:col-span-2 flex flex-col overflow-hidden ${selectedConvo ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedConvo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={48} className="text-[#2a2a2a] mb-4" />
              <p className="text-white font-medium mb-1">No conversation selected</p>
              <p className="text-[#a0a0a0] text-sm">Choose a conversation from the list to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConvo(null)}
                  className="lg:hidden h-8 w-8 p-0 text-[#a0a0a0] hover:text-white"
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] font-bold text-sm">
                  {(selectedConvo.participant_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedConvo.participant_name}</p>
                  <p className="text-xs text-[#a0a0a0] capitalize">{selectedConvo.participant_role}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs border-[#2a2a2a] text-[#a0a0a0]">
                  Read-only
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className={`h-12 w-48 bg-[#2a2a2a] rounded-2xl animate-pulse`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-[#a0a0a0] text-sm py-8">No messages in this conversation</p>
                ) : (
                  messages.map((msg) => {
                    const isArtist = msg.sender_role === 'artist';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isArtist ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isArtist ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isArtist ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm ${
                              isArtist
                                ? 'bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-white rounded-br-sm'
                                : 'bg-[#2a2a2a] text-white rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 px-8 ${isArtist ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] text-[#a0a0a0]">{msg.sender_name}</span>
                          <span className="text-[10px] text-[#a0a0a0]">·</span>
                          <span className="text-[10px] text-[#a0a0a0]">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Read-only notice */}
              <div className="px-4 py-3 border-t border-[#2a2a2a] bg-[#0f0f0f]/30">
                <p className="text-xs text-center text-[#a0a0a0]">
                  This is a moderation view — replies are not available here
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
