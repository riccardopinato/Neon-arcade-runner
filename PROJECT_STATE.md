# Project State — Neon Arcade Runner

**Updated:** 2026-10-01

## Stack

React 19 + TypeScript + Vite + Canvas gameplay.

## Product state

Neon Arcade Runner is a real developed game, not a concept prototype.

Confirmed systems include:

- core vertical shooter;
- touch controls;
- ships/upgrades/economy;
- multiple modes;
- missions/Battle Pass/LiveOps;
- Fleet;
- Near Miss;
- Daily Neon Run;
- Daily Boss;
- rewarded revive;
- local analytics;
- FTUE and retention systems.

## Important baseline correction

Daily Boss already exists in `DailyBossSystem.ts` and is integrated into `GameCanvas.tsx`. This maxi-step preserves it instead of creating a duplicate system.

## Monetization state

- Neon Premium is a one-time lifetime product.
- No Ads remains a smaller one-time purchase.
- Premium implies No Ads.
- Random 40% post-run interstitial selection is removed.
- Automatic interstitial policy is centralized:
  - 4 completed runs;
  - 150 seconds minimum since previous interstitial;
  - 120 seconds minimum current-session age.
- Interstitial appears only after the run summary is dismissed.
- Persistent dashboard banner is removed.
- Rewarded revive is an explicit opt-in placement.
- Free users can optionally watch a post-run rewarded video for an additional run-gem payout.
- Premium users receive the run-gem multiplier automatically.
- Browser preview uses mock billing/ads.
- Production uses explicit native billing/ad bridges.
- The store does not collect card number, CVV or cardholder data.

## Quality gate

Run:

```bash
npm run check
```

This executes:

1. TypeScript validation;
2. monetization policy regression tests;
3. production web build.

## External release dependency

Real Google Play monetization is **not certified by the web build**.

Certification requires:

- native Android billing/ad integration;
- Google Play test products;
- AdMob test IDs;
- Internal Testing;
- purchase/restore/rewarded/interstitial checks on a real device.


## Mobile gameplay repair — 2026-10-01

The first real-device APK exposed three blocking gameplay defects and one mobile UX mismatch:

1. the run was constrained by a desktop-style `aspect-[4/5]` wrapper, leaving a large unusable lower area;
2. collected shields could leave `player.isInvulnerable` permanently true after their timer expired;
3. Android Back could leave the application instead of offering an in-run exit flow;
4. desktop-oriented copy such as FRECCE/WASD and the redundant AVVIA MOTORI screen remained visible.

The repair branch changes the run to a fullscreen mobile scene, derives invulnerability strictly from timed hit grace / active shield, introduces guarded Home/Back behavior and adds Premium local suspend/resume.

Free voluntary exit does not award run rewards. A normal death/victory still goes through the standard run completion pipeline.
