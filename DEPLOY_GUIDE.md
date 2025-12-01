# 🚀 Deployment Guide (Vercel)

Deploying your RpgBalancer to the web is extremely easy with Vercel.

## Prerequisites
- You have `npm` installed.
- You have a Vercel account (free).

## Step 1: Install Vercel CLI
(I have already done this for you)
```bash
npm install -g vercel
```

## Step 2: Deploy
Run the following command in your terminal:

```bash
vercel
```

1. It will ask you to log in (if not already logged in).
2. It will ask to set up and deploy:
   - **Set up and deploy?** [Y]
   - **Which scope?** [Select your account]
   - **Link to existing project?** [N]
   - **Project name?** [Press Enter for default]
   - **In which directory?** [Press Enter for ./]
   - **Want to modify settings?** [N]

Wait ~1 minute. It will give you a **Production URL** (e.g., `https://rpg-balancer-xyz.vercel.app`).

## Step 3: Production Deploy
For future updates, run:
```bash
vercel --prod
```

## Step 4: Share & Test
Send the URL to your phone or friends to test it out!
