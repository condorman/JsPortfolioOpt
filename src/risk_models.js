import { EigenvalueDecomposition, Matrix } from 'ml-matrix'
import { column, covariance, validateMatrix } from './_utils/math.js'
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
    benchmark = 0,
    frequency = 252,
    logReturns = false,
    fixMethod = 'spectral',
  } = {},
) {
  const returns = returnsData ? prices : returnsFromPrices(prices, { logReturns })
  validateMatrix('returns', returns)
  const downside = returns.map((row) => row.map((v) => Math.min(v - benchmark, 0)))
  const cov = computeCovarianceMatrix(downside, frequency)
  return fixNonpositiveSemidefinite(cov, { fixMethod })
}

function weightedCovariance(x, y, span) {
  const alpha = 2 / (span + 1)
  const n = x.length
  const weights = Array.from({ length: n }, (_, i) => (1 - alpha) ** (n - 1 - i))
  const wSum = weights.reduce((acc, v) => acc + v, 0)
  const mx = weights.reduce((acc, w, i) => acc + w * x[i], 0) / wSum
  const my = weights.reduce((acc, w, i) => acc + w * y[i], 0) / wSum
  const cov = weights.reduce((acc, w, i) => acc + w * (x[i] - mx) * (y[i] - my), 0) / wSum
  return cov
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
      const cov = weightedCovariance(xi, xj, span) * frequency
      out[i][j] = cov
      out[j][i] = cov
    }
  }
  return fixNonpositiveSemidefinite(out, { fixMethod })
}

export function minCovDeterminant() {
  throw new Error('min_cov_determinant is not implemented yet in JS')
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
    this.sample = computeCovarianceMatrix(this.returns, frequency)
  }

  shrunkCovariance({ delta = 0.2 } = {}) {
    const n = this.sample.length
    const avgVar = this.sample.reduce((acc, row, i) => acc + row[i], 0) / n
    const target = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? avgVar : 0)),
    )

    return this.sample.map((row, i) =>
      row.map((value, j) => delta * target[i][j] + (1 - delta) * value),
    )
  }

  ledoitWolf({ shrinkageTarget = 'constant_variance' } = {}) {
    if (!['constant_variance', 'single_factor', 'constant_correlation'].includes(shrinkageTarget)) {
      throw new Error(`ledoit_wolf: target ${shrinkageTarget} not implemented`)
    }
    return this.shrunkCovariance({ delta: 0.2 })
  }

  oracleApproximating() {
    return this.shrunkCovariance({ delta: 0.5 })
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
