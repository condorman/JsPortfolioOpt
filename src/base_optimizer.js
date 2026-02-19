function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeTickers(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => i)
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error('tickers must be an array with one label per asset')
  }
  return tickers.slice()
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

export class BaseOptimizer {
  constructor(nAssets, tickers = null) {
    if (!Number.isInteger(nAssets) || nAssets <= 0) {
      throw new Error('nAssets must be a positive integer')
    }
    this.nAssets = nAssets
    this.tickers = normalizeTickers(nAssets, tickers)
    this._riskFreeRate = null
    this.weights = null
  }

  _makeOutputWeights(weights = null) {
    const vector = weights ?? this.weights
    if (!Array.isArray(vector) || vector.length !== this.nAssets) {
      throw new Error('weights are not set')
    }
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, Number(vector[i])]))
  }

  setWeights(inputWeights) {
    if (!inputWeights || typeof inputWeights !== 'object') {
      throw new TypeError('inputWeights must be an object keyed by ticker')
    }
    this.weights = this.tickers.map((ticker) => {
      const value = inputWeights[ticker]
      if (!isFiniteNumber(value)) {
        throw new Error(`missing or invalid weight for ticker ${ticker}`)
      }
      return value
    })
    // Match PyPortfolioOpt behavior: this method mutates state and returns nothing.
    return undefined
  }

  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error('weights have not been set')
    }
    if (rounding != null && (!Number.isInteger(rounding) || rounding < 1)) {
      throw new Error('rounding must be a positive integer')
    }
    const cleaned = this.weights.map((weight) => {
      const clipped = Math.abs(weight) < cutoff ? 0 : weight
      return rounding == null ? clipped : Number(clipped.toFixed(rounding))
    })
    return this._makeOutputWeights(cleaned)
  }

  set_weights(...args) {
    return this.setWeights(...args)
  }

  clean_weights(...args) {
    return this.cleanWeights(...args)
  }
}

export class BaseConvexOptimizer extends BaseOptimizer {
  constructor(
    nAssets,
    tickers = null,
    {
      weightBounds = [0, 1],
      solver = null,
      verbose = false,
      solverOptions = null,
    } = {},
  ) {
    super(nAssets, tickers)
    this._additionalObjectives = []
    this._constraints = []
    this._parameters = new Map()
    this._solver = solver
    this._verbose = verbose
    this._solverOptions = solverOptions ?? {}
    this._mapBoundsToConstraints(weightBounds)
  }

  _mapBoundsToConstraints(weightBounds) {
    let lower
    let upper
    if (
      Array.isArray(weightBounds) &&
      weightBounds.length === this.nAssets &&
      Array.isArray(weightBounds[0])
    ) {
      lower = weightBounds.map((pair) => (pair[0] == null ? -1 : pair[0]))
      upper = weightBounds.map((pair) => (pair[1] == null ? 1 : pair[1]))
    } else if (Array.isArray(weightBounds) && weightBounds.length === 2) {
      const lb = weightBounds[0] == null ? -1 : weightBounds[0]
      const ub = weightBounds[1] == null ? 1 : weightBounds[1]
      lower = Array.from({ length: this.nAssets }, () => lb)
      upper = Array.from({ length: this.nAssets }, () => ub)
    } else {
      throw new TypeError('weightBounds must be [lb, ub] or per-asset [[lb, ub], ...]')
    }
    this._lowerBounds = lower
    this._upperBounds = upper

    // Keep parity with Python's default two bound constraints.
    this.addConstraint(() => true)
    this.addConstraint(() => true)
  }

  deepcopy() {
    const copy = Object.create(Object.getPrototypeOf(this))
    for (const [key, value] of Object.entries(this)) {
      copy[key] = cloneValue(value)
    }
    return copy
  }

  addObjective(objective, kwargs = {}) {
    if (typeof objective !== 'function') {
      throw new TypeError('objective must be a function')
    }
    this._additionalObjectives.push({ objective, kwargs })
  }

  addConstraint(constraint) {
    if (typeof constraint !== 'function') {
      throw new TypeError('constraint must be a function')
    }
    this._constraints.push(constraint)
  }

  isParameterDefined(parameterName) {
    return this._parameters.has(parameterName)
  }

  updateParameterValue(parameterName, newValue) {
    if (typeof parameterName !== 'string' || parameterName.length === 0) {
      throw new TypeError('parameterName must be a non-empty string')
    }
    if (!isFiniteNumber(newValue)) {
      throw new TypeError('newValue must be a finite number')
    }
    this._parameters.set(parameterName, newValue)
  }

  add_objective(...args) {
    return this.addObjective(...args)
  }

  add_constraint(...args) {
    return this.addConstraint(...args)
  }

  is_parameter_defined(...args) {
    return this.isParameterDefined(...args)
  }

  update_parameter_value(...args) {
    return this.updateParameterValue(...args)
  }
}
