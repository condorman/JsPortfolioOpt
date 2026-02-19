export class BaseOptimizerAdapter {
  constructor(expectedReturns, covarianceOrReturns, { weightBounds = [0, 1] } = {}) {
    this.expectedReturns = expectedReturns
    this.data = covarianceOrReturns
    this.weightBounds = weightBounds
    this.weights = null
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
    throw new Error('portfolio_performance is not implemented yet in JS optimizer backend')
  }

  _notImplemented(name) {
    throw new Error(`${name} is not implemented yet in the pure JS optimizer backend`) 
  }
}
