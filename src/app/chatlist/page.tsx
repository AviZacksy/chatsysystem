'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatSession, getUserChatSessions, getOrCreateChatSession } from '../../lib/firestore';
import { getSession, AuthSessionData } from '../../lib/auth';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  uniqueId?: string;
}

export default function ChatList() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSessionData | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    setIsClient(true);
    if (currentSession) {
      loadChatSessions(currentSession);
    }
  }, [router]);

  const loadChatSessions = async (currentSession: AuthSessionData) => {
    try {
      setLoading(true);
      const sessions = await getUserChatSessions(currentSession.userId || currentSession.astrologerId || '', currentSession.role);

      const displayChats: Chat[] = sessions.map((session) => ({
        id: session.id,
        uniqueId: session.uniqueId,
        name: `Astrologer ${session.astrologerId.slice(-4)}`,
        lastMessage: session.lastMessage || 'No messages yet',
        timestamp: session.lastMessageTime ?
          (session.lastMessageTime instanceof Date ?
            formatTimeAgo(session.lastMessageTime) :
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session.lastMessageTime as any).toDate ? 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatTimeAgo((session.lastMessageTime as any).toDate()) :
              'Just now') :
          'Just now',
        unreadCount: 0,
        avatar: '🔮'
      }));

      setChats(displayChats);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleChatClick = (chatId: string, chatName: string, uniqueId?: string) => {
    router.push(`/chatbox?id=${chatId}&name=${encodeURIComponent(chatName)}&uniqueId=${uniqueId || ''}`);
  };

  const handleNewChat = async () => {
    if (!session) {
      alert('Please login to start a new chat.');
      router.push('/login');
      return;
    }

    const phpUniqueId = prompt('Enter unique ID from PHP system:');
    if (!phpUniqueId) return;

    try {
      const astrologerId = 'astrologer_456';
      const sessionData = await getOrCreateChatSession(
        phpUniqueId,
        session.userId || session.astrologerId || '',
        astrologerId
      );

      router.push(`/chatbox?uniqueId=${phpUniqueId}&userId=${session.userId || session.astrologerId}&astrologerId=${astrologerId}&name=New Astrologer`);
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Failed to create new chat. Please try again.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: '#fff2cf'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: '#fff2cf'
    }}>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Chat with Astrologers</h1>
            <p className="text-white/80">Connect with experienced astrologers for guidance</p>
          </div>

          {/* Chat List */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="p-6 text-center text-white/60">
                <div className="text-4xl mb-2">🔮</div>
                <p>No chat sessions yet</p>
                <p className="text-sm">Start a new chat with an astrologer</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    data-chat-id={chat.id}
                    onClick={() => handleChatClick(chat.id, chat.name, chat.uniqueId)}
                    className="p-4 hover:bg-white/10 cursor-pointer transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-lg">
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-white truncate">
                            {chat.name}
                          </h3>
                          <span className="text-xs text-white/60 ml-2 flex-shrink-0">{chat.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-white/80 truncate">
                            {chat.lastMessage}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-2 flex-shrink-0 shadow-lg">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Chat Button */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
              <button 
                onClick={handleNewChat}
                className="w-full text-white py-2.5 rounded-lg font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-105" 
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientMove 15s ease infinite'
                }}
              >
                + Start New Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}