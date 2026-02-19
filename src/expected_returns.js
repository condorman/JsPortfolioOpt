import { assertArray, column, mean, validateMatrix } from './_utils/math.js'

function returnsFromPricesImpl(prices, { logReturns = false } = {}) {
  validateMatrix('prices', prices)
  const rows = prices.length
  const cols = prices[0].length
  if (rows < 2) {
    return []
  }

  const out = []
  for (let r = 1; r < rows; r += 1) {
    const row = []
    for (let c = 0; c < cols; c += 1) {
      const prev = prices[r - 1][c]
      const next = prices[r][c]
      if (prev === 0) {
        throw new Error('prices contain a zero entry; cannot compute returns')
      }
      const simple = next / prev - 1
      row.push(logReturns ? Math.log1p(simple) : simple)
    }
    out.push(row)
  }
  return out
}

function pricesFromReturnsImpl(returns, { logReturns = false } = {}) {
  validateMatrix('returns', returns)
  const rows = returns.length
  const cols = returns[0].length

  // Match PyPortfolioOpt: set first pseudo-price row to 1, then cumulative product.
  const out = Array.from({ length: rows }, () => Array(cols).fill(1))
  if (rows === 0) {
    return out
  }
  const running = Array(cols).fill(1)
  for (let r = 1; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ret = returns[r][c]
      const growth = logReturns ? Math.exp(ret) : 1 + ret
      running[c] *= growth
      out[r][c] = running[c]
    }
  }
  return out
}

function annualize(meanReturn, frequency, compounding) {
  return compounding ? (1 + meanReturn) ** frequency - 1 : meanReturn * frequency
}

function meanHistoricalReturnImpl(
  prices,
  {
    returnsData = false,
    compounding = true,
    frequency = 252,
    logReturns = false,
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns })
  validateMatrix('returns', returns)
  const cols = returns[0].length

  return Array.from({ length: cols }, (_, c) => {
    const assetReturns = column(returns, c)
    if (compounding) {
      let growth = 1
      for (const r of assetReturns) {
        growth *= 1 + r
      }
      return growth ** (frequency / assetReturns.length) - 1
    }
    return mean(assetReturns) * frequency
  })
}

function ewmMeanAdjustTrue(values, span) {
  const alpha = 2 / (span + 1)
  let numerator = 0
  let denominator = 0
  for (const value of values) {
    numerator = value + (1 - alpha) * numerator
    denominator = 1 + (1 - alpha) * denominator
  }
  return denominator === 0 ? 0 : numerator / denominator
}

function emaHistoricalReturnImpl(
  prices,
  {
    returnsData = false,
    compounding = true,
    span = 500,
    frequency = 252,
    logReturns = false,
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns })
  validateMatrix('returns', returns)
  const cols = returns[0].length

  return Array.from({ length: cols }, (_, c) => {
    const assetReturns = column(returns, c)
    const mu = ewmMeanAdjustTrue(assetReturns, span)
    return compounding ? (1 + mu) ** frequency - 1 : mu * frequency
  })
}

function capmReturnImpl(
  prices,
  {
    marketPrices = null,
    returnsData = false,
    riskFreeRate = 0,
    compounding = true,
    frequency = 252,
    logReturns = false,
  } = {},
) {
  let returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns })
  validateMatrix('returns', returns)

  let marketReturns = null
  if (marketPrices) {
    marketReturns = returnsData
      ? marketPrices.map((row) => row[0])
      : returnsFromPricesImpl(marketPrices, { logReturns }).map((row) => row[0])
  } else {
    marketReturns = returns.map((row) => mean(row))
  }

  // Align on the latest common window when inputs have different lengths.
  const n = Math.min(returns.length, marketReturns.length)
  returns = returns.slice(-n)
  marketReturns = marketReturns.slice(-n)

  const mktMean = (() => {
    if (compounding) {
      let growth = 1
      for (const r of marketReturns) {
        growth *= 1 + r
      }
      return growth ** (frequency / marketReturns.length) - 1
    }
    return mean(marketReturns) * frequency
  })()

  const marketMean = mean(marketReturns)
  let mktVariance = 0
  for (const v of marketReturns) {
    const d = v - marketMean
    mktVariance += d * d
  }
  mktVariance /= Math.max(marketReturns.length - 1, 1)

  const cols = returns[0].length
  return Array.from({ length: cols }, (_, c) => {
    const asset = column(returns, c)
    const assetMean = mean(asset)
    let cov = 0
    for (let i = 0; i < asset.length; i += 1) {
      cov += (asset[i] - assetMean) * (marketReturns[i] - marketMean)
    }
    cov /= Math.max(asset.length - 1, 1)
    const beta = mktVariance === 0 ? 0 : cov / mktVariance
    return riskFreeRate + beta * (mktMean - riskFreeRate)
  })
}

function returnModelImpl(prices, { method = 'mean_historical_return', ...kwargs } = {}) {
  switch (method) {
    case 'mean_historical_return':
      return meanHistoricalReturnImpl(prices, kwargs)
    case 'ema_historical_return':
      return emaHistoricalReturnImpl(prices, kwargs)
    case 'capm_return':
      return capmReturnImpl(prices, kwargs)
    default:
      throw new Error(`return_model: method ${method} not implemented`)
  }
}

export function returnsFromPrices(prices, options = {}) {
  return returnsFromPricesImpl(prices, options)
}

export function pricesFromReturns(returns, options = {}) {
  return pricesFromReturnsImpl(returns, options)
}

export function returnModel(prices, options = {}) {
  return returnModelImpl(prices, options)
}

export function meanHistoricalReturn(prices, options = {}) {
  return meanHistoricalReturnImpl(prices, options)
}

export function emaHistoricalReturn(prices, options = {}) {
  return emaHistoricalReturnImpl(prices, options)
}

export function capmReturn(prices, options = {}) {
  return capmReturnImpl(prices, options)
}

// Python-style aliases
export const returns_from_prices = returnsFromPrices
export const prices_from_returns = pricesFromReturns
export const return_model = returnModel
export const mean_historical_return = meanHistoricalReturn
export const ema_historical_return = emaHistoricalReturn
export const capm_return = capmReturn

export function validateReturnsInput(data) {
  assertArray('data', data)
  if (data.length === 0) {
    throw new Error('returns input cannot be empty')
  }
}
