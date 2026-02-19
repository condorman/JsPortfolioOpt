import { dot, matVec, validateMatrix } from './_utils/math.js'

function asArray(name, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`)
  }
  return value
}

export function portfolioVariance(weights, covMatrix) {
  const w = asArray('weights', weights)
  validateMatrix('covMatrix', covMatrix)
  const cw = matVec(covMatrix, w)
  return dot(w, cw)
}

export function portfolioReturn(weights, expectedReturns, { negative = true } = {}) {
  const w = asArray('weights', weights)
  const mu = asArray('expectedReturns', expectedReturns)
  const ret = dot(w, mu)
  return negative ? -ret : ret
}

export function sharpeRatio(
  weights,
  expectedReturns,
  covMatrix,
  { riskFreeRate = 0, negative = true } = {},
) {
  const mu = portfolioReturn(weights, expectedReturns, { negative: false })
  const sigma = Math.sqrt(Math.max(portfolioVariance(weights, covMatrix), 0))
  if (sigma === 0) {
    return negative ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  }
  const sr = (mu - riskFreeRate) / sigma
  return negative ? -sr : sr
}

export function L2Reg(weights, { gamma = 1 } = {}) {
  const w = asArray('weights', weights)
  let sum = 0
  for (const x of w) {
    sum += x * x
  }
  return gamma * sum
}

export function quadraticUtility(
  weights,
  expectedReturns,
  covMatrix,
  { riskAversion = 1, negative = true } = {},
) {
  const mu = portfolioReturn(weights, expectedReturns, { negative: false })
  const variance = portfolioVariance(weights, covMatrix)
  const value = mu - 0.5 * riskAversion * variance
  return negative ? -value : value
}

export function transactionCost(weights, previousWeights, { k = 0.001 } = {}) {
  const w = asArray('weights', weights)
  const wp = asArray('previousWeights', previousWeights)
  if (w.length !== wp.length) {
    throw new Error('weights and previousWeights must have same length')
  }
  let turnover = 0
  for (let i = 0; i < w.length; i += 1) {
    turnover += Math.abs(w[i] - wp[i])
  }
  return k * turnover
}

export function exAnteTrackingError(weights, covMatrix, benchmarkWeights) {
  const w = asArray('weights', weights)
  const b = asArray('benchmarkWeights', benchmarkWeights)
  if (w.length !== b.length) {
    throw new Error('weights and benchmarkWeights must have same length')
  }
  const diff = w.map((v, i) => v - b[i])
  return Math.sqrt(Math.max(portfolioVariance(diff, covMatrix), 0))
}

export function exPostTrackingError(weights, historicReturns, benchmarkReturns) {
  const w = asArray('weights', weights)
  validateMatrix('historicReturns', historicReturns)
  const bm = asArray('benchmarkReturns', benchmarkReturns)
  if (historicReturns.length !== bm.length) {
    throw new Error('historicReturns and benchmarkReturns lengths must match')
  }

  const activeReturns = historicReturns.map((row, i) => dot(row, w) - bm[i])
  const mean = activeReturns.reduce((acc, v) => acc + v, 0) / activeReturns.length
  const variance =
    activeReturns.reduce((acc, v) => {
      const d = v - mean
      return acc + d * d
    }, 0) / Math.max(activeReturns.length - 1, 1)
  return Math.sqrt(Math.max(variance, 0))
}

// Python-style aliases
export const portfolio_variance = portfolioVariance
export const portfolio_return = portfolioReturn
export const sharpe_ratio = sharpeRatio
export const L2_reg = L2Reg
export const quadratic_utility = quadraticUtility
export const transaction_cost = transactionCost
export const ex_ante_tracking_error = exAnteTrackingError
export const ex_post_tracking_error = exPostTrackingError
