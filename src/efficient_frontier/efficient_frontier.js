import { BaseOptimizerAdapter } from './_base.js'
import { portfolioReturn, portfolioVariance } from '../objective_functions.js'
import quadprog from 'quadprog'

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
  const lowerSum = lower.reduce((acc, v) => acc + v, 0)
  const upperSum = upper.reduce((acc, v) => acc + v, 0)
  const clampedTarget = Math.min(Math.max(targetSum, lowerSum), upperSum)

  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (let i = 0; i < n; i += 1) {
    lo = Math.min(lo, vector[i] - upper[i])
    hi = Math.max(hi, vector[i] - lower[i])
  }

  const clipped = (x, i) => Math.min(Math.max(x, lower[i]), upper[i])
  const summedAt = (lambda) => {
    let sum = 0
    for (let i = 0; i < n; i += 1) {
      sum += clipped(vector[i] - lambda, i)
    }
    return sum
  }

  for (let iter = 0; iter < 120; iter += 1) {
    const mid = (lo + hi) / 2
    const s = summedAt(mid)
    if (s > clampedTarget) {
      lo = mid
    } else {
      hi = mid
    }
  }

  const lambda = (lo + hi) / 2
  const out = Array(n)
  for (let i = 0; i < n; i += 1) {
    out[i] = clipped(vector[i] - lambda, i)
  }
  return out
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

function to1BasedVector(values) {
  return [0, ...values]
}

function to1BasedMatrix(matrix) {
  return [[], ...matrix.map((row) => [0, ...row])]
}

function addDiagonalJitter(matrix, jitter) {
  return matrix.map((row, i) => row.map((value, j) => (i === j ? value + jitter : value)))
}

function dot(a, b) {
  let acc = 0
  for (let i = 0; i < a.length; i += 1) {
    acc += a[i] * b[i]
  }
  return acc
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

  _canUseExactQp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0
  }

  _isFeasibleTargetSum(targetSum) {
    const minSum = this._lowerBounds.reduce((acc, v) => acc + v, 0)
    const maxSum = this._upperBounds.reduce((acc, v) => acc + v, 0)
    return targetSum >= minSum - 1e-10 && targetSum <= maxSum + 1e-10
  }

  _buildConstraintSets({ targetSum = 1, minReturn = null } = {}) {
    const eqConstraints = [{ a: Array(this.nAssets).fill(1), b: targetSum }]
    const ineqConstraints = []

    for (let i = 0; i < this.nAssets; i += 1) {
      const lower = this._lowerBounds[i]
      const upper = this._upperBounds[i]
      const aLower = Array(this.nAssets).fill(0)
      const aUpper = Array(this.nAssets).fill(0)
      aLower[i] = 1
      aUpper[i] = -1
      ineqConstraints.push({ a: aLower, b: lower })
      ineqConstraints.push({ a: aUpper, b: -upper })
    }

    if (minReturn != null) {
      ineqConstraints.push({ a: this.expectedReturns.slice(), b: minReturn })
    }

    return { eqConstraints, ineqConstraints }
  }

  _solveQp({ D, d, eqConstraints = [], ineqConstraints = [] }) {
    const n = this.nAssets
    const allConstraints = [...eqConstraints, ...ineqConstraints]
    const q = allConstraints.length
    const meq = eqConstraints.length

    const Amat = Array.from({ length: n + 1 }, () => Array(q + 1).fill(0))
    const bvec = Array(q + 1).fill(0)
    for (let j = 1; j <= q; j += 1) {
      const { a, b } = allConstraints[j - 1]
      bvec[j] = b
      for (let i = 1; i <= n; i += 1) {
        Amat[i][j] = a[i - 1]
      }
    }

    const jitterLevels = [0, 1e-12, 1e-10, 1e-8, 1e-6, 1e-4]
    for (const jitter of jitterLevels) {
      const Dtry = jitter === 0 ? D : addDiagonalJitter(D, jitter)
      const result = quadprog.solveQP(to1BasedMatrix(Dtry), to1BasedVector(d), Amat, bvec, meq)
      if (result?.message) {
        continue
      }
      const solution = (result?.solution ?? []).slice(1)
      if (solution.length !== n) {
        continue
      }
      if (!solution.every((v) => Number.isFinite(v))) {
        continue
      }
      return solution
    }

    return null
  }

  _solveMinVarianceWeights({ targetSum = 1, minReturn = null } = {}) {
    const D = this.covMatrix.map((row) => row.map((v) => 2 * v))
    const d = Array(this.nAssets).fill(0)
    const { eqConstraints, ineqConstraints } = this._buildConstraintSets({ targetSum, minReturn })
    return this._solveQp({ D, d, eqConstraints, ineqConstraints })
  }

  _solveQuadraticUtilityWeights({ riskAversion = 1, targetSum = 1 } = {}) {
    const D = this.covMatrix.map((row) => row.map((v) => riskAversion * v))
    const d = this.expectedReturns.slice()
    const { eqConstraints, ineqConstraints } = this._buildConstraintSets({ targetSum })
    return this._solveQp({ D, d, eqConstraints, ineqConstraints })
  }

  _solveMaxReturnWeights({ targetSum = 1 } = {}) {
    if (!this._isFeasibleTargetSum(targetSum)) {
      return null
    }

    const w = this._lowerBounds.slice()
    let remaining = targetSum - w.reduce((acc, v) => acc + v, 0)
    if (remaining < -1e-10) {
      return null
    }

    const order = Array.from({ length: this.nAssets }, (_, i) => i).sort(
      (a, b) => this.expectedReturns[b] - this.expectedReturns[a],
    )
    for (const idx of order) {
      if (remaining <= 1e-12) {
        break
      }
      const room = this._upperBounds[idx] - w[idx]
      const add = Math.min(room, remaining)
      w[idx] += add
      remaining -= add
    }

    if (remaining > 1e-8) {
      return null
    }
    return w
  }

  _setSolvedWeights(weights) {
    this.weights = weights.slice()
    return this._mapVectorToWeights(this.weights)
  }

  minVolatility() {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveMinVarianceWeights({ targetSum: this._targetSum })
      if (w) {
        return this._setSolvedWeights(w)
      }
    }
    return this._optimize(this._penalized((w) => this._portfolioVariance(w)))
  }

  maxSharpe({ riskFreeRate = 0 } = {}) {
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const minVolW = this._solveMinVarianceWeights({ targetSum: this._targetSum })
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum })
      if (minVolW && maxRetW) {
        const minRet = this._portfolioReturn(minVolW)
        const maxRet = this._portfolioReturn(maxRetW)
        const evalCache = new Map()

        const evaluate = (targetReturn) => {
          const key = targetReturn.toPrecision(16)
          if (evalCache.has(key)) {
            return evalCache.get(key)
          }
          const w = this._solveMinVarianceWeights({
            targetSum: this._targetSum,
            minReturn: targetReturn,
          })
          if (!w) {
            evalCache.set(key, null)
            return null
          }
          const ret = this._portfolioReturn(w)
          const vol = Math.sqrt(Math.max(this._portfolioVariance(w), 0))
          const sharpe =
            vol === 0 ? Number.NEGATIVE_INFINITY : (ret - riskFreeRate) / vol
          const out = { w, ret, vol, sharpe }
          evalCache.set(key, out)
          return out
        }

        let best = null
        const consider = (candidate) => {
          if (!candidate) {
            return
          }
          if (!best || candidate.sharpe > best.sharpe) {
            best = candidate
          }
        }

        const gridPoints = 80
        for (let i = 0; i <= gridPoints; i += 1) {
          const t = i / gridPoints
          const r = minRet + t * (maxRet - minRet)
          consider(evaluate(r))
        }

        let left = minRet
        let right = maxRet
        for (let iter = 0; iter < 45; iter += 1) {
          const r1 = left + (right - left) / 3
          const r2 = right - (right - left) / 3
          const c1 = evaluate(r1)
          const c2 = evaluate(r2)
          const s1 = c1 ? c1.sharpe : Number.NEGATIVE_INFINITY
          const s2 = c2 ? c2.sharpe : Number.NEGATIVE_INFINITY
          if (s1 < s2) {
            left = r1
          } else {
            right = r2
          }
          consider(c1)
          consider(c2)
        }

        if (best) {
          return this._setSolvedWeights(best.w)
        }
      }
    }

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
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveQuadraticUtilityWeights({
        riskAversion,
        targetSum: this._targetSum,
      })
      if (w) {
        return this._setSolvedWeights(w)
      }
    }

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

    if (!marketNeutral && this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const minVolW = this._solveMinVarianceWeights({ targetSum: this._targetSum })
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum })
      if (minVolW && maxRetW) {
        const targetSigma = targetVolatility
        const minVolSigma = Math.sqrt(Math.max(this._portfolioVariance(minVolW), 0))
        if (minVolSigma >= targetSigma - 1e-10) {
          this._targetSum = 1
          return this._setSolvedWeights(minVolW)
        }

        const maxVolSigma = Math.sqrt(Math.max(this._portfolioVariance(maxRetW), 0))
        if (maxVolSigma <= targetSigma + 1e-10) {
          this._targetSum = 1
          return this._setSolvedWeights(maxRetW)
        }

        let lo = this._portfolioReturn(minVolW)
        let hi = this._portfolioReturn(maxRetW)
        let best = minVolW
        for (let iter = 0; iter < 70; iter += 1) {
          const mid = (lo + hi) / 2
          const w = this._solveMinVarianceWeights({
            targetSum: this._targetSum,
            minReturn: mid,
          })
          if (!w) {
            hi = mid
            continue
          }
          const sigma = Math.sqrt(Math.max(this._portfolioVariance(w), 0))
          if (sigma <= targetSigma + 1e-10) {
            lo = mid
            best = w
          } else {
            hi = mid
          }
        }

        this._targetSum = 1
        return this._setSolvedWeights(best)
      }
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

    if (!marketNeutral && this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveMinVarianceWeights({
        targetSum: this._targetSum,
        minReturn: targetReturn,
      })
      if (w) {
        this._targetSum = 1
        return this._setSolvedWeights(w)
      }
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
    if (this._canUseExactQp() && this._isFeasibleTargetSum(this._targetSum)) {
      const w = this._solveMaxReturnWeights({ targetSum: this._targetSum })
      if (w) {
        return this._setSolvedWeights(w)
      }
    }

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
