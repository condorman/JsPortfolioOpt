import { EfficientFrontier } from './efficient_frontier.js'
import { dot } from '../_utils/math.js'

function validateReturnsMatrix(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error('historicReturns must be a non-empty matrix')
  }
  const cols = historicReturns[0].length
  if (cols === 0) {
    throw new Error('historicReturns cannot have empty rows')
  }
  for (const row of historicReturns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error('historicReturns rows must have equal length')
    }
  }
}

function covarianceFromReturns(returns, frequency) {
  const cols = returns[0].length
  const out = Array.from({ length: cols }, () => Array(cols).fill(0))
  const mean = Array.from({ length: cols }, (_, c) => {
    let acc = 0
    for (const row of returns) {
      acc += row[c]
    }
    return acc / returns.length
  })
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0
      for (const row of returns) {
        acc += (row[i] - mean[i]) * (row[j] - mean[j])
      }
      const cov = (acc / Math.max(returns.length - 1, 1)) * frequency
      out[i][j] = cov
      out[j][i] = cov
    }
  }
  return out
}

function semideviation(portfolioReturns, benchmark = 0) {
  const downside = portfolioReturns.map((r) => Math.min(r - benchmark, 0))
  const variance = downside.reduce((acc, d) => acc + d * d, 0) / Math.max(portfolioReturns.length, 1)
  return Math.sqrt(Math.max(variance, 0))
}

export class EfficientSemivariance extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix(historicReturns)
    const covProxy = covarianceFromReturns(historicReturns, options.frequency ?? 252)
    super(expectedReturns, covProxy, options)
    this.historicReturns = historicReturns
    this.benchmark = options.benchmark ?? 0
    this.frequency = options.frequency ?? 252
  }

  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights))
  }

  _semivariance(weights) {
    const rets = this._portfolioReturns(weights)
    const semi = semideviation(rets, this.benchmark)
    return semi * semi * this.frequency
  }

  minSemivariance({ marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }
    const result = this._optimize(this._penalized((w) => this._semivariance(w)))
    this._targetSum = 1
    return result
  }

  efficientRisk(targetSemideviation, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }

    // If the max-return portfolio is already within the downside-risk cap,
    // the constrained optimum is exactly max-return.
    const maxRetWeightsByTicker = this.maxReturn()
    const candidate = this.tickers.map((ticker) => maxRetWeightsByTicker[ticker])
    const candidateSemi = Math.sqrt(Math.max(this._semivariance(candidate), 0))
    if (candidateSemi <= targetSemideviation + 1e-10) {
      this.weights = candidate
      this._targetSum = 1
      return this._mapVectorToWeights(this.weights)
    }

    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const semi = Math.sqrt(Math.max(this._semivariance(w), 0))
        const penalty = Math.max(0, semi - targetSemideviation) ** 2 * penaltyScale
        return -this._portfolioReturn(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }
    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale
        return this._semivariance(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  portfolioPerformance({ riskFreeRate = 0 } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    const ret = this._portfolioReturn(this.weights)
    const semiDev = Math.sqrt(Math.max(this._semivariance(this.weights), 0))
    const sortino = semiDev === 0 ? Number.POSITIVE_INFINITY : (ret - riskFreeRate) / semiDev
    return [ret, semiDev, sortino]
  }

  // Python alias
  min_semivariance(...args) {
    return this.minSemivariance(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }
}
