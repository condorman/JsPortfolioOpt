// Custom extension for jsportfolioopt (not part of PyPortfolioOpt public API).
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function validateReturnsMatrix(returns) {
  if (!Array.isArray(returns) || returns.length === 0 || !Array.isArray(returns[0])) {
    throw new TypeError('returns must be a non-empty 2D numeric array')
  }
  const nAssets = returns[0].length
  if (nAssets === 0) {
    throw new Error('returns must contain at least one asset column')
  }
  for (const row of returns) {
    if (!Array.isArray(row) || row.length !== nAssets) {
      throw new Error('returns must be a rectangular matrix')
    }
    if (!row.every(isFiniteNumber)) {
      throw new Error('returns contains non-finite values')
    }
  }
  return nAssets
}

function normalizeTickers(tickers, nAssets) {
  if (tickers == null) {
    return null
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error('tickers must be an array with one label per asset')
  }
  return tickers.map((ticker) => String(ticker))
}

function parseMu(mu, tickers, nAssets) {
  if (mu == null) {
    return null
  }
  if (Array.isArray(mu)) {
    if (mu.length !== nAssets || !mu.every(isFiniteNumber)) {
      throw new Error('mu must be a numeric array with one value per asset')
    }
    return mu.slice()
  }
  if (mu && typeof mu === 'object') {
    if (tickers == null) {
      throw new Error('mu as object requires tickers')
    }
    return tickers.map((ticker) => {
      const value = mu[ticker]
      if (!isFiniteNumber(value)) {
        throw new Error(`mu missing value for ticker ${ticker}`)
      }
      return value
    })
  }
  throw new TypeError('mu must be null, an array, or an object keyed by ticker')
}

function columnSampleVariance(matrix) {
  const nRows = matrix.length
  const nCols = matrix[0].length
  const means = Array.from({ length: nCols }, () => 0)
  for (const row of matrix) {
    for (let j = 0; j < nCols; j += 1) {
      means[j] += row[j]
    }
  }
  for (let j = 0; j < nCols; j += 1) {
    means[j] /= nRows
  }

  const variances = Array.from({ length: nCols }, () => 0)
  for (const row of matrix) {
    for (let j = 0; j < nCols; j += 1) {
      const d = row[j] - means[j]
      variances[j] += d * d
    }
  }

  const denom = Math.max(nRows - 1, 1)
  for (let j = 0; j < nCols; j += 1) {
    variances[j] /= denom
  }
  return variances
}

function replaceZerosWithSmallestPositive(values, fallback = 1e-6) {
  const positive = values.filter((v) => v > 0)
  const floor = positive.length > 0 ? Math.min(...positive) : fallback
  return values.map((v) => (v === 0 ? floor : v))
}

function normalizeWeights(weights) {
  const total = weights.reduce((acc, v) => acc + v, 0)
  if (!isFiniteNumber(total) || Math.abs(total) < 1e-16) {
    throw new Error('prior weights sum cannot be zero')
  }
  return weights.map((v) => v / total)
}

function equalWeighted(nAssets) {
  return Array.from({ length: nAssets }, () => 1 / nAssets)
}

function toOutput(vector, tickers) {
  if (tickers == null) {
    return vector.slice()
  }
  return Object.fromEntries(tickers.map((ticker, i) => [ticker, vector[i]]))
}

export function getPrior(
  returns,
  { mu = null, priorMethod = 'equal_weighted', priorBlendAlpha = 0.5, tickers = null } = {},
) {
  const nAssets = validateReturnsMatrix(returns)
  const normalizedTickers = normalizeTickers(tickers, nAssets)
  const muVector = parseMu(mu, normalizedTickers, nAssets)

  let weights

  if (priorMethod === 'risk_parity') {
    const variance = columnSampleVariance(returns)
    const vol = replaceZerosWithSmallestPositive(variance.map((v) => Math.sqrt(v)))
    weights = normalizeWeights(vol.map((v) => 1 / v))
  } else if (priorMethod === 'inverse_variance') {
    const variance = replaceZerosWithSmallestPositive(columnSampleVariance(returns))
    weights = normalizeWeights(variance.map((v) => 1 / v))
  } else if (priorMethod === 'momentum_positive') {
    if (muVector == null) {
      throw new Error("For 'momentum_positive' you must provide 'mu'")
    }
    const muPos = muVector.map((v) => Math.max(v, 0))
    const sumPos = muPos.reduce((acc, v) => acc + v, 0)
    weights = sumPos <= 0 ? equalWeighted(nAssets) : muPos.map((v) => v / sumPos)
  } else if (priorMethod === 'blend_eq_inv_vol') {
    const variance = columnSampleVariance(returns)
    const vol = replaceZerosWithSmallestPositive(variance.map((v) => Math.sqrt(v)))
    const invVol = normalizeWeights(vol.map((v) => 1 / v))
    const alpha = Math.min(Math.max(priorBlendAlpha, 0), 1)
    const eq = equalWeighted(nAssets)
    weights = eq.map((w, i) => alpha * w + (1 - alpha) * invVol[i])
  } else if (priorMethod === 'equal_weighted') {
    weights = equalWeighted(nAssets)
  } else {
    throw new Error(`Unsupported prior_method: ${priorMethod}`)
  }

  return toOutput(weights, normalizedTickers)
}
