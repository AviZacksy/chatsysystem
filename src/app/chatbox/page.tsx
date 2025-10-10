'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatMessage, sendMessage, getMessages, uploadFile, getOrCreateChatSession, createChatRequest, listenChatRequestById } from '../../lib/firestore';
import { getSession, setSession } from '../../lib/auth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  avatar: string;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
}

function ChatBoxContent() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatName, setChatName] = useState('John Doe');
  const [chatId, setChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [, setFirebaseMessages] = useState<ChatMessage[]>([]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [, setPendingRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(null);

  const sessionRef = useRef(getSession());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatSessionDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Session timer effect
  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sessionStartTime]);

  // Track scroll position to show a "scroll to bottom" button like WhatsApp
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setShowScrollToBottom(!nearBottom);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // initialize state
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [messagesContainerRef]);

  const handleScrollToBottomClick = () => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() || selectedFile) && chatId) {
      try {
        const session = sessionRef.current;
        if (!session) {
          alert('Session not found. Open this chat via your PHP Start Chat button.');
          return;
        }

        // Determine identity based on role
        const isUser = session.role === 'user';
        const senderId = isUser ? session.userId : session.astrologerId;
        const senderType: 'user' | 'astrologer' = isUser ? 'user' : 'astrologer';
        if (!senderId) {
          alert('Missing sender identity. Open chat from your PHP Start Chat link.');
          return;
        }

        let fileUrl = '';
        let messageType: 'text' | 'image' | 'file' = 'text';
        
        // Handle file upload if selected
        if (selectedFile) {
          fileUrl = await uploadFile(selectedFile, chatId);
          messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        }

        // Send message to Firebase
        await sendMessage({
          chatId,
          senderId,
          senderType,
          message: newMessage.trim() || (selectedFile ? `📎 ${selectedFile.name}` : ''),
          messageType,
          fileUrl: fileUrl || undefined,
          fileName: selectedFile?.name
        });

        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Simulate typing indicator
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.overflow = 'hidden';
      el.style.height = 'auto';
      // allow more lines without showing scrollbar
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileType = file.type;
      
      if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        alert('Please select only images or videos');
      }
    }
    
    // Clear the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      // prefer default device first; if fails, try explicit constraints
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        });
      }
      
      // pick best supported mimetype (desktop compatibility)
      const preferred = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      let mimeType: string | undefined;
      for (const t of preferred) {
        if (typeof window !== 'undefined' && 'MediaRecorder' in window && MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
      }
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const effectiveType = (mimeType && chunks.length > 0) ? mimeType : (chunks[0]?.type || 'audio/webm');
        const audioBlob = new Blob(chunks, { type: effectiveType });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Send audio message to Firebase
        try {
          const session = sessionRef.current;
          if (!session || !chatId) {
            console.error('Missing session or chatId for voice message');
            return;
          }

          const isUser = session.role === 'user';
          const senderId = isUser ? session.userId : session.astrologerId;
          const senderType: 'user' | 'astrologer' = isUser ? 'user' : 'astrologer';
          if (!senderId) return;

          const fileExtension = effectiveType.includes('webm') ? 'webm' : 'wav';
          const audioFile = new File([audioBlob], `voice_${Date.now()}.${fileExtension}`, { type: effectiveType });
          const fileUrl = await uploadFile(audioFile, chatId);

          await sendMessage({
            chatId,
            senderId,
            senderType,
            message: `🎤 Voice message (${formatTime(recordingTime)})`,
            messageType: 'file',
            fileUrl,
            fileName: `voice_${Date.now()}.${fileExtension}`
          });

        } catch (error) {
          console.error('Error sending voice message:', error);
          alert('Failed to send voice message. Please try again.');
        }
      };

      // timeslice ensures desktop fires dataavailable; fallback without timeslice
      try { recorder.start(1000); } catch { recorder.start(); }
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow microphone access to record voice messages.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording && mediaRecorder.state === 'recording') {
      try { mediaRecorder.requestData(); } catch {}
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  useEffect(() => {
    setIsClient(true);
    
    // Read params early (used for auto-session fallback)
    const paramName = searchParams?.get('name');
    const paramChatId = searchParams?.get('id');
    const paramUniqueId = searchParams?.get('uniqueId');
    const paramUserId = searchParams?.get('userId');
    const paramAstrologerId = searchParams?.get('astrologerId');

    // Ensure session; if missing but URL has identity, create a temporary session
    let s = getSession();
    if (!s && paramUniqueId && (paramUserId || paramAstrologerId)) {
      try {
        setSession({
          uniqueId: paramUniqueId,
          role: paramUserId ? 'user' as const : 'astrologer' as const,
          userId: paramUserId || undefined,
          astrologerId: paramAstrologerId || undefined,
          apiBaseUrl: process.env.NEXT_PUBLIC_PHP_API_BASE_URL || 'https://astrosolution-talktoastrologer.com'
        });
        s = getSession();
      } catch {
        // fall-through to login redirect
      }
    }

    sessionRef.current = s;
    // Only redirect to /login if no session AND URL doesn't provide identity to bootstrap
    // Do not redirect to /login anymore; rely on URL params or stay readonly

    if (paramName) setChatName(decodeURIComponent(paramName));

    // If chatId provided, use it directly
    if (paramChatId) {
      // Clear old messages first
      setMessages([]);
      setFirebaseMessages([]);
      
      setChatId(paramChatId);
      // Start session timer
      setSessionStartTime(new Date());
      setSessionDuration(0);
      return;
    }

    // Else resolve via uniqueId (+ ids)
    (async () => {
      if (!paramUniqueId) return;
      const effectiveUserId = paramUserId || s?.userId || '';
      const effectiveAstroId = paramAstrologerId || s?.astrologerId || '';
      if (!effectiveUserId || !effectiveAstroId) return;
      try {
        // If request-based: create a pending chat request and wait for acceptance
        const reqId = await createChatRequest(paramUniqueId, effectiveUserId, effectiveAstroId, paramName || undefined);
        setPendingRequestId(reqId);
        setRequestStatus('pending');
        const unsubReq = listenChatRequestById(reqId, async (req) => {
          console.log('Chat request status update:', req);
          if (!req) return;
          if (req.status === 'accepted') {
            console.log('Chat request accepted, creating session');
            setRequestStatus('accepted');
            // Now create/get session and open chat
            const session = await getOrCreateChatSession(paramUniqueId, effectiveUserId, effectiveAstroId);
            setChatId(session.id);
            setSessionStartTime(new Date());
            setSessionDuration(0);
            unsubReq();
          } else if (req.status === 'rejected') {
            setRequestStatus('rejected');
            unsubReq();
          }
        });

        // Clear old messages first (fresh start each time)
        setMessages([]);
        setFirebaseMessages([]);
      } catch (e) {
        console.error('Failed to resolve chat by uniqueId:', e);
        alert('Unable to open chat. Please try again.');
      }
    })();
  }, [searchParams, router]);

  // Listen to Firebase messages
  useEffect(() => {
    if (chatId) {
      const unsubscribe = getMessages(chatId, (firebaseMessages) => {
        setFirebaseMessages(firebaseMessages);
        const displayMessages: Message[] = firebaseMessages.map((msg) => ({
          id: msg.id || '',
          text: msg.message,
          sender: msg.senderType === 'user' ? 'user' : 'other',
          timestamp: msg.timestamp ? 
            (msg.timestamp instanceof Date ? 
              msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (msg.timestamp as any).toDate ? 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (msg.timestamp as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) :
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: msg.senderType === 'user' ? '👩' : '👨',
          status: 'read',
          type: (msg.messageType === 'file' && (msg.fileName?.startsWith('voice_') || (msg.message && msg.message.includes('Voice message')))) ? 'audio' : (msg.messageType === 'file' ? 'video' : msg.messageType),
          mediaUrl: msg.fileUrl
        }));
        setMessages(displayMessages);
      });
      return () => unsubscribe();
    }
  }, [chatId]);

  if (!isClient) {
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
        <div className="h-screen flex flex-col bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10 relative z-10">
          <div className="text-white p-4 flex items-center space-x-3 shadow-lg" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-lg shadow-lg">
              👨
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-lg">{chatName}</h1>
              <p className="text-xs text-blue-200">Online</p>
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="animate-pulse space-y-4">
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                <div className="ml-2 w-48 h-12 bg-white/20 rounded-2xl"></div>
              </div>
              <div className="flex justify-end">
                <div className="w-48 h-12 bg-white/20 rounded-2xl"></div>
                <div className="ml-2 w-8 h-8 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

      return (
        <div className="min-h-screen relative overflow-hidden" style={{
              background: '#fff2cf'
        }}>
      
      {/* Mobile Layout */}
      <div className="block md:hidden relative z-10">
        <div className="h-screen flex flex-col bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10">
          {/* Header */}
          <div className="text-white p-4 flex items-center space-x-3 sticky top-0 z-10 shadow-lg" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <button 
              onClick={() => router.push('/chatlist')}
              className="text-white hover:text-blue-200 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-lg shadow-lg">
              👨
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-lg">{chatName}</h1>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-blue-200">
                  {sessionStartTime ? `Session: ${formatSessionDuration(sessionDuration)}` : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
                  <button
                    onClick={handleVoiceButtonClick}
                    className={`transition-colors p-2 rounded-full ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-white hover:text-blue-200 hover:bg-white/20'
                    }`}
                  >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
          </div>

              {/* Messages / Pending State */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-black/10 to-black/20">
                {requestStatus === 'pending' && (
                  <div className="text-center text-white/80 py-3">Waiting for astrologer to accept your chat…</div>
                )}
                {requestStatus === 'rejected' && (
                  <div className="text-center text-red-300 py-3">Astrologer is unavailable. Please try another astrologer.</div>
                )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                  {message.sender === 'other' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-br-md' 
                      : 'bg-white/10 text-white rounded-bl-md border border-white/20 backdrop-blur-sm'
                  }`}>
                    {message.type === 'image' && message.mediaUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.mediaUrl} 
                          alt="Shared image" 
                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                        />
                      </div>
                    )}
                    {message.type === 'video' && message.mediaUrl && (
                      <div className="mb-2">
                        <video 
                          src={message.mediaUrl} 
                          controls 
                          className="max-w-[200px] max-h-[200px] rounded-lg"
                        />
                      </div>
                    )}
                    {message.type === 'audio' && message.mediaUrl && (
                      <div className="mb-2">
                        <audio 
                          src={message.mediaUrl} 
                          controls 
                          className="w-full max-w-[200px]"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-white/60'
                      }`}>
                        {message.timestamp}
                      </p>
                      {message.sender === 'user' && message.status && (
                        <div className="flex items-center space-x-1">
                          {message.status === 'read' && (
                            <svg className="w-3 h-3 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-sm shadow-md">
                    👨
                  </div>
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md border border-white/20 shadow-sm backdrop-blur-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording... {formatTime(recordingTime)}</span>
              </div>
            )}

            {showScrollToBottom && (
              <button onClick={handleScrollToBottomClick} className="fixed bottom-24 right-4 bg-white/20 text-white p-2 rounded-full border border-white/30">
                ↓
              </button>
            )}
          </div>

          {/* Input */}
              <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10 shadow-lg">
                <div className="flex items-end space-x-3">
                  <button 
                    onClick={handleGalleryClick}
                    className="text-white/80 hover:text-purple-300 transition-all duration-200 p-3 hover:bg-white/20 rounded-full hover:scale-110 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex-1">
                    {previewUrl && selectedFile && (
                      <div className="mb-2 p-2 bg-white/10 rounded-lg">
                        {selectedFile.type.startsWith('image/') ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-w-[100px] max-h-[100px] rounded object-cover"
                          />
                        ) : (
                          <video 
                            src={previewUrl} 
                            className="max-w-[100px] max-h-[100px] rounded"
                          />
                        )}
                        <button 
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="ml-2 text-white/60 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full p-3 border border-white/20 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white/10 focus:bg-white/20 transition-all duration-200 text-white placeholder-white/60 backdrop-blur-sm overflow-hidden"
                      rows={1}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !selectedFile}
                    className="text-white p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
                      backgroundSize: '400% 400%',
                      animation: 'gradientMove 15s ease infinite'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <div className="h-screen flex flex-col bg-white max-w-4xl mx-auto shadow-2xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="text-white p-6 flex items-center space-x-4 shadow-lg" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <button 
              onClick={() => router.push('/chatlist')}
              className="text-white hover:text-blue-200 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl shadow-lg">
              👨
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{chatName}</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-200">
                  {sessionStartTime ? `Session: ${formatSessionDuration(sessionDuration)}` : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleVoiceButtonClick}
                className={`transition-colors p-3 rounded-full ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-white hover:text-blue-200 hover:bg-white/20'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex max-w-[75%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                  {message.sender === 'other' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                  <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                  }`}>
                    <p className="text-base leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-sm ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                      </p>
                      {message.sender === 'user' && message.status && (
                        <div className="flex items-center space-x-1">
                          {message.status === 'read' && (
                            <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-end space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg shadow-md">
                    👨
                  </div>
                  <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-black/20 backdrop-blur-sm border-t border-white/10 shadow-lg">
            <div className="flex items-end space-x-4">
              <button 
                onClick={handleGalleryClick}
                className="text-white/80 hover:text-purple-300 transition-all duration-200 p-4 hover:bg-white/20 rounded-full hover:scale-110 shadow-lg"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex-1">
                    <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                      className="w-full p-4 border border-white/20 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-white/10 focus:bg-white/20 transition-all duration-200 text-white placeholder-white/60 backdrop-blur-sm overflow-hidden"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="text-white p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientMove 15s ease infinite'
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="h-screen flex flex-col bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl w-full mx-auto overflow-hidden">
          {/* Header */}
          <div className="text-white p-8 flex items-center space-x-4 shadow-lg" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <button 
              onClick={() => router.push('/chatlist')}
              className="text-white hover:text-blue-200 transition-colors p-2"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
              👨
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{chatName}</h1>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-base text-blue-200">
                  {sessionStartTime ? `Session: ${formatSessionDuration(sessionDuration)}` : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={handleVoiceButtonClick}
                className={`transition-colors p-3 rounded-full ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-white hover:text-blue-200 hover:bg-white/20'
                }`}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-b from-black/10 to-black/20">
            {requestStatus === 'pending' && (
              <div className="text-center text-white/80 py-3">Waiting for astrologer to accept your chat…</div>
            )}
            {requestStatus === 'rejected' && (
              <div className="text-center text-red-300 py-3">Astrologer is unavailable. Please try another astrologer.</div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex max-w-[60%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-4`}>
                  {message.sender === 'other' && (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                  <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
                      : 'bg-white/10 text-white rounded-bl-md border border-white/10 backdrop-blur-sm'
                  }`}>
                    {message.type === 'image' && message.mediaUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.mediaUrl} 
                          alt="Shared image" 
                          className="max-w-[300px] max-h-[300px] rounded-lg object-cover"
                        />
                      </div>
                    )}
                    {message.type === 'video' && message.mediaUrl && (
                      <div className="mb-2">
                        <video 
                          src={message.mediaUrl} 
                          controls 
                          className="max-w-[300px] max-h-[300px] rounded-lg"
                        />
                      </div>
                    )}
                    {message.type === 'audio' && message.mediaUrl && (
                      <div className="mb-2">
                        <audio 
                          src={message.mediaUrl} 
                          controls 
                          className="w-full max-w-[300px]"
                        />
                      </div>
                    )}
                    <p className="text-base leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-white/60'
                      }`}>
                        {message.timestamp}
                      </p>
                      {message.sender === 'user' && message.status && (
                        <div className="flex items-center space-x-1">
                          {message.status === 'read' && (
                            <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                      {message.avatar}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-end space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl shadow-md">
                    👨
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-8 py-6 bg-black/20 backdrop-blur-sm border-t border-white/10 shadow-lg">
            <div className="flex items-end space-x-4">
              <button 
                onClick={handleGalleryClick}
                className="text-white/80 hover:text-purple-300 transition-all duration-200 p-4 hover:bg-white/20 rounded-full hover:scale-110 shadow-lg"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex-1">
                {previewUrl && selectedFile && (
                  <div className="mb-2 p-2 bg-white/10 rounded-lg">
                    {selectedFile.type.startsWith('image/') ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-w-[150px] max-h-[150px] rounded object-cover"
                      />
                    ) : (
                      <video 
                        src={previewUrl} 
                        className="max-w-[150px] max-h-[150px] rounded"
                      />
                    )}
                    <button 
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="ml-2 text-white/60 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full p-4 border border-white/20 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base bg-white/10 focus:bg-white/20 transition-all duration-200 text-white placeholder-white/60 backdrop-blur-sm overflow-hidden"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !selectedFile}
                className="text-white p-4 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483, #e94560)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientMove 15s ease infinite'
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatBox() {
  return (
    <Suspense fallback={
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
        <div className="h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <ChatBoxContent />
    </Suspense>
  );
}
