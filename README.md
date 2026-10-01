# Neon Arcade Runner

Neon Arcade Runner is a vertical arcade shooter built with React, TypeScript, Vite and a Canvas-based game loop.

## Current baseline

The project already contains:

- touch/mouse arcade controls;
- multiple ships, upgrades and modes;
- missions and Battle Pass;
- Daily Neon Run;
- Daily Boss;
- LiveOps, Fleet and Lucky Wheel systems;
- Near Miss tracking;
- local analytics/debug dashboard;
- FTUE and retention systems;
- rewarded revive;
- monetization provider abstractions.

## Monetization policy

Automatic advertising is intentionally conservative:

- no persistent banner;
- interstitial becomes eligible after **4 completed runs**;
- at least **150 seconds** must pass since the previous interstitial;
- the current session must be at least **120 seconds** old;
- the interstitial is presented only after the player dismisses the run summary;
- Neon Premium and No Ads disable automatic interstitials;
- rewarded ads remain optional and always have an explicit reward.

See [MONETIZATION.md](MONETIZATION.md).

## Local development

```bash
npm install
npm run dev
```

Quality gate:

```bash
npm run check
```

This runs TypeScript validation, monetization policy tests and the production web build.

## Web vs Android monetization

The browser build uses mock billing/ads so the entire UX can be tested without real transactions.

Production Android is expected to provide native bridges for:

- `window.AndroidPlayStoreBilling`;
- `window.AndroidAdMobBridge`.

Real-money monetization is not considered certified until it is tested through Google Play Internal Testing with the production billing/ad integration.
