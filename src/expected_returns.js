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

  const out = Array.from({ length: rows + 1 }, () => Array(cols).fill(1))
  for (let r = 1; r < rows + 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ret = returns[r - 1][c]
      const growth = logReturns ? Math.exp(ret) : 1 + ret
      out[r][c] = out[r - 1][c] * growth
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
    const mu = mean(assetReturns)
    return annualize(mu, frequency, compounding)
  })
}

function ema(values, span) {
  const alpha = 2 / (span + 1)
  let e = values[0]
  for (let i = 1; i < values.length; i += 1) {
    e = alpha * values[i] + (1 - alpha) * e
  }
  return e
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
    const mu = ema(assetReturns, span)
    return annualize(mu, frequency, compounding)
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
  const returns = returnsData ? prices : returnsFromPricesImpl(prices, { logReturns })
  validateMatrix('returns', returns)

  const marketReturns = marketPrices
    ? returnsFromPricesImpl(marketPrices, { logReturns }).map((row) => row[0])
    : returns.map((row) => mean(row))

  const mktMean = annualize(mean(marketReturns), frequency, compounding)

  const mktVariance = (() => {
    const m = mean(marketReturns)
    let acc = 0
    for (const v of marketReturns) {
      const d = v - m
      acc += d * d
    }
    return acc / Math.max(marketReturns.length - 1, 1)
  })()

  const cols = returns[0].length
  return Array.from({ length: cols }, (_, c) => {
    const asset = column(returns, c)
    const assetMean = mean(asset)
    let cov = 0
    for (let i = 0; i < asset.length; i += 1) {
      cov += (asset[i] - assetMean) * (marketReturns[i] - mean(marketReturns))
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
