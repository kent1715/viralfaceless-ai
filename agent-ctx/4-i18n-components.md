# Task 4: i18n Translation for IdeaEngine, ScriptGenerator, and TTSEngine

## Status: ✅ Completed

## Files Modified

### 1. `src/lib/i18n.tsx`
- Added missing translation keys to both `en` and `id` dictionaries:
  - `ideas.failed` — "Failed to generate ideas"
  - `ideas.ideaRegenerated` — "Idea regenerated!"
  - `ideas.notEnoughRegenerate` — "Not enough credits to regenerate!"
  - `ideas.needCredits` — "Need at least 2 credits for 1-Click Viral Mode!"
  - `common.credits2` — "-2 credits" / "-2 kredit"

### 2. `src/components/viralfaceless/IdeaEngine.tsx`
- Added `import { useI18n } from '@/lib/i18n'`
- Changed `import { useState, useCallback } from 'react'` → `import { useState, useCallback, useMemo } from 'react'`
- Removed static `VIRAL_STEPS` constant, replaced with `useMemo`-computed `viralSteps` inside the component using `t()` calls
- Added `const { t } = useI18n()` to `IdeaEngine` and `IdeaCard` components
- Replaced all hardcoded English text with `t()` calls:
  - Title, subtitle, labels, buttons, empty states, toast messages, dialog content
  - Interpolation handled via `.replace('{n}', value)` for dynamic values
  - `(-1 credit)` → `t('common.credit')`, `(-2 credits)` → `t('common.credits2')`
  - "View Script →" kept as-is per instructions

### 3. `src/components/viralfaceless/ScriptGenerator.tsx`
- Added `import { useI18n } from '@/lib/i18n'`
- Changed import to include `useMemo`
- Added `const { t } = useI18n()` to `ScriptGenerator`, `CopyButton`, and `ScriptSection` components
- Created `useMemo`-mapped `scriptStyles` and `scriptTones` arrays that translate labels/descriptions at render time
- Replaced all hardcoded English text with `t()` calls:
  - Title, subtitle, section labels, configuration labels, buttons
  - Toast messages, empty states, loading states
  - `(-1 credit)` → `t('common.credit')`
  - Script section titles (Hook, Main Content, Call to Action, Full Script)

### 4. `src/components/viralfaceless/TTSEngine.tsx`
- Added `import { useI18n } from '@/lib/i18n'`
- Added `const { t } = useI18n()` to `TTSEngine` and `AudioPlayer` components
- Replaced all hardcoded English text with `t()` calls:
  - Title, subtitle, labels (TTS Provider, Script Text, Select Voice, Speed Control)
  - Interpolated values: characters count, voices count
  - Slow/Fast labels, Generate Voice button, credit cost
  - Loading state with provider name interpolation
  - Toast messages for success/failure/download
  - Brand names (Microsoft Edge TTS, Google Cloud TTS) and descriptions kept as-is
  - Tooltip text kept as brand/provider info

## Key Decisions
- Used `.replace('{n}', value)` for interpolation since the `t()` function doesn't natively support it
- For double `{n}` placeholders in `ideas.generated`, chained `.replace()` calls (replaces first occurrence each time)
- VIRAL_STEPS moved inside component as `useMemo` to access `t()` for translated step labels
- Script styles/tones mapped via `useMemo` using `t(\`script.style.${value}\`)` pattern
- All logic, types, imports, and component structure preserved exactly

## Verification
- ESLint: ✅ Passed (no errors)
- Dev server: ✅ Compiled successfully
