// Bounce hunter for the cbBTC/USDC minute replay, second race.
//
// The toll is unchanged: a full round trip costs roughly 26 bps in fees,
// slippage and price impact. What changed is the tape this bot expects.
// A day that opens with a sharp sell-off and then claws back part of the
// loss punishes buy-and-hold (the house holder lost over 3% on the dev
// day) and punishes a holder with no exit even more: it rides the late
// slide all the way down. So this bot trades the bounce, not the day:
//   entry - the price has fallen at least 1.6% under its trailing
//           240-bar high and the 5-bar momentum has turned back up:
//           only a real washout counts, not the first wobble of a fall.
//           The crowd over-sold, the fall has stalled, buy 97% of cash.
//   exit  - take the bounce: sell at +2.2% over the entry close, which
//           pays the toll many times over. A stop 2.0% under the entry
//           close cuts a dip that was really a cliff. A position still
//           open after 600 bars is sold whenever it is at least 0.35%
//           ahead, so a stale bounce never rides a second slide.
//   After any exit the bot rests 120 bars before it may buy again, so
//   one day holds at most a handful of tolls.
// Everything is a pure function of the bars seen so far: no clock, no
// environment, no randomness, so the two graded runs agree byte for byte.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYM = 'CBBTC';
const HIGH_WIN = 240;
const DIP_MIN = 0.016;
const TURN_WIN = 5;
const SPEND_FRAC = 0.97;
const TAKE_PROFIT = 0.022;
const HARD_STOP = 0.020;
const MAX_HOLD = 600;
const STALE_MIN_GAIN = 0.0035;
const COOLDOWN = 120;
const SLIPPAGE_BPS = 250;

const closes: number[] = [];
let entryClose = 0;
let entryBar = -1;
let cooldownLeft = 0;

function buy(state: BarsState, price: number): OrderInput[] {
  const spend = BigInt(Math.floor(Number(state.cash) * SPEND_FRAC));
  if (spend < 1_000_000n) return [];
  entryClose = price;
  entryBar = closes.length - 1;
  return [{ side: 'buy', symbol: SYM, notional_quote_units: spend, max_slippage_bps: SLIPPAGE_BPS }];
}

function sellAll(state: BarsState): OrderInput[] {
  const holding = state.positions.get(SYM);
  if (holding === undefined || holding.qty <= 0n) return [];
  entryClose = 0;
  entryBar = -1;
  cooldownLeft = COOLDOWN;
  return [{ side: 'sell', symbol: SYM, qty: holding.qty, max_slippage_bps: SLIPPAGE_BPS }];
}

function onBatch(state: BarsState): OrderInput[] {
  const raw = state.close(SYM);
  if (raw === null) return [];
  const price = Number(raw);
  closes.push(price);
  if (cooldownLeft > 0) cooldownLeft -= 1;

  const holding = state.positions.get(SYM);
  if (holding !== undefined && holding.qty > 0n && entryClose > 0) {
    const gain = price / entryClose - 1;
    const heldFor = closes.length - 1 - entryBar;
    if (gain >= TAKE_PROFIT) return sellAll(state);
    if (gain <= -HARD_STOP) return sellAll(state);
    if (heldFor >= MAX_HOLD && gain >= STALE_MIN_GAIN) return sellAll(state);
    return [];
  }

  if (state.warmingUp || cooldownLeft > 0) return [];
  const n = closes.length;
  if (n <= HIGH_WIN) return [];

  const window = closes.slice(-HIGH_WIN);
  const dip = 1 - price / Math.max(...window);
  const turningUp = price > closes[n - 1 - TURN_WIN];
  if (dip >= DIP_MIN && turningUp) return buy(state, price);

  return [];
}

await runBars({ onBatch });
