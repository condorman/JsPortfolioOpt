import { EfficientFrontier } from './efficient_frontier.js'
import { dot } from '../_utils/math.js'

function validateReturnsMatrix(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error('historicReturns must be a non-empty matrix')
  }
  const cols = historicReturns[0].length
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

function quantile(values, q) {
  const sorted = values.slice().sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))
  return sorted[idx]
}

export class EfficientCDaR extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix(historicReturns)
    const covProxy = covarianceFromReturns(historicReturns, options.frequency ?? 252)
    super(expectedReturns, covProxy, options)
    this.historicReturns = historicReturns
    this.beta = options.beta ?? 0.95
    this.frequency = options.frequency ?? 252
  }

  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights))
  }

  _cdar(weights) {
    const rets = this._portfolioReturns(weights)
    const cumulative = []
    let running = 0
    for (const r of rets) {
      running += r
      cumulative.push(running)
    }
    let maxSoFar = Number.NEGATIVE_INFINITY
    const drawdowns = cumulative.map((c) => {
      if (c > maxSoFar) {
        maxSoFar = c
      }
      return maxSoFar - c
    })
    const threshold = quantile(drawdowns, this.beta)
    const tail = drawdowns.filter((d) => d >= threshold)
    if (tail.length === 0) {
      return 0
    }
    return tail.reduce((acc, v) => acc + v, 0) / tail.length
  }

  minCdar({ marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }
    const result = this._optimize(this._penalized((w) => this._cdar(w)))
    this._targetSum = 1
    return result
  }

  efficientRisk(targetCdar, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }
    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const cdar = this._cdar(w)
        const penalty = Math.max(0, cdar - targetCdar) ** 2 * penaltyScale
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
        return this._cdar(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  portfolioPerformance() {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    return [this._portfolioReturn(this.weights), this._cdar(this.weights)]
  }

  min_cdar(...args) {
    return this.minCdar(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }
}
