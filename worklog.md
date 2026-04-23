---
Task ID: 1
Agent: Main
Task: Fix all bugs from previous session, deploy to EC2, verify production

Work Log:
- Resolved git merge conflicts (all files were in broken merge state)
- Fixed CRITICAL bug: `creditsRemaining` → `remainingCredits` field name mismatch in all 4 AI API routes
- Fixed: `role: 'assistant'` → `role: 'system'` in all AI API routes
- Replaced TTS: z-ai-web-dev-sdk → Python edge-tts (8 voices: gadis, ardi, jenny, guy, aria, davis, sonia, ryan)
- Updated TTSVoice type and TTS_VOICES constants
- Added voice preview functionality (generates real TTS sample)
- Added fetch timeout (120s AI, 60s TTS, 30s auth) with AbortController
- Fixed sidebar: dynamic margin-left based on sidebarOpen state
- Created Dockerfile with Python3 + edge-tts for production
- Created entrypoint.sh for DB seed on first run
- Pushed to GitHub: kent1715/viralfaceless-ai
- Deployed to EC2 via SSH (Docker build + run)
- Fixed multiple Docker issues: bunx→npx, missing prisma dependencies, volume mount permissions
- Created AI proxy endpoint (/api/ai/proxy) and ai.ts helper for production proxy support
- Investigated AI SDK connectivity: z-ai-web-dev-sdk endpoint (172.25.136.193:8080) is internal-only, unreachable from EC2
- Verified on EC2: Register ✅, Login ✅, TTS ✅, AI ❌ (network limitation)

Stage Summary:
- EC2 deployment at http://16.59.144.244:3000/ is running
- Non-AI features work perfectly (auth, credits, TTS with 8 voices)
- AI features (ideas, scripts, videos, SEO) only work in sandbox (Preview Panel) due to network isolation
- AI proxy infrastructure added for future external AI API integration
- GitHub repo: https://github.com/kent1715/viralfaceless-ai

---
Task ID: 2
Agent: Main
Task: Continue from previous session - verify Preview Panel, push to GitHub, deploy to EC2

Work Log:
- Verified all code files from previous session are correct (ideas, scripts, seo, videos API routes, TTS route, ai.ts, api.ts, constants, types)
- Confirmed `remainingCredits` field name consistency across all 4 AI routes and frontend
- Confirmed `role: 'system'` for AI system prompts
- Confirmed Python edge-tts TTS route with 8 voices
- Installed edge-tts (v7.2.8) in sandbox
- ESLint passed clean
- Started dev server persistently using setsid wrapper (port 3000 via Caddy port 81)
- Pushed unpushed commit to GitHub using new PAT
- Set GitHub Actions secrets: EC2_HOST (16.59.144.244), JWT_SECRET (generated)
- GitHub Actions deploy workflow triggered but failed: missing EC2_SSH_KEY secret
- EC2_SSH_KEY needs to be set manually in GitHub repo settings

Stage Summary:
- Preview Panel: App running, all features accessible (AI, TTS, auth)
- GitHub: Code pushed to kent1715/viralfaceless-ai, 2 of 3 secrets set
- EC2 Deploy: Blocked by missing EC2_SSH_KEY GitHub secret
- Next step: User needs to provide EC2 SSH private key or set it in GitHub repo Settings > Secrets
