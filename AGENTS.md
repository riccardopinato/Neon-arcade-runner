# AGENTS

## Sources of truth

Read in this order before changing product behavior:

1. `PRODUCT_BIBLE.md`
2. `ROADMAP.md`
3. `PROJECT_STATE.md`
4. current implementation
5. `MONETIZATION.md` for ads/IAP work

The current implementation is the source of implementation truth. Do not duplicate an existing system because an older plan describes it differently.

## Rule Zero

Reduce unnecessary friction. Do not add screens, taps, ads, paywalls, dependencies or architecture unless they clearly improve user value, monetization, reliability, maintainability, accessibility or release safety.

## Game rules

- Never interrupt active gameplay with an automatic interstitial.
- Rewarded ads are opt-in and must have an explicit reward.
- Premium/No Ads must suppress automatic interstitials.
- Do not hardcode ad frequency in UI.
- Do not grant production entitlements without a successful billing result.
- Core gameplay must remain usable without network access.

## Engineering rules

- Preserve domain/system boundaries.
- Prefer small, testable systems over logic scattered in `App.tsx`.
- Do not add a second Daily Boss, analytics or economy pipeline.
- Keep browser mock providers separate from production providers.
- Run `npm run check` before declaring a change complete.
- If a test was not run, say so.

## Documentation

For a significant feature/fix, update:

- `ROADMAP.md`;
- `PROJECT_STATE.md`;
- relevant specialist document such as `MONETIZATION.md`.
