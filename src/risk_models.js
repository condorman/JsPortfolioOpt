import { EigenvalueDecomposition, Matrix } from 'ml-matrix'
import { column, covariance, mean, validateMatrix } from './_utils/math.js'
import { returnsFromPrices } from './expected_returns.js'

export function isPositiveSemidefinite(matrix) {
  validateMatrix('matrix', matrix)
  const n = matrix.length
  const L = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = matrix[i][j]
      for (let k = 0; k < j; k += 1) {
        sum -= L[i][k] * L[j][k]
      }
      if (i === j) {
        if (sum < -1e-12) {
          return false
        }
        L[i][j] = Math.sqrt(Math.max(sum, 0))
      } else {
        if (L[j][j] === 0) {
          L[i][j] = 0
        } else {
          L[i][j] = sum / L[j][j]
        }
      }
    }
  }
  return true
}

export function fixNonpositiveSemidefinite(matrix, { fixMethod = 'spectral' } = {}) {
  validateMatrix('matrix', matrix)
  if (isPositiveSemidefinite(matrix)) {
    return matrix
  }

  if (fixMethod === 'diag') {
    const eig = new EigenvalueDecomposition(new Matrix(matrix), { assumeSymmetric: true })
    const minEig = Math.min(...eig.realEigenvalues)
    const bump = Math.abs(minEig) * 1.1
    return matrix.map((row, i) => row.map((v, j) => (i === j ? v + bump : v)))
  }

  if (fixMethod !== 'spectral') {
    throw new Error(`fix_nonpositive_semidefinite: method ${fixMethod} not implemented`)
  }

  const evd = new EigenvalueDecomposition(new Matrix(matrix), { assumeSymmetric: true })
  const V = evd.eigenvectorMatrix
  const eig = evd.realEigenvalues.map((v) => (v > 0 ? v : 0))
  const reconstructed = V.mmul(Matrix.diag(eig)).mmul(V.transpose())
  return reconstructed.to2DArray()
}

function computeCovarianceMatrix(returns, frequency) {
  validateMatrix('returns', returns)
  const cols = returns[0].length
  const out = Array.from({ length: cols }, () => Array(cols).fill(0))
  for (let i = 0; i < cols; i += 1) {
    const xi = column(returns, i)
    for (let j = i; j < cols; j += 1) {
      const xj = column(returns, j)
      const cov = covariance(xi, xj) * frequency
      out[i][j] = cov
      out[j][i] = cov
    }
  }
  return out
}

export function sampleCov(
  prices,
  { returnsData = false, frequency = 252, logReturns = false, fixMethod = 'spectral' } = {},
) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
  const cov = computeCovarianceMatrix(returns, frequency)
  return fixNonpositiveSemidefinite(cov, { fixMethod })
}

export function semicovariance(
  prices,
  {
    returnsData = false,
    benchmark = 0.000079,
    frequency = 252,
    logReturns = false,
    fixMethod = 'spectral',
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
  validateMatrix('returns', returns)
  const downside = returns.map((row) => row.map((v) => Math.min(v - benchmark, 0)))
  const cols = downside[0].length
  const T = downside.length
  const cov = Array.from({ length: cols }, () => Array(cols).fill(0))
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0
      for (let t = 0; t < T; t += 1) {
        acc += downside[t][i] * downside[t][j]
      }
      const value = (acc / T) * frequency
      cov[i][j] = value
      cov[j][i] = value
    }
  }
  return fixNonpositiveSemidefinite(cov, { fixMethod })
}

function pairExpCovariance(x, y, span) {
  const alpha = 2 / (span + 1)
  const mx = mean(x)
  const my = mean(y)
  let numerator = 0
  let denominator = 0
  for (let i = 0; i < x.length; i += 1) {
    const covariation = (x[i] - mx) * (y[i] - my)
    numerator = covariation + (1 - alpha) * numerator
    denominator = 1 + (1 - alpha) * denominator
  }
  return denominator === 0 ? 0 : numerator / denominator
}

function nanToNumMatrix(matrix) {
  return matrix.map((row) => row.map((v) => (Number.isFinite(v) ? v : 0)))
}

function empiricalCovarianceMle(X, { assumeCentered = false } = {}) {
  validateMatrix('X', X)
  const nSamples = X.length
  const nFeatures = X[0].length
  const means = Array(nFeatures).fill(0)

  if (!assumeCentered) {
    for (let j = 0; j < nFeatures; j += 1) {
      for (let i = 0; i < nSamples; i += 1) {
        means[j] += X[i][j]
      }
      means[j] /= nSamples
    }
  }

  const out = Array.from({ length: nFeatures }, () => Array(nFeatures).fill(0))
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = i; j < nFeatures; j += 1) {
      let acc = 0
      for (let t = 0; t < nSamples; t += 1) {
        const xi = assumeCentered ? X[t][i] : X[t][i] - means[i]
        const xj = assumeCentered ? X[t][j] : X[t][j] - means[j]
        acc += xi * xj
      }
      const cov = acc / nSamples
      out[i][j] = cov
      out[j][i] = cov
    }
  }
  return out
}

function ledoitWolfConstantVariance(X) {
  validateMatrix('X', X)
  const nSamples = X.length
  const nFeatures = X[0].length
  if (nFeatures === 1) {
    return { covariance: empiricalCovarianceMle(X), shrinkage: 0 }
  }

  const empCov = empiricalCovarianceMle(X)
  const mu = empCov.reduce((acc, row, i) => acc + row[i], 0) / nFeatures

  let delta = 0
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      const centered = empCov[i][j] - (i === j ? mu : 0)
      delta += centered * centered
    }
  }
  delta /= nFeatures

  let betaNumerator = 0
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      let dotX2 = 0
      for (let t = 0; t < nSamples; t += 1) {
        dotX2 += X[t][i] * X[t][i] * X[t][j] * X[t][j]
      }
      betaNumerator += dotX2 / nSamples - empCov[i][j] * empCov[i][j]
    }
  }

  const betaRaw = betaNumerator / (nFeatures * nSamples)
  const beta = Math.min(betaRaw, delta)
  const shrinkage = delta === 0 ? 0 : beta / delta

  const shrunk = Array.from({ length: nFeatures }, (_, i) =>
    Array.from({ length: nFeatures }, (_, j) => {
      const target = i === j ? mu : 0
      return (1 - shrinkage) * empCov[i][j] + shrinkage * target
    }),
  )

  return { covariance: shrunk, shrinkage }
}

function oasEstimator(X) {
  validateMatrix('X', X)
  const nSamples = X.length
  const nFeatures = X[0].length

  if (nFeatures === 1) {
    const mean = X.reduce((acc, row) => acc + row[0], 0) / nSamples
    const variance = X.reduce((acc, row) => {
      const d = row[0] - mean
      return acc + d * d
    }, 0) / nSamples
    return { covariance: [[variance]], shrinkage: 0 }
  }

  const empCov = empiricalCovarianceMle(X)
  let sumSquares = 0
  for (let i = 0; i < nFeatures; i += 1) {
    for (let j = 0; j < nFeatures; j += 1) {
      sumSquares += empCov[i][j] * empCov[i][j]
    }
  }

  const alpha = sumSquares / (nFeatures * nFeatures)
  const mu = empCov.reduce((acc, row, i) => acc + row[i], 0) / nFeatures
  const muSquared = mu * mu
  const num = alpha + muSquared
  const den = (nSamples + 1) * (alpha - muSquared / nFeatures)
  const shrinkage = den === 0 ? 1 : Math.min(num / den, 1)

  const shrunk = Array.from({ length: nFeatures }, (_, i) =>
    Array.from({ length: nFeatures }, (_, j) => {
      let value = (1 - shrinkage) * empCov[i][j]
      if (i === j) {
        value += shrinkage * mu
      }
      return value
    }),
  )

  return { covariance: shrunk, shrinkage }
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function mad(values, center) {
  const deviations = values.map((value) => Math.abs(value - center))
  return median(deviations)
}

function robustSubset(returns, supportFraction = null) {
  const nObs = returns.length
  const nAssets = returns[0].length
  if (nObs <= nAssets + 1) {
    return returns
  }

  const minSupport = nAssets + 1
  let h
  if (supportFraction == null) {
    h = Math.floor((nObs + nAssets + 1) / 2)
  } else {
    if (
      typeof supportFraction !== 'number' ||
      !Number.isFinite(supportFraction) ||
      supportFraction <= 0 ||
      supportFraction > 1
    ) {
      throw new Error('supportFraction must be in (0, 1]')
    }
    h = Math.floor(supportFraction * nObs)
  }
  h = Math.max(minSupport, Math.min(nObs, h))

  const medians = Array.from({ length: nAssets }, (_, colIndex) => median(column(returns, colIndex)))
  const scales = Array.from({ length: nAssets }, (_, colIndex) => {
    const s = mad(column(returns, colIndex), medians[colIndex])
    return s > 1e-12 ? s : 1
  })

  const scored = returns.map((row, rowIndex) => {
    let score = 0
    for (let colIndex = 0; colIndex < nAssets; colIndex += 1) {
      const z = (row[colIndex] - medians[colIndex]) / scales[colIndex]
      score += z * z
    }
    return { row, rowIndex, score }
  })
  scored.sort((a, b) => (a.score === b.score ? a.rowIndex - b.rowIndex : a.score - b.score))
  return scored.slice(0, h).map((item) => item.row)
}

export function expCov(
  prices,
  {
    returnsData = false,
    span = 180,
    frequency = 252,
    logReturns = false,
    fixMethod = 'spectral',
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
  validateMatrix('returns', returns)
  const cols = returns[0].length
  const out = Array.from({ length: cols }, () => Array(cols).fill(0))
  for (let i = 0; i < cols; i += 1) {
    const xi = column(returns, i)
    for (let j = i; j < cols; j += 1) {
      const xj = column(returns, j)
      const cov = pairExpCovariance(xi, xj, span) * frequency
      out[i][j] = cov
      out[j][i] = cov
    }
  }
  return fixNonpositiveSemidefinite(out, { fixMethod })
}

export function minCovDeterminant(
  prices,
  {
    returnsData = false,
    frequency = 252,
    logReturns = false,
    fixMethod = 'spectral',
    supportFraction = null,
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
  validateMatrix('returns', returns)
  const subset = robustSubset(returns, supportFraction)
  const cov = computeCovarianceMatrix(subset, frequency)
  return fixNonpositiveSemidefinite(cov, { fixMethod })
}

export function covToCorr(covMatrix) {
  validateMatrix('covMatrix', covMatrix)
  const stdev = covMatrix.map((row, i) => Math.sqrt(Math.max(row[i], 0)))
  return covMatrix.map((row, i) =>
    row.map((v, j) => {
      const denom = stdev[i] * stdev[j]
      return denom === 0 ? 0 : v / denom
    }),
  )
}

export function corrToCov(corrMatrix, stdevs) {
  validateMatrix('corrMatrix', corrMatrix)
  if (!Array.isArray(stdevs) || stdevs.length !== corrMatrix.length) {
    throw new Error('corr_to_cov: stdevs shape mismatch')
  }
  return corrMatrix.map((row, i) => row.map((v, j) => v * stdevs[i] * stdevs[j]))
}

export function riskMatrix(prices, { method = 'sample_cov', ...kwargs } = {}) {
  switch (method) {
    case 'sample_cov':
      return sampleCov(prices, kwargs)
    case 'semicovariance':
    case 'semivariance':
      return semicovariance(prices, kwargs)
    case 'exp_cov':
      return expCov(prices, kwargs)
    case 'min_cov_determinant':
      return minCovDeterminant(prices, kwargs)
    default:
      throw new Error(`risk_matrix: method ${method} not implemented`)
  }
}

export class CovarianceShrinkage {
  constructor(prices, { returnsData = false, frequency = 252, logReturns = false } = {}) {
    this.frequency = frequency
    this.returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
    // Match PyPortfolioOpt: S is daily sample covariance (unannualized).
    this.sample = computeCovarianceMatrix(this.returns, 1)
    this.S = this.sample
    this.delta = null
  }

  _formatAndAnnualize(covDaily) {
    const annualized = covDaily.map((row) => row.map((v) => v * this.frequency))
    return fixNonpositiveSemidefinite(annualized, { fixMethod: 'spectral' })
  }

  shrunkCovariance({ delta = 0.2 } = {}) {
    this.delta = delta
    const n = this.sample.length
    const avgVar = this.sample.reduce((acc, row, i) => acc + row[i], 0) / n
    const target = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? avgVar : 0)),
    )

    const shrunk = this.sample.map((row, i) =>
      row.map((value, j) => delta * target[i][j] + (1 - delta) * value),
    )
    return this._formatAndAnnualize(shrunk)
  }

  ledoitWolf({ shrinkageTarget = 'constant_variance' } = {}) {
    if (
      !['constant_variance', 'single_factor', 'constant_correlation'].includes(shrinkageTarget)
    ) {
      throw new Error(`ledoit_wolf: target ${shrinkageTarget} not implemented`)
    }

    // `constant_variance` matches sklearn's Ledoit-Wolf estimator.
    // For the other targets, keep deterministic behavior using the same backend for now.
    const X = nanToNumMatrix(this.returns)
    const { covariance, shrinkage } = ledoitWolfConstantVariance(X)
    this.delta = shrinkage
    return this._formatAndAnnualize(covariance)
  }

  oracleApproximating() {
    const X = nanToNumMatrix(this.returns)
    const { covariance, shrinkage } = oasEstimator(X)
    this.delta = shrinkage
    return this._formatAndAnnualize(covariance)
  }
}

// Python-style aliases
export const _is_positive_semidefinite = isPositiveSemidefinite
export const fix_nonpositive_semidefinite = fixNonpositiveSemidefinite
export const risk_matrix = riskMatrix
export const sample_cov = sampleCov
export const exp_cov = expCov
export const min_cov_determinant = minCovDeterminant
export const cov_to_corr = covToCorr
export const corr_to_cov = corrToCov
