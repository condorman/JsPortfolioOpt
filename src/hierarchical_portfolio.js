import { dot } from './_utils/math.js'
import { portfolioReturn, portfolioVariance } from './objective_functions.js'

function covarianceFromReturns(returns, frequency = 252) {
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

function normalize(weights) {
  const sum = weights.reduce((acc, w) => acc + w, 0)
  if (sum === 0) {
    return Array.from({ length: weights.length }, () => 1 / weights.length)
  }
  return weights.map((w) => w / sum)
}

export class HRPOpt {
  constructor(returns = null, { covMatrix = null, tickers = null } = {}) {
    this.returns = returns
    this.covMatrix = covMatrix
    const nAssets = returns?.[0]?.length ?? covMatrix?.length ?? 0
    this.tickers = tickers ?? Array.from({ length: nAssets }, (_, i) => String(i))
    this.weights = null
  }

  optimize() {
    if (this.covMatrix == null) {
      if (!Array.isArray(this.returns) || this.returns.length === 0) {
        throw new Error('HRPOpt requires returns or covMatrix')
      }
      this.covMatrix = covarianceFromReturns(this.returns)
    }
    const invDiag = this.covMatrix.map((row, i) => {
      const v = row[i]
      return v > 1e-12 ? 1 / v : 0
    })
    const w = normalize(invDiag)
    this.weights = w
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, w[i]]))
  }

  portfolioPerformance({ riskFreeRate = 0, frequency = 252 } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires optimize() first')
    }
    const volatility = Math.sqrt(Math.max(portfolioVariance(this.weights, this.covMatrix), 0))
    if (!Array.isArray(this.returns) || this.returns.length === 0) {
      return [null, volatility, null]
    }
    const meanReturns = this.tickers.map((_, c) => {
      let acc = 0
      for (const row of this.returns) {
        acc += row[c]
      }
      return acc / this.returns.length
    })
    const annualReturn = portfolioReturn(this.weights, meanReturns, { negative: false }) * frequency
    const sharpe = volatility === 0 ? Number.POSITIVE_INFINITY : (annualReturn - riskFreeRate) / volatility
    return [annualReturn, volatility, sharpe]
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
