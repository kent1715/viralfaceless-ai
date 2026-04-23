# Task 2: i18n Integration — Header, Page, Sidebar

## Summary

Successfully integrated the `useI18n()` hook into the three main layout components and fixed a pre-existing lint error in the i18n provider.

### Files Modified

1. **`src/components/viralfaceless/Header.tsx`**
   - Added imports: `useI18n`, `Language` from `@/lib/i18n`, `Globe` from `lucide-react`
   - Converted `viewLabels` record to `viewLabelKeys` record mapping `ViewName` → i18n keys
   - Replaced all 17 hardcoded text strings with `t()` calls:
     - Page title dynamically resolved via `t(viewLabelKeys[currentView])`
     - Dropdown menu items: Dashboard, Buy Credits, Admin Panel, Sign out
     - User name fallback: `t('nav.user')`
     - Plan badge: `t('header.plan')`
   - **Added Globe language switcher dropdown** before the user avatar:
     - Button with Globe icon + language code label (EN/ID)
     - DropdownMenu with English 🇬🇧 and Bahasa Indonesia 🇮🇩 options
     - Active language highlighted with `bg-accent`

2. **`src/app/page.tsx`**
   - Imported `I18nProvider` and `useI18n` from `@/lib/i18n`
   - Extracted `AppContent()` inner component to use `useI18n()` hook
   - Wrapped entire app in `<I18nProvider>` in `Home()` export
   - Replaced 4 footer hardcoded strings with `t()` calls:
     - `t('footer.copyright')`, `t('footer.terms')`, `t('footer.privacy')`, `t('footer.support')`
   - Replaced loading screen text with `t('common.loading')`

3. **`src/components/viralfaceless/AppSidebar.tsx`**
   - Added import: `useI18n` from `@/lib/i18n`
   - Changed `NavItem.label` field to `NavItem.labelKey` (stores i18n key instead of string)
   - Updated all 11 nav item definitions with i18n keys
   - Added `useI18n()` hook to `NavButton`, `SidebarContent`, and `AppSidebar` components
   - Replaced all rendered text with `t()` calls:
     - Nav labels via `t(item.labelKey)` in NavButton
     - Brand name: `t('brand.name')`
     - Admin section: `t('nav.adminSection')`
     - Credits label: `t('nav.credits')`
     - User fallback: `t('nav.user')`
     - Sign out tooltip: `t('nav.signOut')`
     - Navigation sheet title: `t('nav.navigation')`

4. **`src/lib/i18n.tsx`** (pre-existing lint fix)
   - Replaced `useState('en')` + `useEffect` localStorage loading with lazy `useState` initializer
   - Removed unused `useEffect` import
   - Fixes `react-hooks/set-state-in-effect` lint error

### Lint Status
All files pass ESLint with zero errors.
