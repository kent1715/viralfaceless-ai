const API_BASE = '';

// Timeout helper - 120s for AI endpoints, 30s for others
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 120000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Helper function for authenticated requests
async function authFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number
) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('vf_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetchWithTimeout(
    `${API_BASE}${url}`,
    { ...options, headers },
    timeoutMs
  );
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
      }, 30000).then((r) => r.json()),

    login: (email: string, password: string) =>
      authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, 30000).then((r) => r.json()),

    me: () =>
      authFetch('/api/auth/me', {}, 15000).then((r) => r.json()),
  },

  // ─── Ideas (AI - long timeout) ──────────────────────
  ideas: {
    generate: (niche: string, count?: number, makeMoreExtreme?: boolean) =>
      authFetch('/api/ideas/generate', {
        method: 'POST',
        body: JSON.stringify({ niche, count, makeMoreExtreme }),
      }, 120000).then((r) => r.json()),
  },

  // ─── Scripts (AI - long timeout) ────────────────────
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
      }, 120000).then((r) => r.json()),
  },

  // ─── TTS (no auth needed, moderate timeout) ─────────
  tts: {
    generate: (text: string, voice?: string, speed?: number) =>
      authFetch('/api/tts/generate', {
        method: 'POST',
        body: JSON.stringify({ text, voice, speed }),
      }, 60000),
  },

  // ─── Videos (AI - long timeout) ─────────────────────
  videos: {
    generate: (script: string, style?: string) =>
      authFetch('/api/videos/generate', {
        method: 'POST',
        body: JSON.stringify({ script, style }),
      }, 120000).then((r) => r.json()),
  },

  // ─── Thumbnails ──────────────────────────────────────
  thumbnails: {
    generate: (prompt: string, style?: string) =>
      authFetch('/api/thumbnails/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, style }),
      }, 120000).then((r) => r.json()),
  },

  // ─── SEO (AI - long timeout) ────────────────────────
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
      }, 120000).then((r) => r.json()),
  },

  // ─── Credits ─────────────────────────────────────────
  credits: {
    balance: () =>
      authFetch('/api/credits/balance', {}, 15000).then((r) => r.json()),
    use: (amount: number) =>
      authFetch('/api/credits/use', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }, 15000).then((r) => r.json()),
  },

  // ─── Payments ────────────────────────────────────────
  payments: {
    create: (amount: number, method: string) =>
      authFetch('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }, 30000).then((r) => r.json()),
  },

  // ─── Admin ───────────────────────────────────────────
  admin: {
    stats: () =>
      authFetch('/api/admin/stats', {}, 15000).then((r) => r.json()),
    users: () =>
      authFetch('/api/admin/users', {}, 15000).then((r) => r.json()),
    updateUser: (userId: string, data: Record<string, unknown>) =>
      authFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, ...data }),
      }, 15000).then((r) => r.json()),
  },

  // ─── Projects ────────────────────────────────────────
  projects: {
    list: () =>
      authFetch('/api/projects', {}, 15000).then((r) => r.json()),
    create: (title: string, niche?: string) =>
      authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title, niche }),
      }, 15000).then((r) => r.json()),
    delete: (id: string) =>
      authFetch('/api/projects', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }, 15000).then((r) => r.json()),
  },
};
