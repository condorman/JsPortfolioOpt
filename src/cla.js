export class CLA {
  constructor(expectedReturns, covMatrix, { weightBounds = [0, 1] } = {}) {
    this.expectedReturns = expectedReturns
    this.covMatrix = covMatrix
    this.weightBounds = weightBounds
    this.weights = null
  }

  maxSharpe() {
    throw new Error('CLA.max_sharpe is not implemented yet in pure JS backend')
  }

  minVolatility() {
    throw new Error('CLA.min_volatility is not implemented yet in pure JS backend')
  }

  efficientFrontier() {
    throw new Error('CLA.efficient_frontier is not implemented yet in pure JS backend')
  }

  setWeights(weights) {
    this.weights = Array.isArray(weights) ? weights.slice() : { ...weights }
    return this.weights
  }

  cleanWeights() {
    if (this.weights == null) {
      throw new Error('weights have not been set')
    }
    return this.weights
  }

  portfolioPerformance() {
    throw new Error('CLA.portfolio_performance is not implemented yet in pure JS backend')
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
