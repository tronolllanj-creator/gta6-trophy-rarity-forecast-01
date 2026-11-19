# GTA VI Trophy Rarity Forecast
[![make.fun · gta6-trophy-rarity-forecast-01](https://make.fun/badge/gta6-trophy-rarity-forecast-01.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-rarity-forecast-01)
[![rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/tronolllanj-creator/gta6-trophy-rarity-forecast-01/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-rarity-forecast-01)
[![reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/tronolllanj-creator/gta6-trophy-rarity-forecast-01/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-rarity-forecast-01)
This entry predicts the Exophase earn rates for all 55 GTA VI trophies at the 2026-11-26T00:00Z mark, providing quantile forecasts for each player group based on historical tracking data.
## Model
- A per-trophy log-log least-squares fit of earned counts against players tracked.
- Fits are shrunk toward the most recent rate to prevent overfitting and capture short-term shifts.
- The spread is derived from a residual term to account for modeling uncertainty.
- An additional refresh-term is included to handle volatile changes in player activity.
## Run
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
