'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestChatPage() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [uniqueId, setUniqueId] = useState('CHAT_123_55');
  const [userId, setUserId] = useState('123');
  const [astrologerId, setAstrologerId] = useState('55');
  const [astrologerName, setAstrologerName] = useState('Gagandeep Goyal');

  const fullUrl = useMemo(() => {
    const params = new URLSearchParams({
      uniqueId,
      userId,
      astrologerId,
      name: astrologerName
    }).toString();
    return `${baseUrl.replace(/\/$/, '')}/chatbox?${params}`;
  }, [baseUrl, uniqueId, userId, astrologerId, astrologerName]);

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, [baseUrl]);

  const openChatHere = () => {
    const params = new URLSearchParams({
      uniqueId,
      userId,
      astrologerId,
      name: astrologerName
    });
    router.push(`/chatbox?${params.toString()}`);
  };

  const openChatNewTab = () => {
    window.open(fullUrl, '_blank', 'noopener');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('URL copied!');
    } catch {
      // no-op
    }
  };

  const quickTestSession = () => {
    try {
      const session = {
        uniqueId,
        role: 'user',
        userId,
        apiBaseUrl: 'https://astrosolution-talktoastrologer.com'
      };
      localStorage.setItem('chat_auth_session_v1', JSON.stringify(session));
      alert('Test session set! Now click Open Here / Open in New Tab.');
    } catch {}
  };

  const setAstrologerSession = () => {
    try {
      const session = {
        uniqueId,
        role: 'astrologer',
        astrologerId,
        name: astrologerName,
        apiBaseUrl: 'https://astrosolution-talktoastrologer.com'
      };
      localStorage.setItem('chat_auth_session_v1', JSON.stringify(session));
      alert('Astrologer session set! Now you can access /astrologer page.');
    } catch {}
  };

  const fillExample = () => {
    setUniqueId('CHAT_123_55');
    setUserId('123');
    setAstrologerId('55');
    setAstrologerName('Gagandeep Goyal');
  };

  const isValid = uniqueId.trim() && userId.trim() && astrologerId.trim() && astrologerName.trim();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
          background: '#fff2cf'
    }}>

      <div className="bg-black/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-xl w-full border border-white/10 text-white">
        <h1 className="text-2xl font-semibold mb-2">Test Chat Deep Link</h1>
        <p className="text-white/80 mb-6 text-sm">Yahan se aap URL generate karke chat open kar sakte ho (same params PHP se pass honge).</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Base URL (Deploy)</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
            />
            <div className="flex gap-2 mt-1 text-xs">
              <button onClick={() => setBaseUrl(window.location.origin)} className="px-2 py-1 bg-white/10 rounded border border-white/20">Use this host</button>
              <button onClick={() => setBaseUrl(window.location.origin)} className="px-2 py-1 bg-white/10 rounded border border-white/20">Use Production</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Unique ID</label>
              <input
                type="text"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                placeholder="CHAT_123_55"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Astrologer ID</label>
              <input
                type="text"
                value={astrologerId}
                onChange={(e) => setAstrologerId(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                placeholder="55"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Astrologer Name</label>
              <input
                type="text"
                value={astrologerName}
                onChange={(e) => setAstrologerName(e.target.value)}
                className="w-full p-2 rounded bg-white/10 border border-white/20 outline-none"
                placeholder="Gagandeep Goyal"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fillExample}
              className="px-3 py-2 rounded bg-white/10 border border-white/20 hover:bg-white/20"
            >
              Fill Example
            </button>
            <button
              onClick={quickTestSession}
              className="px-3 py-2 rounded bg-white/10 border border-white/20 hover:bg-white/20"
            >
              Set User Session
            </button>
            <button
              onClick={setAstrologerSession}
              className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700"
            >
              Set Astrologer Session
            </button>
            <button
              onClick={copyUrl}
              className="px-3 py-2 rounded bg-white/10 border border-white/20 hover:bg-white/20"
            >
              Copy Full URL
            </button>
            <button
              onClick={openChatNewTab}
              disabled={!isValid}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Open in New Tab
            </button>
            <button
              onClick={openChatHere}
              disabled={!isValid}
              className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Open Here
            </button>
          </div>

          <div className="mt-4 p-3 rounded bg-black/30 border border-white/10">
            <div className="text-xs text-white/70 mb-1">Generated URL</div>
            <code className="text-sm break-all">{fullUrl}</code>
          </div>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => router.push('/astrologer')}
              className="text-white/60 hover:text-white transition-colors text-sm block mx-auto"
            >
              🔮 Astrologer Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
