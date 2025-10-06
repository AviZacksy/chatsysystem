import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    if (req.method === 'GET') return res.status(200).json({ ok: true, route: '/api/php/login' });
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }
  try {
    const { email, password, role, apiBaseUrl } = req.body || {};
    if (!email || !password || !role) {
      return res.status(400).json({ status: 'error', message: 'Missing credentials' });
    }

    const baseFromEnv = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
    const base = String(apiBaseUrl || baseFromEnv || '').replace(/\/$/, '');
    if (!base) {
      return res.status(500).json({ status: 'error', message: 'PHP API base URL not configured' });
    }

    const url = `${base}/login_api.php`;

    const phpRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const text = await phpRes.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { data = { status: 'error', message: 'Invalid JSON from PHP', raw: text }; }

    return res.status(phpRes.ok ? 200 : phpRes.status || 500).json(data);
  } catch (err: unknown) {
    return res.status(500).json({ status: 'error', message: (err as Error)?.message || 'Proxy error' });
  }
}
