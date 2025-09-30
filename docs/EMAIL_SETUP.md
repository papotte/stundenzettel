## Email setup (Resend) – API route based

This project now sends emails through Next.js API routes using the official Resend SDK. The frontend calls our own endpoints, and those endpoints send the email with Resend on the server side.

### Overview

- Frontend service: `src/services/email-notification-service.ts`
  - `sendTeamInvitationEmail(invitation, teamName, inviterName)` → POST `/api/emails/team-invitation`
  - `sendPasswordChangeNotification(email, displayName?)` → POST `/api/emails/password-changed`
- API routes: handled in Next.js
  - `src/app/api/emails/team-invitation/route.ts`
  - `src/app/api/emails/password-changed/route.ts`
- Resend SDK runs server-side inside the API route. No client SDK calls.

### Environment variables

Set the Resend key on the server environment:

```bash
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Also configure the public app URL used to build invitation links:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:9002   # dev
# NEXT_PUBLIC_APP_URL=https://your-domain.com   # prod
```

Add these to `.env.local` for local development and to your hosting provider’s environment for production. Do not use `NEXT_PUBLIC_RESEND_API_KEY` anymore; the API routes only read the server-side `RESEND_API_KEY`.

### Sender and subjects

- Default sender: `TimeWise Tracker <noreply@papotte.dev>`
- Team invitation subject (default): `Invitation to join team "{teamName}"`
- Password changed subject: `Your password was changed`

You can override `from` and `subject` by passing them in the POST body (team invitation route supports `subject`; both routes support `from`).

### Templates

- Team invitation email uses a React template: `src/components/emails/team-invitation-email.tsx`.
- Password changed email uses simple inline HTML in `src/app/api/emails/password-changed/route.ts`.

To customize:

- Edit the React component for the invitation email.
- Adjust the inline HTML or switch it to a React component similarly to the invitation.

### How it works

The frontend calls the service functions which POST JSON to our API routes. The API routes:

1. Validate required fields.
2. Read `RESEND_API_KEY` (or `NEXT_PUBLIC_RESEND_API_KEY` fallback).
3. Instantiate `Resend` and call `resend.emails.send(...)`.
4. Return either `{ data }` on success or `{ message | name | type }` with 4xx/5xx on failure.

### Local testing

1. Add `.env.local` with the variables above.
2. Start the app: `npm run dev`.
3. Trigger emails from the UI (e.g., invite a team member or change password).
4. Inspect responses in the browser DevTools Network tab; also see logs in your terminal.

### Production setup

1. Set `RESEND_API_KEY` in your hosting provider (Vercel/Netlify/etc.).
2. Set `NEXT_PUBLIC_APP_URL` to your public site URL.
3. Verify your domain in Resend and ensure the `from` address uses a verified domain.

### Troubleshooting

- Missing key: API responds with `RESEND_API_KEY is not configured` (500). Ensure the key is set.
- Missing fields: API responds with `Missing required fields` (400).
- Resend errors: API responds with Resend error payload (typically 400). Frontend surfaces the `message | name | type` in thrown errors.

### Security notes

- Prefer `RESEND_API_KEY` on the server. Avoid exposing keys; the API route runs server-side.
- Keep domains verified in Resend and limit the sender to your domain.

### Files to review/edit

- `src/services/email-notification-service.ts` – client-side helpers to call the API routes
- `src/app/api/emails/team-invitation/route.ts` – sends the invitation with React template
- `src/app/api/emails/password-changed/route.ts` – sends the password-changed confirmation
- `src/components/emails/team-invitation-email.tsx` – invitation template markup

This document reflects the current API-route based setup and replaces the previous Firebase Functions-based approach.
