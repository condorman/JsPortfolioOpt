import solver from 'javascript-lp-solver'

export function getLatestPrices(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new TypeError('prices must be a non-empty array')
  }
  const first = prices[0]

  if (Array.isArray(first)) {
    const cols = first.length
    const latest = Array(cols).fill(null)
    for (const row of prices) {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new TypeError('prices rows must be arrays of consistent length')
      }
      for (let c = 0; c < cols; c += 1) {
        if (Number.isFinite(row[c])) {
          latest[c] = row[c]
        }
      }
    }
    if (latest.some((v) => !Number.isFinite(v))) {
      throw new TypeError('could not infer latest finite price for each asset')
    }
    return latest
  }

  if (typeof first === 'object' && first !== null) {
    const latest = {}
    for (const row of prices) {
      if (typeof row !== 'object' || row == null || Array.isArray(row)) {
        throw new TypeError('prices rows must be arrays or objects')
      }
      for (const [key, value] of Object.entries(row)) {
        if (Number.isFinite(value)) {
          latest[key] = value
        }
      }
    }
    const values = Object.values(latest)
    if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
      throw new TypeError('could not infer latest finite price for each asset')
    }
    return latest
  }

  throw new TypeError('prices rows must be arrays or objects')
}

function argmax(values) {
  let bestIdx = 0
  let bestVal = values[0]
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] > bestVal) {
      bestVal = values[i]
      bestIdx = i
    }
  }
  return bestIdx
}

function sum(values) {
  return values.reduce((acc, v) => acc + v, 0)
}

function isObjectLike(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function toPriceMap(latestPrices) {
  if (Array.isArray(latestPrices)) {
    return Object.fromEntries(latestPrices.map((price, i) => [String(i), price]))
  }
  if (isObjectLike(latestPrices)) {
    return { ...latestPrices }
  }
  throw new TypeError('latestPrices must be an array or object')
}

function removeZeroPositions(allocation) {
  return Object.fromEntries(
    Object.entries(allocation).filter(([, shares]) => shares !== 0),
  )
}

export class DiscreteAllocation {
  constructor(weights, latestPrices, { totalPortfolioValue = 10000, shortRatio = null } = {}) {
    if (!isObjectLike(weights)) {
      throw new TypeError('weights should be an object keyed by ticker')
    }
    if (Object.values(weights).some((value) => !Number.isFinite(value))) {
      throw new TypeError('weights should contain only finite numeric values')
    }

    this.weights = Object.entries(weights)
    this.latestPrices = toPriceMap(latestPrices)

    if (Object.values(this.latestPrices).some((value) => !Number.isFinite(value))) {
      throw new TypeError('latestPrices should contain only finite numeric values')
    }
    if (!(totalPortfolioValue > 0)) {
      throw new Error('totalPortfolioValue must be greater than zero')
    }
    if (shortRatio != null && shortRatio < 0) {
      throw new Error('shortRatio must be non-negative')
    }

    this.totalPortfolioValue = totalPortfolioValue
    this.shortRatio =
      shortRatio == null
        ? this.weights.reduce((acc, [, weight]) => (weight < 0 ? acc + -weight : acc), 0)
        : shortRatio
  }

  _allocationRmseError() {
    if (!this.allocation) {
      return 0
    }
    let portfolioValue = 0
    for (const [ticker, shares] of Object.entries(this.allocation)) {
      portfolioValue += shares * this.latestPrices[ticker]
    }
    if (portfolioValue <= 0) {
      return Number.POSITIVE_INFINITY
    }

    let sse = 0
    for (const [ticker, weight] of this.weights) {
      const shares = this.allocation[ticker] ?? 0
      const allocWeight = (shares * this.latestPrices[ticker]) / portfolioValue
      const diff = weight - allocWeight
      sse += diff * diff
    }
    return Math.sqrt(sse / this.weights.length)
  }

  _longOnlyGreedy(weightsEntries, availableFunds) {
    const sharesBought = []
    const buyPrices = []

    // First pass: floor based on target notional.
    for (const [ticker, weight] of weightsEntries) {
      const price = this.latestPrices[ticker]
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`invalid latest price for ticker ${ticker}`)
      }
      const shares = Math.floor((weight * this.totalPortfolioValue) / price)
      sharesBought.push(shares)
      buyPrices.push(price)
      availableFunds -= shares * price
    }

    // Second pass: buy one share at a time for the largest weight deficit.
    while (availableFunds > 0) {
      const currentDollar = sharesBought.map((shares, i) => shares * buyPrices[i])
      const denom = sum(currentDollar)
      if (denom <= 0) {
        break
      }
      const currentWeights = currentDollar.map((x) => x / denom)
      const idealWeights = weightsEntries.map(([, weight]) => weight)
      const deficit = idealWeights.map((w, i) => w - currentWeights[i])

      let idx = argmax(deficit)
      let price = buyPrices[idx]
      let counter = 0
      while (price > availableFunds) {
        deficit[idx] = 0
        idx = argmax(deficit)
        if (deficit[idx] < 0 || counter === 10) {
          break
        }
        price = buyPrices[idx]
        counter += 1
      }

      if (deficit[idx] <= 0 || counter === 10) {
        break
      }

      sharesBought[idx] += 1
      availableFunds -= price
    }

    const allocation = Object.fromEntries(
      weightsEntries.map(([ticker], i) => [ticker, sharesBought[i]]),
    )
    return [removeZeroPositions(allocation), availableFunds]
  }

  _longOnlyLp(weightsEntries, budget) {
    const constraints = {
      budget: { max: budget },
    }
    const variables = {}
    const ints = {}

    for (let i = 0; i < weightsEntries.length; i += 1) {
      const [ticker, weight] = weightsEntries[i]
      const price = this.latestPrices[ticker]
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`invalid latest price for ticker ${ticker}`)
      }
      const target = weight * this.totalPortfolioValue
      const xName = `x_${i}`
      const uName = `u_${i}`
      const xNonneg = `x_nonneg_${i}`
      const uNonneg = `u_nonneg_${i}`
      const posAbs = `pos_abs_${i}`
      const negAbs = `neg_abs_${i}`

      constraints[xNonneg] = { min: 0 }
      constraints[uNonneg] = { min: 0 }
      constraints[posAbs] = { max: target }
      constraints[negAbs] = { max: -target }

      // maximize p^T x - sum(u), equivalent to minimizing sum(u) + leftover up to constant
      variables[xName] = {
        obj: price,
        budget: price,
        [xNonneg]: 1,
        [posAbs]: price,
        [negAbs]: -price,
      }
      variables[uName] = {
        obj: -1,
        [uNonneg]: 1,
        [posAbs]: -1,
        [negAbs]: -1,
      }
      ints[xName] = 1
    }

    const model = {
      optimize: 'obj',
      opType: 'max',
      constraints,
      variables,
      ints,
    }

    const result = solver.Solve(model)
    if (!result?.feasible) {
      throw new Error('integer LP allocation did not find a feasible solution')
    }

    const allocation = {}
    let spend = 0
    for (let i = 0; i < weightsEntries.length; i += 1) {
      const [ticker] = weightsEntries[i]
      const xName = `x_${i}`
      const shares = Math.max(0, Math.round(result[xName] ?? 0))
      allocation[ticker] = shares
      spend += shares * this.latestPrices[ticker]
    }

    return [removeZeroPositions(allocation), budget - spend]
  }

  greedyPortfolio({ reinvest = false } = {}) {
    this.weights.sort((a, b) => b[1] - a[1])

    if (this.weights.length > 0 && this.weights[this.weights.length - 1][1] < 0) {
      const longs = Object.fromEntries(this.weights.filter(([, weight]) => weight >= 0))
      const shorts = Object.fromEntries(
        this.weights.filter(([, weight]) => weight < 0).map(([ticker, weight]) => [ticker, -weight]),
      )

      const longTotal = sum(Object.values(longs))
      const shortTotal = sum(Object.values(shorts))
      const normalizedLongs = Object.fromEntries(
        Object.entries(longs).map(([ticker, weight]) => [ticker, weight / longTotal]),
      )
      const normalizedShorts = Object.fromEntries(
        Object.entries(shorts).map(([ticker, weight]) => [ticker, weight / shortTotal]),
      )

      const shortVal = this.totalPortfolioValue * this.shortRatio
      let longVal = this.totalPortfolioValue
      if (reinvest) {
        longVal += shortVal
      }

      const longAlloc = new DiscreteAllocation(normalizedLongs, this.latestPrices, {
        totalPortfolioValue: longVal,
      }).greedyPortfolio()
      const shortAlloc = new DiscreteAllocation(normalizedShorts, this.latestPrices, {
        totalPortfolioValue: shortVal,
      }).greedyPortfolio()

      const combined = { ...longAlloc[0] }
      for (const [ticker, shares] of Object.entries(shortAlloc[0])) {
        combined[ticker] = -shares
      }
      this.allocation = removeZeroPositions(combined)
      return [this.allocation, longAlloc[1] + shortAlloc[1]]
    }

    const positive = this.weights.filter(([, weight]) => weight > 0)
    const [allocation, leftover] = this._longOnlyGreedy(positive, this.totalPortfolioValue)
    this.allocation = allocation
    return [allocation, leftover]
  }

  lpPortfolio({ reinvest = false } = {}) {
    this.weights.sort((a, b) => b[1] - a[1])

    if (this.weights.length > 0 && this.weights[this.weights.length - 1][1] < 0) {
      const longs = Object.fromEntries(this.weights.filter(([, weight]) => weight >= 0))
      const shorts = Object.fromEntries(
        this.weights.filter(([, weight]) => weight < 0).map(([ticker, weight]) => [ticker, -weight]),
      )

      const longTotal = sum(Object.values(longs))
      const shortTotal = sum(Object.values(shorts))
      const normalizedLongs = Object.fromEntries(
        Object.entries(longs).map(([ticker, weight]) => [ticker, weight / longTotal]),
      )
      const normalizedShorts = Object.fromEntries(
        Object.entries(shorts).map(([ticker, weight]) => [ticker, weight / shortTotal]),
      )

      const shortVal = this.totalPortfolioValue * this.shortRatio
      let longVal = this.totalPortfolioValue
      if (reinvest) {
        longVal += shortVal
      }

      const longAlloc = new DiscreteAllocation(normalizedLongs, this.latestPrices, {
        totalPortfolioValue: longVal,
      }).lpPortfolio()
      const shortAlloc = new DiscreteAllocation(normalizedShorts, this.latestPrices, {
        totalPortfolioValue: shortVal,
      }).lpPortfolio()

      const combined = { ...longAlloc[0] }
      for (const [ticker, shares] of Object.entries(shortAlloc[0])) {
        combined[ticker] = -shares
      }
      this.allocation = removeZeroPositions(combined)
      return [this.allocation, longAlloc[1] + shortAlloc[1]]
    }

    const positive = this.weights.filter(([, weight]) => weight > 0)
    const [allocation, leftover] = this._longOnlyLp(positive, this.totalPortfolioValue)
    this.allocation = allocation
    return [allocation, leftover]
  }
}

export const get_latest_prices = getLatestPrices
