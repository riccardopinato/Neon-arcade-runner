# Android test APK

The Android test package is generated with Capacitor around the existing Vite web build.

## Current purpose

This APK is for gameplay/UI testing on a real Android device.

The current package uses the browser/mock monetization layer. Real AdMob and Google Play Billing are not yet wired into this debug build.

## Build

GitHub Actions workflow:

`.github/workflows/android-apk.yml`

Artifact:

`Neon-Arcade-Runner-test-apk`

APK filename:

`Neon-Arcade-Runner-test.apk`


## Mobile fullscreen behavior

The test APK now uses the Capacitor App and Status Bar plugins. During active gameplay the web app occupies `100dvh` and hides the Android status bar. Android Back is captured by the game and opens the run-exit confirmation instead of immediately closing the app.
