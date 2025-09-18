# Email Configuration with Resend

This document explains how to configure Resend for sending transactional emails in the TimeWise Tracker application.

## Environment Variables Setup

### 1. Resend API Key

You need to add the Resend API key as an environment variable for Firebase Functions.

#### For Development (Local Environment)

Create or update `.env.local` in the root directory:

```bash
# Add this to .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### For Production (Firebase Functions)

You need to set the secret in Firebase Functions using the Firebase CLI:

```bash
# Set the Resend API key as a Firebase secret
firebase functions:secrets:set RESEND_API_KEY

# When prompted, enter your Resend API key
```

Alternatively, you can use the Firebase Console:
1. Go to Firebase Console → Functions → Environment Variables
2. Add a new secret named `RESEND_API_KEY`
3. Set the value to your Resend API key

### 2. Email From Address

The current implementation uses `noreply@timewise.app` as the sender email. You need to:

1. **Verify your domain in Resend**:
   - Go to Resend Dashboard → Domains
   - Add your domain (e.g., `timewise.app`)
   - Follow DNS verification steps

2. **Update the sender email** (if needed):
   - The sender is currently set to `TimeWise Tracker <noreply@timewise.app>`
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

1. **"RESEND_API_KEY environment variable is not set"**
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