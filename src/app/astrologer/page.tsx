'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatSession, getUserChatSessions, listenChatRequests, ChatRequest, acceptChatRequest, rejectChatRequest } from '../../lib/firestore';
import { getSession, AuthSessionData } from '../../lib/auth';

// ChatRequest imported from lib

export default function AstrologerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [popupRequest, setPopupRequest] = useState<ChatRequest | null>(null);
  const seenRequestIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession || currentSession.role !== 'astrologer') {
      alert('Please login as an astrologer to access this page.');
      router.push('/test-chat');
      return;
    }
    setSession(currentSession);
    setIsClient(true);
    
    let cleanup: (() => void) | undefined;
    loadAstrologerData(currentSession).then((cleanupFn) => {
      cleanup = cleanupFn;
    });
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  const loadAstrologerData = async (currentSession: AuthSessionData) => {
    try {
      setLoading(true);
      
      // Load active chat sessions for this astrologer
      const sessions = await getUserChatSessions(currentSession.astrologerId || '', 'astrologer');
      setActiveChats(sessions);
      
      // Realtime chat requests for this astrologer sno
      const astroId = currentSession.astrologerId || '';
      console.log('Setting up listener for astrologer:', astroId);
      const unsub = listenChatRequests(astroId, (reqs) => {
        console.log('Received chat requests:', reqs);
        setChatRequests(reqs);
        // Detect new pending request and trigger popup
        for (const r of reqs) {
          if (r.status === 'pending' && r.id && !seenRequestIdsRef.current.has(r.id)) {
            console.log('New pending request detected:', r);
            seenRequestIdsRef.current.add(r.id);
            setPopupRequest(r);
            break;
          }
        }
      });
      return () => unsub();
    } catch (error) {
      console.error('Error loading astrologer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: ChatRequest) => {
    try {
      const welcome = 'Namaste, please share your date of birth, name, and place of birth.';
      const sessionData = await acceptChatRequest(request.id!, welcome);
      router.push(`/chatbox?id=${sessionData.id}&name=${request.userName || ('User ' + request.userId.slice(-4))}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept chat request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    await rejectChatRequest(requestId);
  };

  const handlePopupAccept = async () => {
    if (!popupRequest) return;
    await handleAcceptRequest(popupRequest);
    setPopupRequest(null);
  };

  const handlePopupReject = async () => {
    if (!popupRequest?.id) return;
    await handleRejectRequest(popupRequest.id);
    setPopupRequest(null);
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('Current session:', session);
                  console.log('Current chat requests:', chatRequests);
                  console.log('Seen request IDs:', seenRequestIdsRef.current);
                }}
                className="text-white/60 hover:text-white transition-colors text-sm px-2 py-1 bg-blue-600 rounded"
              >
                Debug
              </button>
              <button
                onClick={() => router.push('/test-chat')}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                ← Back to Test
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {popupRequest && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-3 rounded-xl shadow-2xl z-50 w-[95%] max-w-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">New chat request</div>
                  <div className="font-semibold">{popupRequest.userName || ('User ' + popupRequest.userId.slice(-4))}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePopupReject} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm">Reject</button>
                  <button onClick={handlePopupAccept} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Accept</button>
                </div>
              </div>
            </div>
          )}
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
                {chatRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="bg-white/10 p-6 rounded-lg text-center text-white/60">
                    <div className="text-4xl mb-2">📩</div>
                    <p>No new chat requests</p>
                  </div>
                ) : (
                  chatRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{request.userName || ('User ' + request.userId.slice(-4))}</h3>
                        <span className="text-xs text-white/60">{request.id?.slice(-6)}</span>
                      </div>
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
                              onClick={() => handleRejectRequest(request.id as string)}
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
