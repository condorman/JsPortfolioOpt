import { BaseOptimizerAdapter } from './_base.js'
import { portfolioReturn, portfolioVariance } from '../objective_functions.js'

function parseWeightBounds(weightBounds, nAssets) {
  const isNumber = (v) => typeof v === 'number' && Number.isFinite(v)

  if (
    Array.isArray(weightBounds) &&
    weightBounds.length === nAssets &&
    Array.isArray(weightBounds[0])
  ) {
    const lower = []
    const upper = []
    for (const pair of weightBounds) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error('weightBounds per-asset format must be [[lb, ub], ...]')
      }
      const [lbRaw, ubRaw] = pair
      const lb = lbRaw == null ? -1 : lbRaw
      const ub = ubRaw == null ? 1 : ubRaw
      if (!isNumber(lb) || !isNumber(ub) || lb > ub) {
        throw new Error('invalid per-asset weight bounds')
      }
      lower.push(lb)
      upper.push(ub)
    }
    return { lower, upper }
  }

  if (
    Array.isArray(weightBounds) &&
    weightBounds.length === 2 &&
    Array.isArray(weightBounds[0]) &&
    Array.isArray(weightBounds[1]) &&
    weightBounds[0].length === nAssets &&
    weightBounds[1].length === nAssets
  ) {
    const lower = weightBounds[0].map((v) => (v == null ? -1 : v))
    const upper = weightBounds[1].map((v) => (v == null ? 1 : v))
    for (let i = 0; i < nAssets; i += 1) {
      if (!isNumber(lower[i]) || !isNumber(upper[i]) || lower[i] > upper[i]) {
        throw new Error('invalid vectorized weight bounds')
      }
    }
    return { lower, upper }
  }

  if (Array.isArray(weightBounds) && weightBounds.length === 2) {
    const lb = weightBounds[0] == null ? -1 : weightBounds[0]
    const ub = weightBounds[1] == null ? 1 : weightBounds[1]
    if (!isNumber(lb) || !isNumber(ub) || lb > ub) {
      throw new Error('invalid scalar weight bounds')
    }
    return {
      lower: Array.from({ length: nAssets }, () => lb),
      upper: Array.from({ length: nAssets }, () => ub),
    }
  }

  throw new Error('weightBounds format not supported')
}

function projectBoundedSimplex(vector, lower, upper, targetSum = 1) {
  const n = vector.length
  let w = vector.map((v, i) => Math.min(Math.max(v, lower[i]), upper[i]))

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const sum = w.reduce((acc, x) => acc + x, 0)
    const diff = targetSum - sum
    if (Math.abs(diff) < 1e-12) {
      break
    }

    const free = []
    for (let i = 0; i < n; i += 1) {
      const canIncrease = w[i] < upper[i] - 1e-12
      const canDecrease = w[i] > lower[i] + 1e-12
      if ((diff > 0 && canIncrease) || (diff < 0 && canDecrease)) {
        free.push(i)
      }
    }
    if (free.length === 0) {
      break
    }

    const delta = diff / free.length
    for (const i of free) {
      w[i] = Math.min(Math.max(w[i] + delta, lower[i]), upper[i])
    }
  }

  // Final stabilization: enforce exact sum if possible.
  let remaining = targetSum - w.reduce((acc, x) => acc + x, 0)
  if (Math.abs(remaining) > 1e-10) {
    for (let i = 0; i < n; i += 1) {
      if (remaining > 0) {
        const room = upper[i] - w[i]
        const add = Math.min(room, remaining)
        w[i] += add
        remaining -= add
      } else {
        const room = w[i] - lower[i]
        const sub = Math.min(room, -remaining)
        w[i] -= sub
        remaining += sub
      }
      if (Math.abs(remaining) < 1e-10) {
        break
      }
    }
  }

  return w
}

function numericalGradient(fn, w) {
  const grad = Array(w.length).fill(0)
  for (let i = 0; i < w.length; i += 1) {
    const eps = 1e-6 * Math.max(1, Math.abs(w[i]))
    const up = w.slice()
    const down = w.slice()
    up[i] += eps
    down[i] -= eps
    grad[i] = (fn(up) - fn(down)) / (2 * eps)
  }
  return grad
}

function l2Norm(vector) {
  return Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0))
}

function linspace(start, end, points) {
  if (points <= 1) {
    return [start]
  }
  const out = []
  const step = (end - start) / (points - 1)
  for (let i = 0; i < points; i += 1) {
    out.push(start + step * i)
  }
  return out
}

export class EfficientFrontier extends BaseOptimizerAdapter {
  constructor(expectedReturns, covMatrix, options = {}) {
    super(expectedReturns, covMatrix, options)
    this.covMatrix = covMatrix
    if (
      !Array.isArray(covMatrix) ||
      covMatrix.length !== this.nAssets ||
      !covMatrix.every((row) => Array.isArray(row) && row.length === this.nAssets)
    ) {
      throw new Error('covMatrix shape mismatch with expectedReturns')
    }
    const { lower, upper } = parseWeightBounds(options.weightBounds ?? [0, 1], this.nAssets)
    this._lowerBounds = lower
    this._upperBounds = upper
    this._targetSum = 1
  }

  _initialWeights() {
    const equal = Array.from({ length: this.nAssets }, () => 1 / this.nAssets)
    return projectBoundedSimplex(equal, this._lowerBounds, this._upperBounds, this._targetSum)
  }

  _optimize(objective, { maxIter = 800, learningRate = 0.05, tolerance = 1e-9 } = {}) {
    let w = this._initialWeights()
    let bestW = w.slice()
    let bestVal = objective(w)
    let lr = learningRate

    for (let iter = 0; iter < maxIter; iter += 1) {
      const grad = numericalGradient(objective, w)
      const candidateRaw = w.map((v, i) => v - lr * grad[i])
      const candidate = projectBoundedSimplex(
        candidateRaw,
        this._lowerBounds,
        this._upperBounds,
        this._targetSum,
      )
      const candidateVal = objective(candidate)

      if (Number.isFinite(candidateVal) && candidateVal <= bestVal + 1e-12) {
        const stepNorm = l2Norm(candidate.map((v, i) => v - w[i]))
        w = candidate
        bestW = candidate.slice()
        bestVal = candidateVal
        lr = Math.min(lr * 1.05, 0.2)
        if (stepNorm < tolerance) {
          break
        }
      } else {
        lr *= 0.5
        if (lr < 1e-7) {
          break
        }
      }
    }

    this.weights = bestW
    return this._mapVectorToWeights(bestW)
  }

  _portfolioReturn(weights) {
    return portfolioReturn(weights, this.expectedReturns, { negative: false })
  }

  _portfolioVariance(weights) {
    return portfolioVariance(weights, this.covMatrix)
  }

  _penalized(objective) {
    return (w) => objective(w) + this._extraPenalty(w)
  }

  minVolatility() {
    return this._optimize(this._penalized((w) => this._portfolioVariance(w)))
  }

  maxSharpe({ riskFreeRate = 0 } = {}) {
    return this._optimize(
      this._penalized((w) => {
        const variance = Math.max(this._portfolioVariance(w), 1e-16)
        const sigma = Math.sqrt(variance)
        const mu = this._portfolioReturn(w)
        return -((mu - riskFreeRate) / sigma)
      }),
    )
  }

  maxQuadraticUtility({ riskAversion = 1 } = {}) {
    return this._optimize(
      this._penalized((w) => {
        const mu = this._portfolioReturn(w)
        const variance = this._portfolioVariance(w)
        return -(mu - 0.5 * riskAversion * variance)
      }),
    )
  }

  efficientRisk(targetVolatility, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }
    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const variance = Math.max(this._portfolioVariance(w), 0)
        const sigma = Math.sqrt(variance)
        const mu = this._portfolioReturn(w)
        const penalty = Math.max(0, sigma - targetVolatility) ** 2 * penaltyScale
        return -mu + penalty
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
        const variance = this._portfolioVariance(w)
        const mu = this._portfolioReturn(w)
        const penalty = Math.max(0, targetReturn - mu) ** 2 * penaltyScale
        return variance + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  maxReturn() {
    let best = 0
    let bestIdx = 0
    for (let i = 0; i < this.expectedReturns.length; i += 1) {
      if (this.expectedReturns[i] > best || i === 0) {
        best = this.expectedReturns[i]
        bestIdx = i
      }
    }
    const w = Array.from({ length: this.nAssets }, () => 0)
    w[bestIdx] = 1
    this.weights = projectBoundedSimplex(w, this._lowerBounds, this._upperBounds, this._targetSum)
    return this._mapVectorToWeights(this.weights)
  }

  efficientFrontier({ points = 50 } = {}) {
    const minVol = this.minVolatility()
    const perfMin = this.portfolioPerformance()
    const maxRet = this.maxReturn()
    const perfMax = this.portfolioPerformance()
    const targets = linspace(perfMin[0], perfMax[0], points)
    const frontier = []

    for (const target of targets) {
      this.efficientReturn(target)
      const [ret, vol, sharpe] = this.portfolioPerformance()
      frontier.push({ targetReturn: target, return: ret, volatility: vol, sharpe, weights: this.cleanWeights() })
    }

    // Restore a stable output state.
    this.setWeights(minVol)
    this.portfolioPerformance()
    this._max_return = maxRet
    return frontier
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

  max_return(...args) {
    return this.maxReturn(...args)
  }

  efficient_frontier(...args) {
    return this.efficientFrontier(...args)
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
