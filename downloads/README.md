# Downloads

This folder holds the Android app (APK) file that the "Download for Android" buttons serve.

## How to use

1. Put your compiled APK in this folder with this exact name:
   `autoresponder.apk`
2. The download button then points to `downloads/autoresponder.apk` (see `APK_URL` in `script.js`).
3. Commit and push the APK along with the site so Render serves it.

> Tip: If the APK is large (over ~50MB), don't commit it to the repo.
> Upload it to **GitHub Releases** instead and set `APK_URL` to the release-asset
> download link (e.g. `https://github.com/USER/REPO/releases/download/v1.0/autoresponder.apk`).
