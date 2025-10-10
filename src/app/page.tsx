'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from '../lib/auth';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have chatbox parameters in the URL
    const uniqueId = searchParams?.get('uniqueId');
    const userId = searchParams?.get('userId');
    const astrologerId = searchParams?.get('astrologerId');
    const name = searchParams?.get('name');
    
    // If we have chat parameters, redirect directly to chatbox
    if (uniqueId && (userId || astrologerId)) {
      const params = new URLSearchParams();
      if (uniqueId) params.set('uniqueId', uniqueId);
      if (userId) params.set('userId', userId);
      if (astrologerId) params.set('astrologerId', astrologerId);
      if (name) params.set('name', name);
      
      router.push(`/chatbox?${params.toString()}`);
      return;
    }

    // Otherwise, follow the normal flow
    const session = getSession();
    if (session) {
      router.push('/chatlist');
    } else {
      router.push('/test-chat');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
        background: '#fff2cf'
    }}>
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{
        background: '#fff2cf'
      }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}