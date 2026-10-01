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
