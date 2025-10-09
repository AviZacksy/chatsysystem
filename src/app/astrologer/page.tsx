'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatSession, getUserChatSessions, getOrCreateChatSession } from '../../lib/firestore';
import { getSession, AuthSessionData, setSession } from '../../lib/auth';

interface ChatRequest {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
  uniqueId: string;
}

export default function AstrologerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSessionData | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession || currentSession.role !== 'astrologer') {
      alert('Please login as an astrologer to access this page.');
      router.push('/test-chat');
      return;
    }
    setSession(currentSession);
    setIsClient(true);
    loadAstrologerData(currentSession);
  }, [router]);

  const loadAstrologerData = async (currentSession: AuthSessionData) => {
    try {
      setLoading(true);
      
      // Load active chat sessions for this astrologer
      const sessions = await getUserChatSessions(currentSession.astrologerId || '', 'astrologer');
      setActiveChats(sessions);

      // For demo, create some mock chat requests
      // In real app, these would come from your PHP backend
      const mockRequests: ChatRequest[] = [
        {
          id: 'req_1',
          userId: 'user_123',
          userName: 'John Doe',
          message: 'I need help with my career guidance',
          timestamp: '2 minutes ago',
          status: 'pending',
          uniqueId: 'CHAT_123_55'
        },
        {
          id: 'req_2',
          userId: 'user_456',
          userName: 'Jane Smith',
          message: 'Can you help me understand my love life?',
          timestamp: '5 minutes ago',
          status: 'pending',
          uniqueId: 'CHAT_456_55'
        }
      ];
      
      setChatRequests(mockRequests);
    } catch (error) {
      console.error('Error loading astrologer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: ChatRequest) => {
    try {
      // Update request status
      setChatRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'accepted' as const }
            : req
        )
      );

      // Navigate to chat
      router.push(`/chatbox?uniqueId=${request.uniqueId}&userId=${request.userId}&astrologerId=${session?.astrologerId}&name=${request.userName}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept chat request');
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setChatRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
  };

  const handleJoinActiveChat = (chatSession: ChatSession) => {
    router.push(`/chatbox?id=${chatSession.id}&name=User ${chatSession.userId.slice(-4)}`);
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return 'Just now';
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
        backgroundSize: '400% 400%',
        animation: 'gradientMove 15s ease infinite'
      }}>
        <style jsx>{`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
      backgroundSize: '400% 400%',
      animation: 'gradientMove 15s ease infinite'
    }}>
      <style jsx>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="h-screen flex flex-col bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10 max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="p-6 text-white shadow-lg" style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
          backgroundSize: '400% 400%',
          animation: 'gradientMove 15s ease infinite'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Astrologer Dashboard</h1>
              <p className="text-blue-200">Welcome, {session?.name || 'Astrologer'}</p>
            </div>
            <button
              onClick={() => router.push('/test-chat')}
              className="text-white/60 hover:text-white transition-colors text-sm"
            >
              ← Back to Test
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat Requests */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">New Chat Requests</h2>
                {chatRequests.length === 0 ? (
                  <div className="bg-white/10 p-6 rounded-lg text-center text-white/60">
                    <div className="text-4xl mb-2">📩</div>
                    <p>No new chat requests</p>
                  </div>
                ) : (
                  chatRequests.map((request) => (
                    <div key={request.id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{request.userName}</h3>
                        <span className="text-xs text-white/60">{request.timestamp}</span>
                      </div>
                      <p className="text-white/80 text-sm mb-3">{request.message}</p>
                      <div className="flex space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(request)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <span className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
                            Accepted
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Active Chats */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Active Chats</h2>
                {activeChats.length === 0 ? (
                  <div className="bg-white/10 p-6 rounded-lg text-center text-white/60">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No active chats</p>
                  </div>
                ) : (
                  activeChats.map((chat) => (
                    <div key={chat.id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">User {chat.userId.slice(-4)}</h3>
                        <span className="text-xs text-white/60">
                          {chat.lastMessageTime ?
                            (chat.lastMessageTime instanceof Date ?
                              formatTimeAgo(chat.lastMessageTime) :
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (chat.lastMessageTime as any).toDate ?
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatTimeAgo((chat.lastMessageTime as any).toDate()) :
                                'Just now') :
                            'Just now'}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-3">
                        {chat.lastMessage || 'No messages yet'}
                      </p>
                      <button
                        onClick={() => handleJoinActiveChat(chat)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Join Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
