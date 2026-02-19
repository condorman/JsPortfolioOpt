import { Matrix, inverse, pseudoInverse } from 'ml-matrix'
import { dot, matVec, validateMatrix } from './_utils/math.js'

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeTickers(nAssets, tickers) {
  if (tickers == null) {
    return Array.from({ length: nAssets }, (_, i) => String(i))
  }
  if (!Array.isArray(tickers) || tickers.length !== nAssets) {
    throw new Error('tickers must be an array with one label per asset')
  }
  return tickers.map((ticker) => String(ticker))
}

function ensureSquareMatrix(name, matrix) {
  validateMatrix(name, matrix)
  if (matrix.length !== matrix[0].length) {
    throw new Error(`${name} must be square`)
  }
}

function normalizeMarketCaps(marketCaps, nAssets, tickers = null) {
  let values
  if (Array.isArray(marketCaps)) {
    values = marketCaps.slice()
  } else if (marketCaps && typeof marketCaps === 'object') {
    if (Array.isArray(tickers)) {
      values = tickers.map((ticker) => {
        const value = marketCaps[ticker]
        if (!isFiniteNumber(value)) {
          throw new Error(`marketCaps missing value for ticker ${ticker}`)
        }
        return value
      })
    } else {
      values = Object.values(marketCaps)
    }
  } else {
    throw new TypeError('marketCaps must be an array or object')
  }

  if (values.length !== nAssets) {
    throw new Error('market_caps length must match number of assets')
  }
  if (!values.every(isFiniteNumber)) {
    throw new Error('marketCaps contains non-finite values')
  }
  const total = values.reduce((acc, value) => acc + value, 0)
  if (Math.abs(total) < 1e-16) {
    throw new Error('marketCaps sum cannot be zero')
  }
  return values.map((value) => value / total)
}

function toVector(name, value, expectedLength = null) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`)
  }
  let vector
  if (value.length > 0 && Array.isArray(value[0])) {
    vector = value.map((row) => {
      if (!Array.isArray(row) || row.length !== 1 || !isFiniteNumber(row[0])) {
        throw new Error(`${name} must be a numeric vector`)
      }
      return row[0]
    })
  } else {
    vector = value.slice()
  }
  if (!vector.every(isFiniteNumber)) {
    throw new Error(`${name} contains non-finite values`)
  }
  if (expectedLength != null && vector.length !== expectedLength) {
    throw new Error(`${name} length mismatch`)
  }
  return vector
}

function vectorToColumnMatrix(vector) {
  return new Matrix(vector.map((value) => [value]))
}

function matrixColumnToVector(matrix) {
  if (matrix.columns !== 1) {
    throw new Error('expected a column matrix')
  }
  const out = []
  for (let i = 0; i < matrix.rows; i += 1) {
    out.push(matrix.get(i, 0))
  }
  return out
}

function solveLinearSystem(A, b) {
  try {
    return inverse(A).mmul(b)
  } catch {
    return pseudoInverse(A).mmul(b)
  }
}

function cloneMatrix2d(matrix) {
  return matrix.map((row) => row.slice())
}

function identity(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )
}

function parseAbsoluteViews(absoluteViews, tickers, nAssets) {
  if (!absoluteViews || typeof absoluteViews !== 'object' || Array.isArray(absoluteViews)) {
    throw new TypeError('absoluteViews must be an object keyed by ticker')
  }
  const entries = Object.entries(absoluteViews)
  const Q = []
  const P = []
  for (const [ticker, value] of entries) {
    if (!isFiniteNumber(value)) {
      throw new Error('absoluteViews contains non-finite view values')
    }
    const idx = tickers.indexOf(String(ticker))
    if (idx < 0) {
      throw new Error(`absoluteViews contains unknown ticker: ${ticker}`)
    }
    const row = Array.from({ length: nAssets }, () => 0)
    row[idx] = 1
    Q.push(value)
    P.push(row)
  }
  if (Q.length === 0) {
    throw new Error('absoluteViews cannot be empty')
  }
  return { Q, P }
}

function parseQAndP(QRaw, PRaw, nAssets) {
  const Q = toVector('Q', QRaw)
  let P
  if (PRaw == null) {
    if (Q.length !== nAssets) {
      throw new Error('P is required unless one view is provided for each asset')
    }
    P = identity(nAssets)
  } else {
    validateMatrix('P', PRaw)
    if (PRaw.length !== Q.length || PRaw[0].length !== nAssets) {
      throw new Error('P must have shape [numViews x nAssets]')
    }
    P = cloneMatrix2d(PRaw)
  }
  return { Q, P }
}

function parsePi(piRaw, { nAssets, tickers, covMatrix, riskAversion, marketCaps, riskFreeRate }) {
  if (piRaw == null) {
    return Array.from({ length: nAssets }, () => 0)
  }
  if (piRaw === 'equal') {
    return Array.from({ length: nAssets }, () => 1 / nAssets)
  }
  if (piRaw === 'market') {
    if (marketCaps == null) {
      throw new Error('pi="market" requires marketCaps')
    }
    return marketImpliedPriorReturns(marketCaps, riskAversion, covMatrix, { riskFreeRate, tickers })
  }
  if (Array.isArray(piRaw)) {
    return toVector('pi', piRaw, nAssets)
  }
  if (piRaw && typeof piRaw === 'object') {
    return tickers.map((ticker) => {
      const value = piRaw[ticker]
      if (!isFiniteNumber(value)) {
        throw new Error(`pi missing value for ticker ${ticker}`)
      }
      return value
    })
  }
  throw new TypeError('pi must be an array, object, "equal", "market", or null')
}

function parseOmega(omegaRaw, nViews) {
  if (Array.isArray(omegaRaw) && omegaRaw.length === nViews && !Array.isArray(omegaRaw[0])) {
    const diag = omegaRaw
    if (!diag.every(isFiniteNumber)) {
      throw new Error('omega diagonal contains non-finite values')
    }
    return Array.from({ length: nViews }, (_, i) =>
      Array.from({ length: nViews }, (_, j) => (i === j ? diag[i] : 0)),
    )
  }
  validateMatrix('omega', omegaRaw)
  if (omegaRaw.length !== nViews || omegaRaw[0].length !== nViews) {
    throw new Error('omega must have shape [numViews x numViews]')
  }
  return cloneMatrix2d(omegaRaw)
}

export function marketImpliedPriorReturns(
  marketCaps,
  riskAversion,
  covMatrix,
  { riskFreeRate = 0, tickers = null } = {},
) {
  ensureSquareMatrix('covMatrix', covMatrix)
  const weights = normalizeMarketCaps(marketCaps, covMatrix.length, tickers)
  const implied = matVec(covMatrix, weights)
  return implied.map((v) => riskAversion * v + riskFreeRate)
}

export function marketImpliedRiskAversion(
  marketPrices,
  { frequency = 252, riskFreeRate = 0 } = {},
) {
  if (!Array.isArray(marketPrices) || marketPrices.length < 2) {
    throw new Error('market_prices must contain at least 2 prices')
  }
  const returns = []
  for (let i = 1; i < marketPrices.length; i += 1) {
    returns.push(marketPrices[i] / marketPrices[i - 1] - 1)
  }
  const mean = returns.reduce((acc, v) => acc + v, 0) / returns.length
  const variance =
    returns.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(returns.length - 1, 1)
  return (mean * frequency - riskFreeRate) / (variance * frequency)
}

export class BlackLittermanModel {
  constructor(covMatrix, options = {}) {
    ensureSquareMatrix('covMatrix', covMatrix)
    const {
      pi = null,
      absoluteViews = options.absolute_views,
      Q = null,
      P = null,
      omega = null,
      viewConfidences = options.view_confidences,
      tau = 0.05,
      riskAversion = options.risk_aversion ?? 1,
      marketCaps = options.market_caps,
      riskFreeRate = options.risk_free_rate ?? 0,
      tickers = null,
    } = options

    if (!isFiniteNumber(tau) || tau <= 0 || tau > 1) {
      throw new Error('tau must be in (0, 1]')
    }
    if (!isFiniteNumber(riskAversion) || riskAversion <= 0) {
      throw new Error('riskAversion must be positive')
    }

    this.covMatrix = cloneMatrix2d(covMatrix)
    this.nAssets = covMatrix.length
    this.tickers = normalizeTickers(this.nAssets, tickers)
    this.tau = tau
    this.riskAversion = riskAversion
    this.riskFreeRate = riskFreeRate

    if (absoluteViews != null) {
      const parsed = parseAbsoluteViews(absoluteViews, this.tickers, this.nAssets)
      this.Q = parsed.Q
      this.P = parsed.P
    } else {
      if (Q == null) {
        throw new TypeError('BlackLittermanModel requires Q or absoluteViews')
      }
      const parsed = parseQAndP(Q, P, this.nAssets)
      this.Q = parsed.Q
      this.P = parsed.P
    }

    this.pi = parsePi(pi, {
      nAssets: this.nAssets,
      tickers: this.tickers,
      covMatrix: this.covMatrix,
      riskAversion: this.riskAversion,
      marketCaps,
      riskFreeRate: this.riskFreeRate,
    })

    if (omega == null || omega === 'default') {
      this.omega = BlackLittermanModel.defaultOmega(this.covMatrix, this.P, this.tau)
    } else if (omega === 'idzorek') {
      if (viewConfidences == null) {
        throw new Error('omega="idzorek" requires viewConfidences')
      }
      this.omega = BlackLittermanModel.idzorekMethod(
        viewConfidences,
        this.covMatrix,
        this.pi,
        this.Q,
        this.P,
        this.tau,
      )
    } else {
      this.omega = parseOmega(omega, this.Q.length)
    }

    if (this.omega.length !== this.Q.length || this.omega[0].length !== this.Q.length) {
      throw new Error('omega shape mismatch with number of views')
    }

    this.posteriorReturns = null
    this.posteriorCov = null
    this.weights = null
    this._tauSigmaP = null
    this._A = null
  }

  _vectorToSeries(vector) {
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, vector[i]]))
  }

  _seriesToVector(series, fieldName = 'values') {
    if (Array.isArray(series)) {
      return toVector(fieldName, series, this.nAssets)
    }
    if (series && typeof series === 'object') {
      return this.tickers.map((ticker) => {
        const value = series[ticker]
        if (!isFiniteNumber(value)) {
          throw new Error(`${fieldName} missing value for ticker ${ticker}`)
        }
        return value
      })
    }
    throw new TypeError(`${fieldName} must be an array or object keyed by ticker`)
  }

  _ensureIntermediates() {
    if (this._tauSigmaP == null) {
      const cov = new Matrix(this.covMatrix)
      const P = new Matrix(this.P)
      this._tauSigmaP = cov.clone().mul(this.tau).mmul(P.transpose())
    }
    if (this._A == null) {
      const P = new Matrix(this.P)
      const omega = new Matrix(this.omega)
      this._A = P.mmul(this._tauSigmaP).add(omega)
    }
  }

  static defaultOmega(covMatrix, P, tau) {
    ensureSquareMatrix('covMatrix', covMatrix)
    validateMatrix('P', P)
    if (!isFiniteNumber(tau) || tau <= 0) {
      throw new Error('tau must be positive')
    }
    if (P[0].length !== covMatrix.length) {
      throw new Error('P must have as many columns as covMatrix assets')
    }
    const projected = new Matrix(P).mmul(new Matrix(covMatrix)).mmul(new Matrix(P).transpose())
    const out = Array.from({ length: projected.rows }, () => Array(projected.rows).fill(0))
    for (let i = 0; i < projected.rows; i += 1) {
      out[i][i] = projected.get(i, i) * tau
    }
    return out
  }

  static idzorekMethod(viewConfidences, covMatrix, pi, Q, P, tau) {
    ensureSquareMatrix('covMatrix', covMatrix)
    validateMatrix('P', P)
    const confidences = toVector('viewConfidences', viewConfidences, Q.length)
    const base = BlackLittermanModel.defaultOmega(covMatrix, P, tau)
    const out = Array.from({ length: Q.length }, () => Array(Q.length).fill(0))
    for (let i = 0; i < Q.length; i += 1) {
      const conf = confidences[i]
      if (conf < 0 || conf > 1) {
        throw new Error('view confidences must be between 0 and 1')
      }
      if (conf === 0) {
        out[i][i] = 1e6
        continue
      }
      const alpha = (1 - conf) / conf
      out[i][i] = alpha * base[i][i]
    }
    return out
  }

  blReturns() {
    this._ensureIntermediates()
    const pi = vectorToColumnMatrix(this.pi)
    const Q = vectorToColumnMatrix(this.Q)
    const P = new Matrix(this.P)
    const b = Q.sub(P.mmul(pi))
    const solution = solveLinearSystem(this._A, b)
    const post = pi.add(this._tauSigmaP.mmul(solution))
    this.posteriorReturns = matrixColumnToVector(post)
    return this._vectorToSeries(this.posteriorReturns)
  }

  blCov() {
    this._ensureIntermediates()
    const tauCov = new Matrix(this.covMatrix).mul(this.tau)
    const mSolution = solveLinearSystem(this._A, this._tauSigmaP.transpose())
    const M = tauCov.sub(this._tauSigmaP.mmul(mSolution))
    this.posteriorCov = new Matrix(this.covMatrix).add(M).to2DArray()
    return cloneMatrix2d(this.posteriorCov)
  }

  blWeights(riskAversion = null) {
    const delta = riskAversion ?? this.riskAversion
    if (!isFiniteNumber(delta) || delta <= 0) {
      throw new Error('riskAversion must be positive')
    }
    if (this.posteriorReturns == null) {
      this.blReturns()
    }
    const A = new Matrix(this.covMatrix).mul(delta)
    const b = vectorToColumnMatrix(this.posteriorReturns)
    const raw = matrixColumnToVector(solveLinearSystem(A, b))
    const sum = raw.reduce((acc, value) => acc + value, 0)
    if (Math.abs(sum) < 1e-16) {
      throw new Error('posterior-implied weights sum is zero')
    }
    this.weights = raw.map((value) => value / sum)
    return this._vectorToSeries(this.weights)
  }

  optimize(riskAversion = null) {
    return this.blWeights(riskAversion)
  }

  setWeights(weights) {
    this.weights = this._seriesToVector(weights, 'weights')
    return this._vectorToSeries(this.weights)
  }

  set_weights(...args) {
    return this.setWeights(...args)
  }

  cleanWeights({ cutoff = 1e-4, rounding = 5 } = {}) {
    if (this.weights == null) {
      throw new Error('weights have not been set')
    }
    const cleaned = this.weights.map((weight) => {
      const clipped = Math.abs(weight) < cutoff ? 0 : weight
      return Number(clipped.toFixed(rounding))
    })
    return this._vectorToSeries(cleaned)
  }

  clean_weights(...args) {
    return this.cleanWeights(...args)
  }

  portfolioPerformance({ riskFreeRate = this.riskFreeRate, risk_free_rate = null } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    const rf = risk_free_rate == null ? riskFreeRate : risk_free_rate
    if (this.posteriorReturns == null) {
      this.blReturns()
    }
    if (this.posteriorCov == null) {
      this.blCov()
    }
    const expectedReturn = dot(this.weights, this.posteriorReturns)
    const variance = dot(this.weights, matVec(this.posteriorCov, this.weights))
    const volatility = Math.sqrt(Math.max(variance, 0))
    const sharpe = volatility === 0 ? Number.POSITIVE_INFINITY : (expectedReturn - rf) / volatility
    return [expectedReturn, volatility, sharpe]
  }

  // Python aliases
  static default_omega(...args) {
    return BlackLittermanModel.defaultOmega(...args)
  }

  static idzorek_method(...args) {
    return BlackLittermanModel.idzorekMethod(...args)
  }

  bl_returns(...args) {
    return this.blReturns(...args)
  }

  bl_cov(...args) {
    return this.blCov(...args)
  }

  bl_weights(...args) {
    return this.blWeights(...args)
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}

export const market_implied_prior_returns = marketImpliedPriorReturns
export const market_implied_risk_aversion = marketImpliedRiskAversion
