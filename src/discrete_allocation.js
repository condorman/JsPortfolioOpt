export function getLatestPrices(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new TypeError('prices must be a non-empty array')
  }
  const last = prices[prices.length - 1]
  if (Array.isArray(last)) {
    return last.slice()
  }
  if (typeof last === 'object' && last !== null) {
    return { ...last }
  }
  throw new TypeError('prices rows must be arrays or objects')
}

function removeZeroPositions(allocation) {
  return Object.fromEntries(
    Object.entries(allocation).filter(([, shares]) => shares !== 0),
  )
}

export class DiscreteAllocation {
  constructor(weights, latestPrices, { totalPortfolioValue = 10000, shortRatio = 0.3 } = {}) {
    this.weights = { ...weights }
    this.latestPrices = { ...latestPrices }
    this.totalPortfolioValue = totalPortfolioValue
    this.shortRatio = shortRatio
  }

  greedyPortfolio({ reinvest = false } = {}) {
    let budget = this.totalPortfolioValue
    const allocation = {}

    const entries = Object.entries(this.weights)
      .filter(([, w]) => w > 0)
      .sort((a, b) => b[1] - a[1])

    for (const [ticker, weight] of entries) {
      const price = this.latestPrices[ticker]
      if (!Number.isFinite(price) || price <= 0) {
        continue
      }
      const targetValue = weight * this.totalPortfolioValue
      const shares = Math.floor(targetValue / price)
      allocation[ticker] = shares
      budget -= shares * price
    }

    if (reinvest) {
      for (const [ticker] of entries) {
        const price = this.latestPrices[ticker]
        while (budget >= price && price > 0) {
          allocation[ticker] = (allocation[ticker] ?? 0) + 1
          budget -= price
        }
      }
    }

    return [removeZeroPositions(allocation), budget]
  }

  lpPortfolio({ reinvest = false } = {}) {
    // Placeholder: keep deterministic behavior while LP backend is integrated.
    return this.greedyPortfolio({ reinvest })
  }
}

export const get_latest_prices = getLatestPrices
