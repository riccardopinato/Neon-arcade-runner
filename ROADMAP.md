# Roadmap

## Baseline already implemented

- [x] vertical arcade shooter core;
- [x] touch/mouse controls;
- [x] ships, gems and upgrades;
- [x] multiple game modes;
- [x] missions and achievements;
- [x] Battle Pass;
- [x] LiveOps / events;
- [x] Fleet progression;
- [x] rewarded revive;
- [x] Near Miss;
- [x] Daily Neon Run;
- [x] Daily Boss;
- [x] local analytics and debug dashboard;
- [x] FTUE / retention polish.

## MAXI STEP — Monetization & Daily Content Foundation

Status: **implemented on feature branch**

- [x] verify and preserve the existing Daily Boss instead of rebuilding it;
- [x] centralize monetization policy;
- [x] remove random post-run interstitial logic;
- [x] configure 4-run + 150 s + 120 s session caps;
- [x] show interstitial only after run-summary dismissal;
- [x] remove persistent dashboard banner;
- [x] centralize Premium / No Ads entitlements;
- [x] replace the monthly VIP concept with Neon Premium Lifetime;
- [x] normalize rewarded revive;
- [x] add optional post-run x2 gem reward;
- [x] separate mock and production billing/ad providers;
- [x] remove in-app card collection;
- [x] add monetization analytics;
- [x] add policy regression tests;
- [x] add CI quality gate.

## Next execution block

### Android monetization integration

1. Add/verify the native Android wrapper.
2. Wire Google Mobile Ads test IDs.
3. Wire Google Play Billing or RevenueCat sandbox products.
4. Create Internal Testing AAB.
5. Validate purchase, restore, No Ads and rewarded callbacks on a real device.
6. Tune economy/ad frequency from real telemetry.

### Release candidate

After native monetization QA:

- store listing assets;
- privacy / data-safety review;
- content rating;
- crash/performance pass;
- accessibility / small-screen pass;
- production AAB.


## MOBILE GAMEPLAY REPAIR — Fullscreen, Damage & Exit Flow

Status: **implemented on feature branch**

- [x] replace 4:5 desktop-style game card with true mobile `100dvh` gameplay;
- [x] hide app header and Android status bar during a run;
- [x] make HUD an overlay so it does not reduce maneuvering space;
- [x] remove FRECCE/WASD desktop instructions;
- [x] remove the redundant second “AVVIA MOTORI” screen;
- [x] start gameplay immediately after Decolla / Daily / Boss selection;
- [x] fix shield expiration leaving permanent invulnerability;
- [x] keep only timed hit-grace or active shield as valid invulnerability sources;
- [x] add visible Home control during gameplay;
- [x] intercept Android Back gesture/button while a run is active;
- [x] Free exit confirmation discards the current run without rewards;
- [x] Neon Premium can suspend and resume one run locally;
- [x] add viewport safe-area support for mobile displays.

### Device QA required

- verify full-height canvas on tall Android displays;
- collide repeatedly with meteors after shield expiration;
- verify boss projectiles and hazards remove HP;
- verify Android back gesture opens the exit confirmation;
- verify Free exit loses the run;
- verify Premium save/resume restores HP, position, entities, score, gems and timed powerups.
