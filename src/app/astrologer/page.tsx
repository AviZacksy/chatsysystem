'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatSession, getUserChatSessions, listenChatRequests, ChatRequest, acceptChatRequest, rejectChatRequest } from '../../lib/firestore';
import { getSession, setSession, AuthSessionData } from '../../lib/auth';

// ChatRequest imported from lib

function AstrologerDashboardContent() {
  console.log('AstrologerDashboardContent component started');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState<AuthSessionData | null>(null);
  const [popupRequest, setPopupRequest] = useState<ChatRequest | null>(null);
  const seenRequestIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('Astrologer page useEffect triggered');
    setIsClient(true);
    
    // Add a small delay to ensure localStorage is available
    const checkSession = () => {
      console.log('checkSession function called');
      // Check URL parameters first
      const paramUniqueId = searchParams?.get('uniqueId');
      const paramAstrologerId = searchParams?.get('astrologerId');
      const paramName = searchParams?.get('name');
      
      console.log('Raw URL params:', {
        paramUniqueId,
        paramAstrologerId,
        paramName,
        allParams: searchParams?.toString()
      });
      
      let currentSession = getSession();
      console.log('Astrologer page - checking session:', currentSession);
      console.log('URL params:', { paramUniqueId, paramAstrologerId, paramName });
      
      // Create session from URL parameters or use defaults for direct access
      if (!currentSession) {
        try {
          const tempSession: AuthSessionData = {
            uniqueId: paramUniqueId || 'direct_astrologer_' + Date.now(),
            role: 'astrologer',
            astrologerId: paramAstrologerId || 'astro_' + Math.random().toString(36).substr(2, 9),
            name: paramName || 'Astrologer',
            apiBaseUrl: 'https://astrosolution-talktoastrologer.com'
          };
          setSession(tempSession);
          currentSession = tempSession;
          console.log('Created astrologer session for direct access:', tempSession);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      }
      
      console.log('Final session check:', currentSession);
      console.log('Session role:', currentSession?.role);
      console.log('Is astrologer?', currentSession?.role === 'astrologer');
      
      // AUTH CHECK COMPLETELY DISABLED FOR REAL SITE INTEGRATION
      console.log('AUTH CHECK DISABLED - LOADING PAGE DIRECTLY');
      
      setSessionState(currentSession);
      
      let cleanup: (() => void) | undefined;
      // Always load data, even without session
      loadAstrologerData(currentSession).then((cleanupFn) => {
        cleanup = cleanupFn;
      });
      
      return () => {
        if (cleanup) cleanup();
      };
    };
    
    // Small delay to ensure localStorage is ready
    const timeoutId = setTimeout(checkSession, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, searchParams]);

  const loadAstrologerData = async (currentSession: AuthSessionData | null) => {
    try {
      setLoading(true);
      
      // Use session data or defaults for direct access
      const astroId = currentSession?.astrologerId || 'default_astrologer';
      
      // Load active chat sessions for this astrologer
      const sessions = await getUserChatSessions(astroId, 'astrologer');
      setActiveChats(sessions);
      
      // Realtime chat requests for this astrologer
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🔮</span>
          </div>
          <div className="text-white text-lg font-medium">Loading Dashboard...</div>
          <div className="text-purple-200 text-sm mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl">🔮</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white">Astrologer Dashboard</h1>
                  <p className="text-xs sm:text-sm text-purple-200 hidden sm:block">
                    Welcome, {session?.name || 'Astrologer'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('Current session:', session);
                    console.log('Current chat requests:', chatRequests);
                    console.log('Seen request IDs:', seenRequestIdsRef.current);
                  }}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  Debug
                </button>
                <button
                  onClick={() => router.push('/test-chat')}
                  className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <span className="hidden sm:inline">← Back to Test</span>
                  <span className="sm:hidden">← Back</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Mobile Welcome Message */}
          <div className="sm:hidden mb-4">
            <p className="text-sm text-purple-200">
              Welcome, {session?.name || 'Astrologer'}
            </p>
          </div>

          {/* New Chat Request Popup */}
          {popupRequest && (
            <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-96 bg-white/95 backdrop-blur-md border border-white/20 text-gray-900 px-4 py-3 rounded-xl shadow-2xl z-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 mb-1">New chat request</div>
                  <div className="font-semibold text-sm truncate">
                    {popupRequest.userName || ('User ' + popupRequest.userId.slice(-4))}
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button 
                    onClick={handlePopupReject} 
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={handlePopupAccept} 
                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 p-4 sm:p-6 rounded-xl animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Chat Requests Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">New Chat Requests</h2>
                  <span className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full text-xs font-medium">
                    {chatRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>
                
                {chatRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl text-center border border-white/20">
                    <div className="text-4xl sm:text-5xl mb-3">📩</div>
                    <p className="text-white/70 text-sm sm:text-base">No new chat requests</p>
                    <p className="text-white/50 text-xs mt-1">You&apos;ll be notified when new requests arrive</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatRequests.filter(r => r.status === 'pending').map((request) => (
                      <div key={request.id} className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                              {request.userName || ('User ' + request.userId.slice(-4))}
                            </h3>
                            <p className="text-xs text-white/60 mt-1">ID: {request.id?.slice(-6)}</p>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2 mt-1"></div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(request)}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id as string)}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <span className="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium text-center">
                              ✓ Accepted
                            </span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium text-center">
                              ✗ Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Chats Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Active Chats</h2>
                  <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                    {activeChats.length}
                  </span>
                </div>
                
                {activeChats.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl text-center border border-white/20">
                    <div className="text-4xl sm:text-5xl mb-3">💬</div>
                    <p className="text-white/70 text-sm sm:text-base">No active chats</p>
                    <p className="text-white/50 text-xs mt-1">Accepted requests will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeChats.map((chat) => (
                      <div key={chat.id} className="bg-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base">
                              User {chat.userId.slice(-4)}
                            </h3>
                            <p className="text-xs text-white/60 mt-1">
                              {chat.lastMessageTime ?
                                (chat.lastMessageTime instanceof Date ?
                                  formatTimeAgo(chat.lastMessageTime) :
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  (chat.lastMessageTime as any).toDate ?
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatTimeAgo((chat.lastMessageTime as any).toDate()) :
                                    'Just now') :
                                'Just now'}
                            </p>
                          </div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full ml-2 mt-1"></div>
                        </div>
                        
                        <p className="text-white/80 text-xs sm:text-sm mb-4 line-clamp-2">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        
                        <button
                          onClick={() => handleJoinActiveChat(chat)}
                          className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                        >
                          💬 Join Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AstrologerDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🔮</span>
          </div>
          <div className="text-white text-lg font-medium">Loading Dashboard...</div>
          <div className="text-purple-200 text-sm mt-2">Please wait</div>
        </div>
      </div>
    }>
      <AstrologerDashboardContent />
    </Suspense>
  );
}
