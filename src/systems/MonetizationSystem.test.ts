import assert from 'node:assert/strict';
import { MONETIZATION_CONFIG, MonetizationSystem } from './MonetizationSystem';
import { UserState } from '../types';

const baseUser: UserState = {
  isPremium: false,
  isAdFree: false,
  gems: 0,
  coins: 0,
  highscore: 0,
  equippedShip: 'starter',
  ownedShips: ['starter'],
  activeBoosts: { shieldUntil: 0, magnetUntil: 0, fireBoostUntil: 0 },
  hasExtraLife: false,
  adsWatchedCount: 0,
  chaosModeUnlocked: false,
  runsSinceInterstitial: 0,
  lastInterstitialAt: 0,
  interstitialsShown: 0
};

const now = 1_000_000;
const oldSession = now - MONETIZATION_CONFIG.interstitial.minSessionAgeMs - 1;

let state = { ...baseUser };

for (let run = 1; run < MONETIZATION_CONFIG.interstitial.minCompletedRuns; run++) {
  const decision = MonetizationSystem.evaluatePostRunInterstitial(state, oldSession, now);
  assert.equal(decision.eligible, false, `run ${run} must not show an interstitial`);
  assert.equal(decision.reason, 'run_cap');
  state = { ...state, runsSinceInterstitial: decision.nextRunsSinceInterstitial };
}

const fourth = MonetizationSystem.evaluatePostRunInterstitial(state, oldSession, now);
assert.equal(fourth.eligible, true);
assert.equal(fourth.reason, 'eligible');

const marked = MonetizationSystem.markInterstitialShown(
  { ...state, runsSinceInterstitial: fourth.nextRunsSinceInterstitial },
  now
);
assert.equal(marked.runsSinceInterstitial, 0);
assert.equal(marked.lastInterstitialAt, now);
assert.equal(marked.interstitialsShown, 1);

const timeCapped = MonetizationSystem.evaluatePostRunInterstitial(
  { ...marked, runsSinceInterstitial: MONETIZATION_CONFIG.interstitial.minCompletedRuns - 1 },
  oldSession,
  now + MONETIZATION_CONFIG.interstitial.minIntervalMs - 1
);
assert.equal(timeCapped.eligible, false);
assert.equal(timeCapped.reason, 'time_cap');

const noAds = MonetizationSystem.applyProductEntitlement(baseUser, 'noncons_remove_ads');
assert.equal(noAds.isAdFree, true);
assert.equal(noAds.isPremium, false);
assert.equal(
  MonetizationSystem.evaluatePostRunInterstitial(noAds, oldSession, now).reason,
  'no_ads'
);

const premium = MonetizationSystem.applyProductEntitlement(baseUser, 'noncons_neon_premium');
assert.equal(premium.isPremium, true);
assert.equal(premium.isAdFree, true);
assert.equal(premium.chaosModeUnlocked, true);
assert.ok(premium.ownedShips.includes('premium_golden'));
assert.equal(MonetizationSystem.getEntitlements(premium).automaticDoubleRunGems, true);

const youngSession = MonetizationSystem.evaluatePostRunInterstitial(
  { ...baseUser, runsSinceInterstitial: MONETIZATION_CONFIG.interstitial.minCompletedRuns - 1 },
  now - 5_000,
  now
);
assert.equal(youngSession.eligible, false);
assert.equal(youngSession.reason, 'session_too_young');

assert.equal(MonetizationSystem.normalizeAnalyticsProductId('noncons_neon_premium'), 'neon_premium');
assert.equal(MonetizationSystem.normalizeAnalyticsProductId('noncons_remove_ads'), 'no_ads');
assert.equal(MonetizationSystem.normalizeAnalyticsProductId('cons_gems_100'), 'gem_pack');

console.log('Monetization policy tests: PASS');
