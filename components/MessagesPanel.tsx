import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import {
  MessageSquare, Send, X, User, ChevronLeft,
  Loader2, Search, Check, CheckCheck
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  sender: { id: string; name: string; avatarUrl?: string };
  receiver: { id: string; name: string; avatarUrl?: string };
  contest?: { id: string; title: string };
  read: boolean;
  createdAt: string;
}

interface Conversation {
  user: { id: string; name: string; avatarUrl?: string; role: string };
  contest?: { id: string; title: string };
  lastMessageAt: string;
  unreadCount: number;
}

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
  initialContestId?: string;
}

export const MessagesPanel: React.FC<MessagesPanelProps> = ({
  isOpen,
  onClose,
  initialUserId,
  initialContestId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user.id, selectedConversation.contest?.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages?action=conversations', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);

        // If initialUserId provided, open that conversation
        if (initialUserId) {
          const conv = data.conversations?.find((c: Conversation) => c.user.id === initialUserId);
          if (conv) setSelectedConversation(conv);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string, contestId?: string) => {
    setLoading(true);
    try {
      let url = `/api/messages?conversationWith=${userId}`;
      if (contestId) url += `&contestId=${contestId}`;

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          receiverId: selectedConversation.user.id,
          content: newMessage.trim(),
          contestId: selectedConversation.contest?.id || initialContestId,
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}g`;
    return date.toLocaleDateString('it-IT');
  };

  const filteredConversations = conversations.filter(c =>
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contest?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-xl flex">
        {/* Conversations List */}
        <div className={`w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare size={20} /> Messaggi
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cerca conversazioni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-center text-neutral-muted py-8 px-4">
                {searchTerm ? 'Nessun risultato' : 'Nessuna conversazione'}
              </p>
            ) : (
              filteredConversations.map((conv, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 border-b text-left ${
                    selectedConversation?.user.id === conv.user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {conv.user.avatarUrl ? (
                    <img src={conv.user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{conv.user.name}</p>
                      <span className="text-xs text-neutral-muted">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    {conv.contest && (
                      <p className="text-xs text-neutral-muted truncate">{conv.contest.title}</p>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      conv.user.role === 'ARCHITECT' ? 'bg-green-100 text-green-800' :
                      conv.user.role === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                    }`}>{conv.user.role}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft size={20} />
                </button>
                {selectedConversation.user.avatarUrl ? (
                  <img src={selectedConversation.user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={20} className="text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedConversation.user.name}</p>
                  {selectedConversation.contest && (
                    <p className="text-xs text-neutral-muted">{selectedConversation.contest.title}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-neutral-muted py-8">
                    Inizia la conversazione
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-white rounded-br-none'
                            : 'bg-white border rounded-bl-none'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-1 ${
                            isOwn ? 'text-white/70' : 'text-neutral-muted'
                          }`}>
                            <span className="text-xs">{formatTime(msg.createdAt)}</span>
                            {isOwn && (
                              msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-muted">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Seleziona una conversazione</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
