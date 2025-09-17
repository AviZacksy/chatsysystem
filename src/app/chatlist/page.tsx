'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
}

export default function ChatList() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'John Doe',
      lastMessage: 'Hey, how are you doing?',
      timestamp: '2 min ago',
      unreadCount: 2,
      avatar: '👨'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      lastMessage: 'Can we meet tomorrow?',
      timestamp: '1 hour ago',
      unreadCount: 0,
      avatar: '👩'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      lastMessage: 'Thanks for the help!',
      timestamp: '3 hours ago',
      unreadCount: 1,
      avatar: '👨‍💼'
    },
    {
      id: '4',
      name: 'Emma Davis',
      lastMessage: 'See you later!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      avatar: '👩‍🎨'
    }
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChatClick = (chatId: string, chatName: string) => {
    // Simple and smooth navigation
    router.push(`/chatbox?chatId=${chatId}&name=${encodeURIComponent(chatName)}`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
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
        <div className="max-w-md mx-auto bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10">
          <div className="text-white p-4" style={{
            background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <h1 className="text-xl font-bold">Chats</h1>
          </div>
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
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
      
      {/* Mobile Layout */}
      <div className="block md:hidden relative z-10">
        <div className="bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10">
          {/* Header */}
          <div className="text-white p-4 sticky top-0 z-10 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <h1 className="text-lg font-bold">Chats</h1>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-white/10">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-2.5 text-sm bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/60 backdrop-blur-sm"
            />
          </div>

          {/* Chat List */}
          <div className="divide-y divide-white/10 max-h-[calc(100vh-140px)] overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                data-chat-id={chat.id}
                onClick={() => handleChatClick(chat.id, chat.name)}
                className="p-3 hover:bg-white/10 cursor-pointer transition-colors duration-200 active:bg-white/20"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-lg">
                    {chat.avatar}
                  </div>

                  {/* Chat Info */}
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

          {/* New Chat Button */}
          <div className="p-3 border-t border-white/10 bg-black/20 backdrop-blur-sm sticky bottom-0">
            <button className="w-full text-white py-2.5 rounded-lg font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-105" style={{
              background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
              backgroundSize: '400% 400%',
              animation: 'gradientMove 15s ease infinite'
            }}>
              Start New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden relative z-10">
        <div className="max-w-2xl mx-auto bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10 min-h-screen">
          {/* Header */}
          <div className="text-white p-6 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <h1 className="text-2xl font-bold">Chats</h1>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-white/10">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base text-white placeholder-white/60 backdrop-blur-sm"
            />
          </div>

          {/* Chat List */}
          <div className="divide-y divide-white/10">
            {chats.map((chat) => (
              <div
                key={chat.id}
                data-chat-id={chat.id}
                onClick={() => handleChatClick(chat.id, chat.name)}
                className="p-6 hover:bg-white/10 cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                    {chat.avatar}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-sm text-white/60 ml-4 flex-shrink-0">{chat.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-white/80 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center ml-4 flex-shrink-0 shadow-lg">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New Chat Button */}
          <div className="p-6">
            <button className="w-full text-white py-4 rounded-lg font-medium transition-all duration-200 text-base shadow-lg hover:shadow-xl transform hover:scale-105" style={{
              background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
              backgroundSize: '400% 400%',
              animation: 'gradientMove 15s ease infinite'
            }}>
              Start New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block relative z-10">
        <div className="max-w-4xl mx-auto bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10 min-h-screen">
          {/* Header */}
          <div className="text-white p-8 shadow-lg" style={{
            background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
            backgroundSize: '400% 400%',
            animation: 'gradientMove 15s ease infinite'
          }}>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Chats</h1>
              <button className="text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" style={{
                background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
                backgroundSize: '400% 400%',
                animation: 'gradientMove 15s ease infinite'
              }}>
                New Chat
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-8 border-b border-white/10">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg text-white placeholder-white/60 backdrop-blur-sm"
            />
          </div>

          {/* Chat List Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  data-chat-id={chat.id}
                  onClick={() => handleChatClick(chat.id, chat.name)}
                  className="p-6 border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer transition-all duration-200 hover:shadow-xl bg-black/10 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
                      {chat.avatar}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white truncate">
                          {chat.name}
                        </h3>
                        <span className="text-sm text-white/60 ml-4 flex-shrink-0">{chat.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-base text-white/80 truncate">
                          {chat.lastMessage}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center ml-4 flex-shrink-0 shadow-lg">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
