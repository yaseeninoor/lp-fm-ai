# NOOR Portal Content System – Setup

Repository: yaseeninoor/lp-fm-ai  
Firebase project: lp-store-23212  
Public library: https://noor.yaseenis.com/content.html  
Admin publisher: https://noor.yaseenis.com/admin/content.html

## Content sources
- PDF and TXT/Markdown: uploaded into this public GitHub repository under noor-media/pdf or noor-media/text.
- Photos: GitHub, Telegram, or both. Telegram-only photos are served through the Cloudflare Worker proxy.
- Videos: YouTube URL only; the public page embeds the YouTube player.
- Metadata: Firestore collection noorContent.
- Existing Firebase Storage is not used by this new publisher.

## 1. Deploy the Cloudflare Worker
Create a Cloudflare Worker named noor-content-api. Copy noor-content-worker.js into its editor and deploy.

Add these Worker secrets:
- GITHUB_TOKEN: Fine-grained GitHub Personal Access Token limited to repository yaseeninoor/lp-fm-ai with Contents: Read and write. Do not put this token in the website.
- TELEGRAM_BOT_TOKEN: Telegram bot token from BotFather.
- TELEGRAM_CHAT_ID: Private channel numeric ID (usually begins with -100). Add the bot to that channel as an administrator with permission to post messages.

The GitHub token is required for PDF, text, and GitHub photo uploads. Telegram secrets are required only when Telegram is selected for photos.

## 2. Set the Worker URL
Open admin/content.html and replace:
PASTE_CLOUDFLARE_WORKER_URL
with the deployed Worker URL, for example https://noor-content-api.YOUR-SUBDOMAIN.workers.dev (use the exact URL shown by Cloudflare).

## 3. Deploy Firestore rules
The repository firestore.rules includes the noorContent collection rules. Run GitHub Actions workflow:
Actions -> Deploy Noor Firestore Rules Only -> Run workflow.
Do not deploy Storage Rules for this content system.

## 4. Test
1. Sign in to NOOR Portal with the authorized Admin/Super Admin account.
2. Open /admin/content.html.
3. Publish one small TXT file, one PDF, one photo (Both), and one YouTube URL.
4. Open /content.html in a private browser tab and confirm public display.

## Limits and cost notes
- GitHub uploads are capped by this Worker at 20 MB per file. Keep media repositories modest; GitHub is source hosting, not a general-purpose high-volume file host.
- Telegram is a secondary photo destination, not a formal cloud-storage SLA. Telegram file retrieval through the Bot API has API limits.
- Cloudflare Workers Free has request/CPU limits; this Worker is designed for modest admin publishing, not large public video streaming.
- YouTube videos are embedded and are not uploaded to GitHub.
- This design does not create or require a Firebase Storage bucket and does not require Firebase Blaze for these uploads.
