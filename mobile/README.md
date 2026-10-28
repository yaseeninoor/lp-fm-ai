# NOOR PORTAL — Expo Android App

This Expo project opens the live Yaseenis portal at https://noor.yaseenis.com/ inside a native WebView. Portal login, public content and admin pages remain hosted by the website/Firebase; this app does not independently implement authentication or media storage.

## Expo EAS Build

In Expo.dev, connect repository `yaseeninoor/lp-fm-ai` and set **Base directory** to `/mobile` (or `mobile`, if the UI asks for a relative path). Select **Android**.

- For an installable test APK, choose the **preview** build profile. The `eas.json` profile is configured with `android.buildType: apk`.
- EAS may ask you to sign in to Expo and configure Android credentials.
- For a Play Store release, use the production profile and follow EAS signing/submission setup.

## Notes

- The site must be reachable over HTTPS.
- Uploading audio/video and Firebase login work only to the extent those features are implemented and allowed on the website itself.
- Test authentication, file selection, audio/video playback and navigation on a real Android device before release.
