'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react';

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
  sender_id?: string;
  sender_name?: string;
  sender_role?: string;
  content?: string;
  created_at?: string;
}

export default function CustomerMessagesPage() {
  const [currentUserId, setCurrentUserId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('salon_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setCurrentUserId(u.id || '');
      } catch {}
    }
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConvo) {
      pollRef.current = setInterval(() => {
        fetchMessages(selectedConvo.id, false);
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConvo]);

  async function fetchConversations() {
    setLoadingConvos(true);
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

  async function fetchMessages(convoId: string, showLoading = true) {
    if (showLoading) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/get-conversation?with=${convoId}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      if (showLoading) setError(err.message);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }

  async function openConversation(convo: Conversation) {
    setSelectedConvo(convo);
    setMessages([]);
    await fetchMessages(convo.id);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch('/api/messages/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedConvo.id, content }),
      });
      if (!res.ok) throw new Error('Failed to send');
      await fetchMessages(selectedConvo.id, false);
    } catch (err: any) {
      setNewMessage(content);
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[#c9a84c]/10 text-[#c9a84c]',
    artist: 'bg-purple-500/10 text-purple-400',
    customer: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Messages</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">Chat with your artists</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-13rem)]">
        {/* Conversation list */}
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] flex flex-col overflow-hidden ${selectedConvo ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-[#2a2a2a]">
            <p className="text-sm font-semibold text-white">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-[#2a2a2a] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
                <MessageSquare size={36} className="text-[#2a2a2a] mb-3" />
                <p className="text-[#a0a0a0] text-sm">No conversations yet</p>
                <p className="text-[#a0a0a0] text-xs mt-1">Book a service to start chatting with your artist</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2a2a]">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => openConversation(convo)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-white/[0.03] transition-colors
                      ${selectedConvo?.id === convo.id ? 'bg-[#c9a84c]/5 border-l-2 border-[#c9a84c]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${roleColors[convo.participant_role || ''] || 'bg-[#2a2a2a] text-[#a0a0a0]'}`}>
                            {(convo.participant_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-white truncate">
                            {convo.participant_name || 'Unknown'}
                          </p>
                        </div>
                        <p className="text-xs text-[#a0a0a0] truncate ml-9">{convo.last_message || 'No messages'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-[10px] text-[#a0a0a0]">
                          {convo.last_message_at ? new Date(convo.last_message_at).toLocaleDateString() : ''}
                        </p>
                        {(convo.unread_count || 0) > 0 && (
                          <span className="bg-[#c9a84c] text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {convo.unread_count}
                          </span>
                        )}
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
              <p className="text-[#a0a0a0] text-sm">Choose a conversation from the left</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConvo(null)}
                  className="lg:hidden h-8 w-8 p-0 text-[#a0a0a0] hover:text-white"
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${roleColors[selectedConvo.participant_role || ''] || 'bg-[#2a2a2a] text-[#a0a0a0]'}`}>
                  {(selectedConvo.participant_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedConvo.participant_name}</p>
                  <p className="text-xs text-[#a0a0a0] capitalize">{selectedConvo.participant_role}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className="h-10 w-52 bg-[#2a2a2a] rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-[#a0a0a0] text-sm py-8">Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? '' : 'flex items-end gap-2'}`}>
                          {!isOwn && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${roleColors[msg.sender_role || ''] || 'bg-[#2a2a2a] text-[#a0a0a0]'}`}>
                              {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm ${
                                isOwn
                                  ? 'bg-[#c9a84c] text-black rounded-br-sm font-medium'
                                  : 'bg-[#2a2a2a] text-white rounded-bl-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <p className={`text-[10px] text-[#a0a0a0] mt-1 ${isOwn ? 'text-right' : ''}`}>
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-[#2a2a2a] flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 bg-[#0f0f0f] border-[#2a2a2a] text-white placeholder:text-[#a0a0a0] focus-visible:ring-[#c9a84c]/30"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-[#c9a84c] hover:bg-[#c9a84c]/80 text-black shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
