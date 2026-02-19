import { portfolioReturn, portfolioVariance, sharpeRatio } from '../objective_functions.js'

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item))
  }
  if (value instanceof Map) {
    return new Map(Array.from(value.entries(), ([k, v]) => [k, cloneValue(v)]))
  }
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)]))
  }
  return value
}

function normalizeTickers(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => String(i))
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error('tickers must be an array with one label per asset')
  }
  return tickers.map((t) => String(t))
}

export class BaseOptimizerAdapter {
  constructor(expectedReturns, covarianceOrReturns, { weightBounds = [0, 1], tickers = null } = {}) {
    if (!Array.isArray(expectedReturns) || expectedReturns.length === 0) {
      throw new TypeError('expectedReturns must be a non-empty numeric array')
    }
    if (!expectedReturns.every(isFiniteNumber)) {
      throw new Error('expectedReturns contains non-finite values')
    }

    this.expectedReturns = expectedReturns.slice()
    this.nAssets = expectedReturns.length
    this.tickers = normalizeTickers(this.nAssets, tickers)
    this.data = covarianceOrReturns
    this.weightBounds = weightBounds
    this.weights = null
    this._additionalObjectives = []
    this._additionalConstraints = []
    this._parameters = new Map()
  }

  _mapVectorToWeights(vector) {
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, vector[i]]))
  }

  _mapWeightsToVector(weights) {
    if (Array.isArray(weights)) {
      if (weights.length !== this.nAssets) {
        throw new Error('weights array length mismatch')
      }
      return weights.slice()
    }
    if (weights && typeof weights === 'object') {
      return this.tickers.map((ticker) => {
        const value = weights[ticker]
        if (!isFiniteNumber(value)) {
          throw new Error(`missing or invalid weight for ticker ${ticker}`)
        }
        return value
      })
    }
    throw new TypeError('weights must be an array or an object keyed by ticker')
  }

  setWeights(weights) {
    this.weights = this._mapWeightsToVector(weights)
    return this._mapVectorToWeights(this.weights)
  }

  set_weights(weights) {
    return this.setWeights(weights)
  }

  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error('weights have not been set')
    }
    const cleaned = this.weights.map((w) => {
      const clipped = Math.abs(w) < cutoff ? 0 : w
      return Number(clipped.toFixed(rounding))
    })
    return this._mapVectorToWeights(cleaned)
  }

  clean_weights(options = {}) {
    return this.cleanWeights(options)
  }

  addObjective(objective, kwargs = {}) {
    if (typeof objective !== 'function') {
      throw new TypeError('objective must be a function')
    }
    this._additionalObjectives.push({ objective, kwargs })
  }

  add_objective(objective, kwargs = {}) {
    return this.addObjective(objective, kwargs)
  }

  addConstraint(constraint) {
    if (typeof constraint !== 'function') {
      throw new TypeError('constraint must be a function')
    }
    this._additionalConstraints.push(constraint)
  }

  add_constraint(constraint) {
    return this.addConstraint(constraint)
  }

  deepcopy() {
    const copy = Object.create(Object.getPrototypeOf(this))
    for (const [key, value] of Object.entries(this)) {
      copy[key] = cloneValue(value)
    }
    return copy
  }

  isParameterDefined(name) {
    return this._parameters.has(name)
  }

  updateParameterValue(name, value) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('parameter name must be a non-empty string')
    }
    if (!isFiniteNumber(value)) {
      throw new TypeError('parameter value must be a finite number')
    }
    this._parameters.set(name, value)
  }

  is_parameter_defined(...args) {
    return this.isParameterDefined(...args)
  }

  update_parameter_value(...args) {
    return this.updateParameterValue(...args)
  }

  _extraPenalty(weights) {
    let penalty = 0

    for (const { objective, kwargs } of this._additionalObjectives) {
      const value = objective(weights, kwargs)
      if (typeof value === 'number' && Number.isFinite(value)) {
        penalty += value
      }
    }

    for (const constraint of this._additionalConstraints) {
      const value = constraint(weights)
      if (typeof value === 'boolean') {
        if (!value) {
          penalty += 1e6
        }
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        // Constraint convention: g(w) <= 0 is feasible.
        penalty += Math.max(0, value) ** 2 * 1e4
      }
    }

    return penalty
  }

  portfolioPerformance({ riskFreeRate = 0 } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    const expectedReturn = portfolioReturn(this.weights, this.expectedReturns, { negative: false })
    const volatility = Math.sqrt(Math.max(portfolioVariance(this.weights, this.covMatrix), 0))
    const sharpe = sharpeRatio(this.weights, this.expectedReturns, this.covMatrix, {
      riskFreeRate,
      negative: false,
    })
    return [expectedReturn, volatility, sharpe]
  }

  portfolio_performance(options = {}) {
    return this.portfolioPerformance(options)
  }

  _notImplemented(name) {
    throw new Error(`${name} is not implemented yet in the pure JS optimizer backend`)
  }
}
