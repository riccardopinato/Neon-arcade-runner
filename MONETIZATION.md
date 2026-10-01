# Monetization

## Product rule

The free game remains complete and playable. Monetization must add value or exchange an explicit reward; it must not create artificial frustration.

## Free model

Automatic ads:

- no banner ads;
- no ad during active gameplay;
- no interstitial during revive, reward resolution or purchase flow;
- interstitial only after the configured run/time caps and after the run summary is dismissed.

Optional rewarded placements:

- one rewarded revive when the run qualifies;
- post-run x2 gem reward;
- existing explicitly offered boosts/chests where applicable.

## Neon Premium Lifetime

Store product: `noncons_neon_premium`

One-time premium entitlement currently includes:

- no automatic interstitials;
- premium ships;
- Chaos mode;
- automatic x2 gems earned in a run;
- one VIP free revive per day;
- premium progression benefits already present in the product.

## No Ads

Store product: `noncons_remove_ads`

No Ads removes automatic interstitials. Rewarded videos stay available because they are optional, user-initiated exchanges.

## Frequency cap

The source of truth is `MONETIZATION_CONFIG` in `src/systems/MonetizationSystem.ts`.

Initial values:

- 4 completed runs;
- 150 seconds minimum between interstitials;
- 120 seconds minimum current-session age.

Do not hardcode ad caps in UI components.

## Billing / ads boundary

```
UI
  -> MonetizationSystem
     -> billing/ad provider
        -> native bridge
```

Browser preview uses mock providers.

Production mode uses:

- `window.AndroidPlayStoreBilling`;
- `window.AndroidAdMobBridge`.

A missing production bridge fails closed. Production purchase code must not grant an entitlement from a fake success.

## Purchase restoration

Restoration returns the store product IDs that are actually owned. The application reapplies only known non-consumable entitlements.

## Analytics

Tracked funnels include:

- `interstitial_eligible`;
- `interstitial_shown`;
- `interstitial_closed`;
- `interstitial_skipped` with reason;
- rewarded offered/accepted/started/completed/failed/reward_granted;
- purchase started/completed/failed;
- restore started/completed.

## QA

`npm run test:monetization` protects:

- run cap;
- time cap;
- minimum session age;
- Premium/No Ads suppression;
- interstitial state reset after display;
- Premium entitlement grant;
- product analytics mapping.
