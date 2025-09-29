# Email Configuration with Resend

This document explains how to configure Resend for sending transactional emails in the TimeWise Tracker application.

## Architecture Overview

The email system uses the **official Resend library** for type safety and better error handling:

1. **Frontend**: Calls `sendTeamInvitationEmail` from the email service
2. **Email Service**: Uses the Resend library to send emails with proper TypeScript support
3. **Resend API**: Sends actual emails with professional templates
4. **Result**: Success/failure is returned immediately to the frontend

This architecture provides **immediate feedback**, **type safety**, and **simplified error handling** with the official Resend SDK.

## Environment Variables Setup

### 1. Resend API Key

You need to add the Resend API key as an environment variable for the frontend application.

#### For Development (Local Environment)

Create or update `.env.local` in the root directory:

```bash
# Add this to .env.local
NEXT_PUBLIC_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### For Production (Vercel/Hosting Platform)

Set the environment variable in your hosting platform:

1. **Vercel**: Go to Project Settings → Environment Variables
2. **Netlify**: Go to Site Settings → Environment Variables  
3. **Firebase Hosting**: Configure in firebase.json or hosting configuration

Add:
- **Variable Name**: `NEXT_PUBLIC_RESEND_API_KEY`
- **Value**: Your Resend API key (starts with `re_`)

### 2. Email From Address

The current implementation uses `noreply@papotte.dev` as the sender email. You need to:

1. **Verify your domain in Resend**:
   - Go to Resend Dashboard → Domains
   - Add your domain (e.g., `papotte.dev`)
   - Follow DNS verification steps

2. **Update the sender email** (if needed):
   - The sender is currently set to `TimeWise Tracker <noreply@papotte.dev>`
   - You can modify this in `src/services/email-notification-service.firestore.ts`

### 3. App URL Configuration

Make sure `NEXT_PUBLIC_APP_URL` is set correctly:

#### Development
```bash
# In .env.local
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

#### Production
```bash
# In .env.local or hosting platform environment variables
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Getting Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to Dashboard → API Keys
3. Create a new API key with "Sending access"
4. Copy the key (it starts with `re_`)

## Testing the Integration

### Local Testing

1. Set up environment variables in `.env.local`
2. Start development server: `npm run dev`
3. Create a team invitation through the UI
4. **Check the UI for success/error messages** - you'll get immediate feedback
5. Check browser console for detailed logs

### Production Testing

1. Deploy your application with environment variables configured
2. Create a team invitation through the production UI
3. **Immediate feedback** will show in the UI whether email was sent successfully
4. Check Resend Dashboard → Logs for delivery confirmation

## Email Template Customization

The email template is defined in `src/services/email-notification-service.firestore.ts`. You can customize:

- **HTML template**: Modify the `emailHtml` variable for rich formatting
- **Text template**: Modify the `emailText` variable for plain text fallback
- **Subject line**: Modify the `emailSubject` variable
- **Sender name**: Modify the `from` field in the `resend.emails.send()` call

## User Experience Improvements

With the Resend library architecture, users get **immediate feedback**:

- ✅ **Success**: "Invitation sent successfully" with confirmation
- ❌ **Error**: Specific error message from Resend (e.g., "Invalid API key", "Domain not verified")
- 🔄 **Loading**: Loading state while email is being sent
- 📧 **Real emails**: Actual emails sent through Resend's infrastructure
- 🛡️ **Type Safety**: Full TypeScript support with the official Resend library

The invitation is still created in the database even if email fails, but users are clearly informed about the email status.

## Troubleshooting

### Common Issues

1. **"NEXT_PUBLIC_RESEND_API_KEY environment variable is not set"**
   - Make sure you've set the environment variable in `.env.local` or your hosting platform
   - Restart your development server after adding environment variables

2. **Domain verification errors**
   - Verify your domain in Resend Dashboard
   - Update the `from` email address to use your verified domain

3. **Rate limiting**
   - Resend has rate limits on the free plan
   - Consider upgrading if you're sending many invitations

4. **CORS errors** (should not occur with Resend library approach)
   - The Resend library handles API communication internally
   - No CORS issues since it's designed for frontend use

### Monitoring

- **Frontend feedback**: Users see immediate success/failure messages
- **Browser console**: Check for detailed API call logs
- **Resend Dashboard → Logs**: Monitor delivery status and bounces
- **Network tab**: Inspect actual API calls to Resend

## Security Notes

- API key is exposed to the frontend (hence the `NEXT_PUBLIC_` prefix)
- Resend API keys can be restricted by domain for security
- Consider rate limiting on your application side
- Monitor usage to prevent abuse
- The API key should be restricted to sending only

## Cost Considerations

- Resend free plan: 3,000 emails/month
- No Firebase Functions costs
- Direct API calls are more cost-effective
- Check pricing at [resend.com/pricing](https://resend.com/pricing)
- Monitor usage in Resend Dashboard

## Migration Notes

If upgrading from the Firebase Functions approach:
- Email sending now provides immediate feedback to users
- No need to deploy Firebase Functions
- Simpler architecture and deployment
- Environment variable changed from `RESEND_API_KEY` to `NEXT_PUBLIC_RESEND_API_KEY`
- No changes needed to the frontend invitation flow

Alternatively, you can use the Firebase Console:

1. Go to Firebase Console → Functions → Environment Variables
2. Add a new secret named `NEXT_PUBLIC_RESEND_API_KEY`
3. Set the value to your Resend API key

### 2. Email From Address

The current implementation uses `noreply@papotte.dev` as the sender email. You need to:

1. **Verify your domain in Resend**:
   - Go to Resend Dashboard → Domains
   - Add your domain (e.g., `papotte.dev`)
   - Follow DNS verification steps

2. **Update the sender email** (if needed):
   - The sender is currently set to `TimeWise Tracker <noreply@papotte.dev>`
   - You can modify this in `functions/src/index.ts` line ~87

### 3. App URL Configuration

Make sure `NEXT_PUBLIC_APP_URL` is set correctly:

#### Development

```bash
# In .env.local
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

#### Production

```bash
# In .env.local or Firebase hosting config
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Getting Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to Dashboard → API Keys
3. Create a new API key with "Sending access"
4. Copy the key (it starts with `re_`)

## Testing the Integration

### Local Testing

1. Set up environment variables in `.env.local`
2. Start Firebase emulators: `npm run emulators:start`
3. Create a team invitation through the UI
4. Check the Functions logs for email sending confirmation

### Production Testing

1. Deploy functions: `npm run functions:deploy`
2. Create a team invitation through the production UI
3. Check Firebase Functions logs in the Firebase Console

## Email Template Customization

The email template is defined in `functions/src/index.ts` around line 80-110. You can customize:

- **HTML template**: Modify the `emailHtml` variable for rich formatting
- **Text template**: Modify the `emailText` variable for plain text fallback
- **Subject line**: Modify the `emailSubject` variable
- **Sender name**: Modify the `from` field in the Resend configuration

## Troubleshooting

### Common Issues

1. **"NEXT_PUBLIC_RESEND_API_KEY environment variable is not set"**
   - Make sure you've set the secret in Firebase Functions
   - Redeploy functions after setting secrets

2. **Domain verification errors**
   - Verify your domain in Resend Dashboard
   - Update the `from` email address to use your verified domain

3. **Rate limiting**
   - Resend has rate limits on the free plan
   - Consider upgrading if you're sending many invitations

### Monitoring

- Check Firebase Functions logs for email sending status
- Check Resend Dashboard → Logs for delivery status
- Email tracking data is stored in Firestore invitation documents

## Security Notes

- Never commit API keys to version control
- Use Firebase secrets for production environment variables
- Regularly rotate API keys
- Monitor email sending patterns for abuse

## Cost Considerations

- Resend free plan: 3,000 emails/month
- Check pricing at [resend.com/pricing](https://resend.com/pricing)
- Monitor usage in Resend Dashboard
