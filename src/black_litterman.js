import { matVec, validateMatrix } from './_utils/math.js'

function normalizeMarketCaps(marketCaps, nAssets) {
  const entries = Array.isArray(marketCaps)
    ? marketCaps.map((v, i) => [i, v])
    : Object.entries(marketCaps)

  if (entries.length !== nAssets) {
    throw new Error('market_caps length must match number of assets')
  }
  const total = entries.reduce((acc, [, v]) => acc + v, 0)
  return entries.map(([, v]) => v / total)
}

export function marketImpliedPriorReturns(
  marketCaps,
  riskAversion,
  covMatrix,
  { riskFreeRate = 0 } = {},
) {
  validateMatrix('covMatrix', covMatrix)
  const weights = normalizeMarketCaps(marketCaps, covMatrix.length)
  const implied = matVec(covMatrix, weights)
  return implied.map((v) => riskAversion * v + riskFreeRate)
}

export function marketImpliedRiskAversion(
  marketPrices,
  { frequency = 252, riskFreeRate = 0 } = {},
) {
  if (!Array.isArray(marketPrices) || marketPrices.length < 2) {
    throw new Error('market_prices must contain at least 2 prices')
  }
  const returns = []
  for (let i = 1; i < marketPrices.length; i += 1) {
    returns.push(marketPrices[i] / marketPrices[i - 1] - 1)
  }
  const mean = returns.reduce((acc, v) => acc + v, 0) / returns.length
  const variance =
    returns.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(returns.length - 1, 1)
  return (mean * frequency - riskFreeRate) / (variance * frequency)
}

export class BlackLittermanModel {
  constructor(covMatrix, options = {}) {
    validateMatrix('covMatrix', covMatrix)
    this.covMatrix = covMatrix
    this.options = { ...options }
    this.weights = null
  }

  static defaultOmega(covMatrix, P, tau) {
    validateMatrix('covMatrix', covMatrix)
    validateMatrix('P', P)
    const out = Array.from({ length: P.length }, () => Array(P.length).fill(0))
    for (let i = 0; i < P.length; i += 1) {
      let variance = 0
      for (let j = 0; j < covMatrix.length; j += 1) {
        for (let k = 0; k < covMatrix.length; k += 1) {
          variance += P[i][j] * covMatrix[j][k] * P[i][k]
        }
      }
      out[i][i] = variance * tau
    }
    return out
  }

  static idzorekMethod(viewConfidences, covMatrix, pi, Q, P, tau) {
    validateMatrix('covMatrix', covMatrix)
    validateMatrix('P', P)
    const base = BlackLittermanModel.defaultOmega(covMatrix, P, tau)
    return base.map((row, i) =>
      row.map((v, j) => {
        if (i !== j) {
          return 0
        }
        const confidence = Array.isArray(viewConfidences) ? viewConfidences[i] : 0.5
        const safe = Math.min(Math.max(confidence, 1e-6), 1)
        return v * (1 - safe) / safe
      }),
    )
  }

  blReturns() {
    throw new Error('bl_returns is not implemented yet in JS optimizer backend')
  }

  blCov() {
    throw new Error('bl_cov is not implemented yet in JS optimizer backend')
  }

  blWeights() {
    throw new Error('bl_weights is not implemented yet in JS optimizer backend')
  }

  optimize() {
    throw new Error('optimize is not implemented yet in JS optimizer backend')
  }

  portfolioPerformance() {
    throw new Error('portfolio_performance is not implemented yet in JS optimizer backend')
  }

  // Python aliases
  static default_omega(...args) {
    return BlackLittermanModel.defaultOmega(...args)
  }

  static idzorek_method(...args) {
    return BlackLittermanModel.idzorekMethod(...args)
  }

  bl_returns(...args) {
    return this.blReturns(...args)
  }

  bl_cov(...args) {
    return this.blCov(...args)
  }

  bl_weights(...args) {
    return this.blWeights(...args)
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}

export const market_implied_prior_returns = marketImpliedPriorReturns
export const market_implied_risk_aversion = marketImpliedRiskAversion
