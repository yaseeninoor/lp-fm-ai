# NOOR PORTAL — Expo mobile app

This Expo project wraps the live portal at https://noor.yaseenis.com/ in a native WebView. Website pages, Firebase login, admin content and media storage remain hosted by the website; this mobile shell does not replace or bypass website security.

## Build an Android APK with Expo.dev

1. Open the Expo EAS Build page and connect GitHub repository `yaseeninoor/lp-fm-ai`.
2. Set **Base directory** to `mobile` (relative path; do not use the repository root).
3. Choose **Android**.
4. Use the **preview** build profile. `eas.json` sets this profile to create an installable APK.
5. Confirm the build. Sign in to Expo and follow any Android credential setup prompts.
6. When the build finishes, download the APK from the EAS build page and test it on an Android phone.

## Notes

- The public website must be reachable over HTTPS.
- Firebase login, audio/video playback, and media uploads work only to the extent the live website supports them inside a mobile WebView.
- Test admin sign-in and media upload on a real Android device before distributing the app.
