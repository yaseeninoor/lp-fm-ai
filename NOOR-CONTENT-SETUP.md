# NOOR Portal Content System – GitHub-only setup

Repository: yaseeninoor/lp-fm-ai  
Firebase project: lp-store-23212  
Public library: https://noor.yaseenis.com/content.html  
Admin publisher: https://noor.yaseenis.com/admin/content.html

## Content sources
- PDF: GitHub public repository under noor-media/pdf.
- Text: GitHub public repository under noor-media/text.
- Photos: GitHub public repository under noor-media/photos.
- Videos: YouTube URL embedded in the public library.
- Metadata: Firebase Firestore collection noorContent.
- Telegram is not used.
- Firebase Storage is not used by this new publisher.

## 1. Deploy Cloudflare Worker
Create a Cloudflare Worker named noor-content-api. Copy noor-content-worker.js into its editor and deploy.

Add one Worker secret:
- GITHUB_TOKEN: Fine-grained GitHub Personal Access Token limited to repository yaseeninoor/lp-fm-ai with Contents: Read and write.

Do not put the token in website code or send it in chat.

## 2. Set the Worker URL
Open admin/content.html and replace PASTE_CLOUDFLARE_WORKER_URL with the exact deployed Worker URL.

## 3. Deploy Firestore rules
Run Actions -> Deploy Noor Firestore Rules Only -> Run workflow.
No Firebase Storage Rules deployment is needed for this content system.

## 4. Test
Sign in as Admin, open /admin/content.html, upload a small PDF, TXT and photo, and add a YouTube URL. Verify them at /content.html.

## Limits and cost
- Worker limits each GitHub upload to 20 MB.
- Files uploaded to the public GitHub repository are publicly accessible. Do not upload private/confidential files.
- GitHub is source hosting, not a high-volume file-storage/CDN service; large or frequent uploads may hit GitHub limits or grow the repository.
- Cloudflare Workers Free has usage limits.
- This design does not provision Firebase Storage or require Firebase Blaze for these uploads.
