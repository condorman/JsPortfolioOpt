import { BaseOptimizerAdapter } from './_base.js'

export class EfficientFrontier extends BaseOptimizerAdapter {
  minVolatility() {
    return this._notImplemented('min_volatility')
  }

  maxSharpe() {
    return this._notImplemented('max_sharpe')
  }

  maxQuadraticUtility() {
    return this._notImplemented('max_quadratic_utility')
  }

  efficientRisk() {
    return this._notImplemented('efficient_risk')
  }

  efficientReturn() {
    return this._notImplemented('efficient_return')
  }

  // Python-style aliases
  min_volatility(...args) {
    return this.minVolatility(...args)
  }

  max_sharpe(...args) {
    return this.maxSharpe(...args)
  }

  max_quadratic_utility(...args) {
    return this.maxQuadraticUtility(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
