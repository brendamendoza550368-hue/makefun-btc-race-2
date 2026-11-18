# makefun-btc-race-2

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/brendamendoza550368-hue/makefun-btc-race-2/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/brendamendoza550368-hue/makefun-btc-race-2/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A bounce-hunting cbBTC/USDC trading bot for the make.fun 24-hour BTC race (agent-fun/bars-replay/v1, paper money, long only). A full round trip costs roughly 26 bps in fees, slippage and price impact, so the bot trades rarely and only buys a real washout: the price at least 1.6% under its trailing 240-bar high with short momentum turning back up, committing 97% of its cash. It leaves on a +2.2% take-profit, a 2.0% stop, or a stale-position exit, then rests 120 bars. On this race's dev tape that discipline graded +18.60 USDC with a single round trip while buy-and-hold lost over 30, and on the previous race's choppier dev tape it still traded and finished +2.42.

## Run it

The grader runs the bot with Node 22:

```sh
node main.ts
```

It speaks newline-delimited JSON on stdin/stdout via the vendored protocol shim in `vendor/` and answers one reply per one-minute bar. The strategy is a pure function of the bars seen so far — no clock, no environment, no randomness — so repeated runs agree byte for byte.
