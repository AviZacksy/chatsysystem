'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateChatSession } from '../../lib/firestore';

export default function DemoPage() {
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateChat = async () => {
    try {
      setLoading(true);
      // In real app, you would call your PHP API here
      // const phpIntegration = new PHPIntegration('https://your-php-backend.com');
      // const session = await phpIntegration.createChatSession('user_123', 'astrologer_456');
      
      // For demo, we'll simulate a PHP unique ID
      const simulatedPHPUniqueId = 'php_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setUniqueId(simulatedPHPUniqueId);
      alert(`PHP Unique ID: ${simulatedPHPUniqueId}\n\nIn real app, this would come from your PHP backend!`);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChat = async () => {
    if (!uniqueId.trim()) {
      alert('Please enter a unique ID');
      return;
    }

    try {
      setLoading(true);
      // In real app, you would first check with PHP backend
      // const phpIntegration = new PHPIntegration('https://your-php-backend.com');
      // const phpSession = await phpIntegration.getChatSession(uniqueId);
      
      // Then create or get Firebase session
      const session = await getOrCreateChatSession(
        uniqueId, 
        'user_123', // This would come from PHP
        'astrologer_456' // This would come from PHP
      );
      
      if (session) {
        router.push(`/chatbox?id=${session.id}&name=Astrologer&uniqueId=${uniqueId}`);
      } else {
        alert('Chat session not found');
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      alert('Failed to join chat');
    } finally {
      setLoading(false);
    }
  };

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
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-black/20 backdrop-blur-sm shadow-2xl border border-white/10 rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔮</div>
            <h1 className="text-2xl font-bold text-white mb-2">Firebase Chat Demo</h1>
            <p className="text-white/60">Test the unique ID system</p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleCreateChat}
              disabled={loading}
              className="w-full text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
                backgroundSize: '400% 400%',
                animation: 'gradientMove 15s ease infinite'
              }}
            >
              {loading ? 'Creating...' : 'Create New Chat Session'}
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Enter Unique ID to Join Chat:
                </label>
                <input
                  type="text"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  placeholder="Paste unique ID here..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/60 backdrop-blur-sm"
                />
              </div>
              
              <button
                onClick={handleJoinChat}
                disabled={loading || !uniqueId.trim()}
                className="w-full text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #0b0c1a, #162534, #1d1238, #5c3f2f, #051321ff, #040620ff, #8c5c3f)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientMove 15s ease infinite'
                }}
              >
                {loading ? 'Joining...' : 'Join Chat Session'}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/chatlist')}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                ← Back to Chat List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
