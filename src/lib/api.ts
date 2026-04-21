const API_BASE = '';

// Helper function for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('vf_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res;
}

export const api = {
  // ─── Auth ────────────────────────────────────────────
  auth: {
    register: (email: string, name: string, password: string) =>
      authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, password }),
      }).then((r) => r.json()),

    login: (email: string, password: string) =>
      authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then((r) => r.json()),

    me: () => authFetch('/api/auth/me').then((r) => r.json()),
  },

  // ─── Ideas ───────────────────────────────────────────
  ideas: {
    generate: (niche: string, count?: number, makeMoreExtreme?: boolean) =>
      authFetch('/api/ideas/generate', {
        method: 'POST',
        body: JSON.stringify({ niche, count, makeMoreExtreme }),
      }).then((r) => r.json()),
  },

  // ─── Scripts ─────────────────────────────────────────
  scripts: {
    generate: (data: {
      ideaTitle: string;
      hook: string;
      contentAngle: string;
      targetEmotion: string;
      style: string;
      tone: string;
      projectId?: string;
    }) =>
      authFetch('/api/scripts/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },

  // ─── TTS ─────────────────────────────────────────────
  tts: {
    generate: (text: string, voice?: string, speed?: number) =>
      authFetch('/api/tts/generate', {
        method: 'POST',
        body: JSON.stringify({ text, voice, speed }),
      }),
  },

  // ─── Videos ──────────────────────────────────────────
  videos: {
    generate: (script: string, style?: string) =>
      authFetch('/api/videos/generate', {
        method: 'POST',
        body: JSON.stringify({ script, style }),
      }).then((r) => r.json()),
  },

  // ─── Thumbnails ──────────────────────────────────────
  thumbnails: {
    generate: (prompt: string, style?: string) =>
      authFetch('/api/thumbnails/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, style }),
      }).then((r) => r.json()),
  },

  // ─── SEO ─────────────────────────────────────────────
  seo: {
    generate: (
      title: string,
      description?: string,
      niche?: string,
      platforms?: string[]
    ) =>
      authFetch('/api/seo/generate', {
        method: 'POST',
        body: JSON.stringify({ title, description, niche, platforms }),
      }).then((r) => r.json()),
  },

  // ─── Credits ─────────────────────────────────────────
  credits: {
    balance: () =>
      authFetch('/api/credits/balance').then((r) => r.json()),
    use: (amount: number) =>
      authFetch('/api/credits/use', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }).then((r) => r.json()),
  },

  // ─── Payments ────────────────────────────────────────
  payments: {
    create: (amount: number, method: string) =>
      authFetch('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }).then((r) => r.json()),
  },

  // ─── Admin ───────────────────────────────────────────
  admin: {
    stats: () =>
      authFetch('/api/admin/stats').then((r) => r.json()),
    users: () =>
      authFetch('/api/admin/users').then((r) => r.json()),
    updateUser: (userId: string, data: Record<string, unknown>) =>
      authFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, ...data }),
      }).then((r) => r.json()),
  },

  // ─── Projects ────────────────────────────────────────
  projects: {
    list: () =>
      authFetch('/api/projects').then((r) => r.json()),
    create: (title: string, niche?: string) =>
      authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title, niche }),
      }).then((r) => r.json()),
    delete: (id: string) =>
      authFetch('/api/projects', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
  },
};
