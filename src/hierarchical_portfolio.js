export class HRPOpt {
  constructor(returns = null, { covMatrix = null } = {}) {
    this.returns = returns
    this.covMatrix = covMatrix
    this.weights = null
  }

  optimize() {
    throw new Error('HRPOpt.optimize is not implemented yet in pure JS backend')
  }

  portfolioPerformance() {
    throw new Error('HRPOpt.portfolio_performance is not implemented yet in pure JS backend')
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
