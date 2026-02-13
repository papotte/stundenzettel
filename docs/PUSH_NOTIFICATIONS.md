# Sending push notifications to a user

## How it works

1. **Subscribe** – The user enables notifications in Preferences. The browser creates a **push subscription** (endpoint + keys). Your app sends that to the server and must **store it per user** (e.g. in Firestore).
2. **Send** – When you want to notify a user (e.g. team invite, reminder), you load **that user’s subscription** from the DB and call the Web Push API with the payload. The push service delivers to the user’s browser; the **service worker** (`public/sw.js`) receives a `push` event and calls `showNotification()`.

## Current limitation

`src/app/actions/push-notifications.ts` keeps **one subscription in memory**. That means:

- Only the last user who subscribed can receive notifications.
- After a server restart (or in serverless, another instance), the subscription is gone.

To send to **a specific user**, you need to **persist subscriptions by `userId`** (e.g. Firestore) and pass the right subscription when sending.

## Payload format

The service worker expects the push payload to be JSON with:

| Field   | Description                      | Example                      |
| ------- | -------------------------------- | ---------------------------- |
| `title` | Notification title               | `"TimeWise Tracker"`         |
| `body`  | Notification body text           | `"You were added to Team X"` |
| `icon`  | Icon URL (optional)              | `"/apple-touch-icon.png"`    |
| `url`   | Path to open on click (optional) | `"/team/abc"`                |

The server sends this as a **string** (e.g. `JSON.stringify({ title, body, icon, url })`) to `webpush.sendNotification(subscription, payload)`.

## Where to send from

You can trigger a push from:

- **Server Action** – e.g. after creating a team invite, call a helper that loads the invitee’s subscription and sends.
- **API route** – e.g. `POST /api/notify` that validates auth and sends to the current user or a target user.
- **Firebase Cloud Function** – e.g. Firestore trigger or callable function that loads the user’s subscription from Firestore and uses `web-push` to send.

Use the same **VAPID keys** (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) and the same **payload shape** so the existing service worker can show the notification.

## Example: persist by user and send

1. **Store subscription on subscribe**  
   In `subscribeUser`, receive `userId` (from the client, from the session). Write to Firestore, e.g.:
   - Collection: `pushSubscriptions` (or a subcollection under `users/{userId}`).
   - Document id: e.g. by `userId` or by subscription `endpoint` (so one doc per device).
   - Fields: `userId`, `subscription` (the full `PushSubscriptionJSON`), `updatedAt`.

2. **Remove on unsubscribe**  
   In `unsubscribeUser`, delete the document for that user (or that endpoint).

3. **Send to a user**  
   Create a helper (e.g. in the same file or in a Cloud Function):
   - Input: `userId`, `title`, `body`, optional `url`.
   - Load subscription(s) for that user from Firestore.
   - For each subscription, call `webpush.sendNotification(subscription, JSON.stringify({ title, body, icon: '/apple-touch-icon.png', url: url ?? '/' }))`.
   - Optionally catch `410 Gone` / `404` and remove that subscription from the DB (browser unsubscribed).

4. **Call the helper** from your Server Action, API route, or Cloud Function when the event happens (e.g. “user X was invited to a team” → send to X with `body: "You were invited to Team Y"`, `url: "/team/invitation/..."`).

## VAPID keys: where to set them

Your app uses **two env vars** for Web Push:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – public key (exposed to the client for `pushManager.subscribe()`).
- `VAPID_PRIVATE_KEY` – private key (server-only; used by `web-push` to send).

Firebase doesn’t have a dedicated “VAPID keys” screen for this. You **generate the pair yourself** and **store them as environment variables** in the right place for each environment.

### 1. Generate a key pair

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy the two lines (public and private) into your env config.

### 2. Local development

In the project root, create or edit **`.env.local`** (gitignored):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart the Next.js dev server after changing env vars.

### 3. Production (Firebase App Hosting)

Set the same two variables for your App Hosting app:

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **App Hosting** (or **Build and deploy** if the UI differs).
3. Open your **app** (e.g. the Next.js app).
4. Find **Environment** / **Environment variables** (or **Secrets**).
5. Add:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = your public key (non-secret).
   - `VAPID_PRIVATE_KEY` = your private key (mark as **secret** if the UI offers it).

Redeploy the app so the new env is picked up.

### 4. Firebase Cloud Messaging “Web Push certificates”

Under **Project settings → Cloud Messaging → Web configuration → Web Push certificates** you can **Generate key pair**. That is for sending via **Firebase Cloud Messaging (FCM)**. If you send with the **`web-push`** library (like in `push-notifications.ts`), you need the **private key** in your own env; FCM’s generated pair is meant for the FCM API, and the private key may not be exportable. So for this app, generating keys with `web-push generate-vapid-keys` and setting them in env (locally and in App Hosting) is the right approach.

## References

- Server actions: `src/app/actions/push-notifications.ts`
- Service worker (push + click): `public/sw.js`
- Client subscribe/unsubscribe: `src/components/push-notification-manager.tsx`
- Web Push (web-push): [npm web-push](https://www.npmjs.com/package/web-push), [VAPID](https://vapidkeys.com/)
