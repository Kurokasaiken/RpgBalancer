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
vercel --yes --archive=tgz
```

1. It will ask you to log in (if not already logged in).
2. It will ask to set up and deploy:
   - **Set up and deploy?** [Y]
   - **Which scope?** [Select your account]
   - **Link to existing project?** [N]
   - **Project name?** `rpg-balancer` (lowercase — il nome dir `RPG` è rifiutato)
   - **In which directory?** [Press Enter for ./]
   - **Want to modify settings?** [N]

Wait ~1 minute. It will give you a **Production URL** (e.g., `https://rpg-balancer-xyz.vercel.app`).

### Note operative (verificate 2026-10-06)

- `--archive=tgz` è **obbligatorio**: l'upload file-per-file supera il limite di 15.000 file (~40k rilevati).
- `.vercelignore` è **obbligatorio** e sostituisce `.gitignore` per i deploy: senza di esso l'archivio include `.env` (symlink a `mind-weaver/.env`, illeggibile sul build server → build fallita) e directory dev-only pesanti.
- Progetto Vercel: `kurokasaikens-projects/rpg-balancer` (link in `.vercel/`, gitignored).
- Upload ~2.4GB: la prima build usa la cache solo per `npm ci`; deploy successivi restano pesanti perché l'archivio include `public/` (320MB) e asset.

## Step 3: Production Deploy
For future updates, run:
```bash
vercel --prod --yes --archive=tgz
```

## Step 4: Share & Test
Send the URL to your phone or friends to test it out!
