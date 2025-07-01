# GitHub OAuth Setup Guide for DocuGenius

To enable GitHub authentication in your DocuGenius application, you need to create a GitHub OAuth App and configure your environment variables.

## Step 1: Create a GitHub OAuth App

1. Go to your GitHub account settings: https://github.com/settings/developers
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the application details:
   - **Application name**: `DocuGenius` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Application description**: `AI-powered code documentation generator`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

5. Click "Register application"
6. You'll be redirected to your new OAuth app's page

## Step 2: Get Your Client ID and Secret

1. On your OAuth app's page, you'll see the **Client ID** - copy this
2. Click "Generate a new client secret"
3. Copy the **Client Secret** (you won't be able to see it again)

## Step 3: Update Your Environment Variables

Open your `.env.local` file and update these values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### Generate a NextAuth Secret

You can generate a random secret key using this command in your terminal:

```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

## Step 4: Restart Your Development Server

After updating your environment variables:

1. Stop your development server (Ctrl+C)
2. Start it again: `npm run dev`

## Step 5: Test the Authentication

1. Go to http://localhost:3000
2. Click "Connect GitHub"
3. You should be redirected to GitHub for authorization
4. After authorizing, you'll be redirected back to your dashboard

## For Production Deployment

When deploying to production:

1. Create a new OAuth App for production with your production domain
2. Update the URLs:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`
3. Update your production environment variables with the new Client ID and Secret

## Troubleshooting

- **"Client ID not found"**: Make sure your `.env.local` file is in the root directory and variables are correctly named
- **"Redirect URI mismatch"**: Ensure the Authorization callback URL in GitHub matches exactly with your domain
- **Auth not working**: Make sure you've restarted your development server after updating environment variables

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Client Secret secure and don't share it publicly
- Regenerate your Client Secret if you suspect it's been compromised
