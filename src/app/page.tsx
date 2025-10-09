'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push('/chatlist');
    } else {
      router.push('/test-chat');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
        background: '#fff2cf'
    }}>
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}