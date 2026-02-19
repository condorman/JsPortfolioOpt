import { EfficientFrontier } from './efficient_frontier/efficient_frontier.js'

function linspace(start, end, points) {
  if (points <= 1) {
    return [start]
  }
  const step = (end - start) / (points - 1)
  return Array.from({ length: points }, (_, i) => start + i * step)
}

export class CLA {
  constructor(expectedReturns, covMatrix, { weightBounds = [0, 1], tickers = null } = {}) {
    this.expectedReturns = expectedReturns
    this.covMatrix = covMatrix
    this.weightBounds = weightBounds
    this.weights = null
    this.ef = new EfficientFrontier(expectedReturns, covMatrix, { weightBounds, tickers })
    this.tickers = this.ef.tickers
  }

  _syncFromEf() {
    this.weights = this.ef.weights ? this.ef.weights.slice() : null
  }

  maxSharpe(options = {}) {
    const result = this.ef.maxSharpe(options)
    this._syncFromEf()
    return result
  }

  minVolatility(options = {}) {
    const result = this.ef.minVolatility(options)
    this._syncFromEf()
    return result
  }

  efficientFrontier({ points = 50 } = {}) {
    const minPoint = this.minVolatility()
    const [minRet] = this.portfolioPerformance()
    const maxPoint = this.maxSharpe()
    const [maxRet] = this.portfolioPerformance()
    const targets = linspace(minRet, maxRet, points)
    const frontier = []

    for (const target of targets) {
      this.ef.efficientReturn(target)
      this._syncFromEf()
      const [ret, vol, sharpe] = this.portfolioPerformance()
      frontier.push({ targetReturn: target, return: ret, volatility: vol, sharpe, weights: this.cleanWeights() })
    }

    this.setWeights(minPoint)
    this._max_sharpe_weights = maxPoint
    return frontier
  }

  setWeights(weights) {
    const result = this.ef.setWeights(weights)
    this._syncFromEf()
    return result
  }

  cleanWeights(options = {}) {
    return this.ef.cleanWeights(options)
  }

  portfolioPerformance(options = {}) {
    return this.ef.portfolioPerformance(options)
  }

  max_sharpe(...args) {
    return this.maxSharpe(...args)
  }

  min_volatility(...args) {
    return this.minVolatility(...args)
  }

  efficient_frontier(...args) {
    return this.efficientFrontier(...args)
  }

  set_weights(...args) {
    return this.setWeights(...args)
  }

  clean_weights(...args) {
    return this.cleanWeights(...args)
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
