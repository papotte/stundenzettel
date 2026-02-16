# React Query Migration – Potential Issues & Verification

This document lists critical code changes (vs `origin/main`) that could lead to runtime or data errors, with ways to **rule them out** and **how to test** each area.

---

## 1. QueryProvider / React Query not available

**Change:** Root layout wraps the app with `<QueryProvider>` (outside `AuthProvider`). All `useQuery`/`useMutation` depend on it.

**Risk:** If the provider is missing, misconfigured, or tree order is wrong, queries/mutations throw or hang.

**How to discard:**

- Confirm `QueryProvider` is in `src/app/layout.tsx` and wraps `AuthProvider` (and thus all app routes).
- Confirm `src/components/providers/query-provider.tsx` creates a `QueryClient` and `QueryClientProvider` with sensible defaults (e.g. `retry: false` in tests if needed).

**How to test:**

- Open any page that uses React Query (e.g. `/team`, `/company`, `/tracker`, `/subscription`). No console errors about “useQueryClient” or “QueryClientProvider”.
- Run full test suite; Jest setup already wraps with `QueryProvider` in `jest.setup.tsx`.

---

## 2. Subscription context: stale or wrong data after invalidation

**Change:** Subscription state is driven by `useQuery`; `invalidateSubscription()` only calls `queryClient.invalidateQueries` (and `subscriptionService.clearCache()`). No more manual refetch or state reset.

**Risk:** After checkout/portal/cancel, cache might not refetch in time; UI could show old subscription status. Or `enabled: Boolean(user?.uid)` could leave subscription “loading” or stale when `user` is set late.

**How to discard:**

- After “Manage billing” or team checkout success, the code that performs the redirect also invalidates subscription (e.g. team dialog: `queryKeys.subscription(variables.uidForInvalidation)`). When the user lands back on the app, the subscription query should refetch because it was invalidated.
- Ensure no code path calls `invalidateSubscription()` without the corresponding query key being invalidated.

**How to test:**

- **Manual:** Complete a team checkout (or open customer portal and return). On redirect back to `/team?success=true`, subscription section should show the updated subscription (e.g. active, new plan) after a short load. Repeat after canceling subscription (if testable).
- **Unit:** `subscription-context.test.tsx` – confirm that when the mock `getUserSubscription` is updated and the query is invalidated/refetched, the context exposes the new data.

---

## 3. Time tracker: stale entries after add/update/delete

**Change:** Entries come from `useQuery`; add/update/delete call `invalidateTimeTracker()` instead of updating local state.

**Risk:** If invalidation is slow or fails, the list can show stale data (e.g. deleted entry still visible, or new entry missing) until the next refetch.

**How to discard:**

- After every mutation that changes entries (`handleSaveEntry`, `handleDeleteEntry`, `handleClearData`, `handleAddSpecialEntry`), `invalidateTimeTracker()` is called. That invalidates `queryKeys.timeTrackerData(user.uid)`, so React Query refetches.
- Ensure no mutation path skips `invalidateTimeTracker()`.

**How to test:**

- **Manual:** On tracker page: add entry, edit entry, delete entry, clear all, add special entry. After each action, the list should update (possibly after a brief loading or refetch). No duplicate or ghost entries.
- **Unit:** `use-time-tracker.test.ts` – mutations are mocked; after mutation success, assert that `invalidateQueries` (or the equivalent refetch) is called for `timeTrackerData`.

---

## 4. Company / Preferences: tracker or export stale after saving settings

**Change:** Company and preferences use `useUserSettings` and `saveUserSettings`; on save they call `invalidate()` from the hook, which invalidates `userSettings`, `timeTrackerData`, and `exportPreviewData`.

**Risk:** If `invalidate()` is not awaited or runs before the backend has persisted, tracker or export could refetch and still see old settings (e.g. company name, work hours).

**How to discard:**

- `saveUserSettings` is `await`ed before `invalidate()` in both pages. So save completes first, then cache is invalidated and consumers refetch.
- Confirm `useUserSettings`’s `invalidate()` invalidates `queryKeys.timeTrackerData(uid)` and `queryKeys.exportPreviewData(uid)`.

**How to test:**

- **Manual (company):** Change company name (or other field) on company page, save. Open tracker and/or export; they should show the new company/settings (e.g. in export header or compensation).
- **Manual (preferences):** Change default work hours, save. Open tracker; new entries or compensation should use the new hours.
- **E2E:** Existing company/preferences E2E tests should pass (they already cover save and navigation).

---

## 5. Customer portal / Stripe: user has no email

**Change:** `createCustomerPortalSession` is called with `user!.email ?? user!.uid` (subscription page, team subscription card). Backend uses that value as `email` in `stripe.customers.list({ email })`.

**Risk:** If the user has no `email` (e.g. anonymous or custom auth), the value is `user.uid`. Stripe customer lookup by “email” would then use a non-email string; if Stripe customers are created only by email, lookup can fail and “Customer not found” can occur.

**How to discard:**

- Confirm in your auth flows that paying users always have `email` set (e.g. no anonymous checkout).
- If some users can have null email, consider guarding “Manage billing” (e.g. disable or show a message when `!user?.email`).

**How to test:**

- **Manual:** Log in with an account that has an email; open subscription page or team subscription card; click “Manage billing”. Should redirect to Stripe portal, not “Customer not found”.
- **Edge case:** If you have a test user without email, try the same flow and confirm you get a clear error (and no crash).

---

## 6. Team checkout: same email/ID risk

**Change:** Team subscription dialog passes `user.email ?? user.uid` as the first argument to `createTeamCheckoutSession` (“userId” in API/Stripe is used as customer identifier; Stripe team-checkout uses `userEmail ?? userId` for customer lookup).

**Risk:** Same as §5: if `user.email` is null, Stripe receives uid and may not find a customer.

**How to discard and test:** Same as §5, but from team page → Create/link subscription → choose plan → Subscribe. Flow should create or find Stripe customer and redirect to checkout.

---

## 7. Team page: real-time subscription listener and cache key

**Change:** Team page uses `useQuery` for `teamPageData`. Real-time listener `onTeamSubscriptionChange(team.id, callback)` updates the cache via `queryClient.setQueryData(queryKeys.teamPageData(user.uid), ...)`.

**Risk:** If `user.uid` is stale in the effect (e.g. user switched accounts), the listener could write to the wrong query key. Or if the effect runs with an old `team.id`, the listener might not match the current team.

**How to discard:**

- Effect deps are `[team?.id, user?.uid, queryClient]`. So when user or team changes, the effect re-runs and the previous listener is cleaned up (`return () => unsubscribe()`). Only the current user’s team data should be updated.

**How to test:**

- **Manual:** On team page with an active subscription, have another tab or process update the subscription (e.g. cancel or change plan in Stripe). Team page should update without a full reload (listener updates the cache).
- **Unit:** If you have tests that mock `onTeamSubscriptionChange`, assert that `setQueryData` is called with the correct `queryKeys.teamPageData(uid)` and updated subscription.

---

## 8. Team page: tab selection with queueMicrotask

**Change:** When URL has `?success=true`, `?cancelled=true`, or `?tab=subscription`, tab is set with `queueMicrotask(() => setSelectedTab('subscription'))`.

**Risk:** In tests or strict mode, this can cause “setState during render” or act warnings. Or double render could briefly show the wrong tab.

**How to discard:**

- `queueMicrotask` defers the state update so it’s not during render. If you see act warnings in tests, consider wrapping the microtask or the tab update in `flushSync`/`act` only where needed, or keep the microtask and suppress the warning if it’s a known false positive.

**How to test:**

- **Manual:** Go to `/team?tab=subscription` or `/team?success=true`. Subscription tab should be selected.
- **Unit:** Team page tests that assert tab or URL params; no unhandled act warnings.

---

## 9. Export preview: published month loading state

**Change:** `publishedAt` is derived from a separate `useQuery` for `publishedMonth`. Logic: `publishedAt = publishedData?.publishedAt ?? (userTeam && monthKey ? null : undefined)`.

**Risk:** When `userTeam && monthKey` but query is still loading, `publishedAt` is `null`. If the UI treats `null` and `undefined` differently (e.g. “not published” vs “loading”), you could show “Not published” instead of a loading state.

**How to discard:**

- Check export preview UI: when `publishedData` is loading and month is selected, does it show a loader or “Not published”? If the design expects “loading” for that case, use `isLoading` from the published-month query to show a skeleton or spinner instead of “Not published”.

**How to test:**

- **Manual:** Open export, pick a month. Briefly you may see loading or “Not published”; after load, correct published state. No flicker from undefined → null → value unless intended.

---

## 10. saveUserSettings: merge and concurrency

**Change:** `saveUserSettings(userId, settings)` does `current = await getUserSettings(userId)` then `setUserSettings(userId, { ...current, ...settings })`.

**Risk:** If two saves run in parallel (e.g. two tabs or double submit), both read the same `current`, then both write; the second write can overwrite the first. Or if `getUserSettings` fails between load and save, the merge is wrong or save fails.

**How to discard:**

- UI should prevent double submit (e.g. disable submit while `isSaving`). No other code path should call `saveUserSettings` in parallel for the same user without coordination.
- If `getUserSettings` throws, `saveUserSettings` throws and the caller (company/preferences) shows an error toast; no partial write.

**How to test:**

- **Manual:** Save company or preferences once; confirm data persists. Try rapid double-click on save; second request may overwrite first but should not crash; ideally button is disabled after first click.
- **Unit:** Preferences/company tests mock `getUserSettings`/`setUserSettings`; assert that save is called with merged object (current + form data).

---

## 11. getPricingPlans no longer cached in memory

**Change:** `getPricingPlans()` no longer uses an in-memory cache; it always calls `StripeService.getPricingPlans()`. Caching is done by `usePricingPlans()` (React Query).

**Risk:** Any code that calls `getPricingPlans()` directly (instead of `usePricingPlans()`) will hit the API every time. That could cause extra load or rate limits if called often.

**How to discard:**

- Grep for `getPricingPlans()`: only used by `usePricingPlans` hook (and tests). No other callers that run on every render or in a hot path.

**How to test:**

- **Unit:** `payment-service.test.ts` – getPricingPlans returns plans and does not cache (each call hits the mock). No other production code path should depend on in-memory caching of getPricingPlans.

---

## 12. Jest: defaultMockSubscriptionContext type

**Change:** In `jest.setup.tsx`, `defaultMockSubscriptionContext` is explicitly typed so `subscription` is `Subscription | null`.

**Risk:** Tests that assign `defaultMockSubscriptionContext.subscription = mockSubscription` rely on that type. If the type is removed or changed, TypeScript or tests could break.

**How to discard:**

- Keep the type in jest.setup; ensure all tests that mutate the mock use valid `Subscription` objects or `null`.

**How to test:**

- Run tests that use `defaultMockSubscriptionContext` (e.g. link-team-subscription-dialog, team-subscription-card, subscription-guard). All should pass.

---

## Quick checklist (manual smoke test)

- [ ] Log in, open **Tracker** – entries load; add/edit/delete entry – list updates.
- [ ] Open **Company** – form loads; save – success toast; open **Tracker** or **Export** – new company data visible.
- [ ] Open **Preferences** – form loads; save – success toast; open **Tracker** – new defaults used.
- [ ] Open **Subscription** – click “Manage billing” – redirects to Stripe portal (or clear error if no customer).
- [ ] Open **Team** – data loads; open **Create subscription** dialog – plans load; complete checkout (or cancel) – redirect and subscription state correct.
- [ ] **Team** tab: switch to Subscription tab via URL `?tab=subscription` – correct tab selected.
- [ ] **Export** – select month – published state loads; no wrong “Not published” while loading.

---

## Summary table

| Area             | Main risk                        | Discard by                                | Test                                 |
| ---------------- | -------------------------------- | ----------------------------------------- | ------------------------------------ |
| QueryProvider    | Queries/mutations fail or hang   | Layout and provider code review           | Open app; run tests                  |
| Subscription ctx | Stale after portal/checkout      | Invalidation after redirect               | Manual portal/checkout return        |
| Time tracker     | Stale entries after mutation     | invalidateTimeTracker() on every mutation | Manual add/edit/delete; unit tests   |
| Company/Prefs    | Tracker/export stale after save  | invalidate() after saveUserSettings       | Manual save then open tracker/export |
| Customer portal  | “Customer not found” if no email | Only allow billing when user has email    | Manual with and without email        |
| Team checkout    | Same as portal                   | Same                                      | Subscribe from team dialog           |
| Team real-time   | Wrong cache updated              | Effect deps and cleanup                   | Manual subscription change; unit     |
| Team tab         | Act warnings or wrong tab        | queueMicrotask usage                      | URL with ?tab=subscription           |
| Export published | “Not published” while loading    | Use isLoading for published query         | Manual month selection               |
| saveUserSettings | Overwrite or race                | Single submit; error handling             | Manual double-save; unit merge       |
| getPricingPlans  | Extra API calls                  | No direct callers except hook             | Grep; unit                           |
| Jest mock type   | Test or type errors              | Keep Subscription \| null type            | Run affected tests                   |
