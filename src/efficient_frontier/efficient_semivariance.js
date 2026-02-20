import { EfficientFrontier } from './efficient_frontier.js'
import quadprog from 'quadprog'
import { dot } from '../_utils/math.js'

function validateReturnsMatrix(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error('historicReturns must be a non-empty matrix')
  }
  const cols = historicReturns[0].length
  if (cols === 0) {
    throw new Error('historicReturns cannot have empty rows')
  }
  for (const row of historicReturns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error('historicReturns rows must have equal length')
    }
  }
}

function covarianceFromReturns(returns, frequency) {
  const cols = returns[0].length
  const out = Array.from({ length: cols }, () => Array(cols).fill(0))
  const mean = Array.from({ length: cols }, (_, c) => {
    let acc = 0
    for (const row of returns) {
      acc += row[c]
    }
    return acc / returns.length
  })
  for (let i = 0; i < cols; i += 1) {
    for (let j = i; j < cols; j += 1) {
      let acc = 0
      for (const row of returns) {
        acc += (row[i] - mean[i]) * (row[j] - mean[j])
      }
      const cov = (acc / Math.max(returns.length - 1, 1)) * frequency
      out[i][j] = cov
      out[j][i] = cov
    }
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

function dotVec(a, b) {
  let acc = 0
  for (let i = 0; i < a.length; i += 1) {
    acc += a[i] * b[i]
  }
  return acc
}

function semideviation(portfolioReturns, benchmark = 0) {
  const downside = portfolioReturns.map((r) => Math.min(r - benchmark, 0))
  const variance = downside.reduce((acc, d) => acc + d * d, 0) / Math.max(portfolioReturns.length, 1)
  return Math.sqrt(Math.max(variance, 0))
}

export class EfficientSemivariance extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix(historicReturns)
    const covProxy = covarianceFromReturns(historicReturns, options.frequency ?? 252)
    super(expectedReturns, covProxy, options)
    this.historicReturns = historicReturns
    this.benchmark = options.benchmark ?? 0
    this.frequency = options.frequency ?? 252
  }

  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights))
  }

  _semivariance(weights) {
    const rets = this._portfolioReturns(weights)
    const semi = semideviation(rets, this.benchmark)
    return semi * semi * this.frequency
  }

  _canUseExactSemivarianceQp() {
    return this._additionalObjectives.length === 0
      && this._additionalConstraints.length === 0
      && this.historicReturns.length <= 250
      && this._isFeasibleTargetSum(this._targetSum)
  }

  _solveSemivarianceWeights({ targetSum = 1, minReturn = null } = {}) {
    const n = this.nAssets
    const T = this.historicReturns.length
    const pOffset = n
    const nOffset = n + T
    const dim = n + 2 * T

    const D = Array.from({ length: dim }, () => Array(dim).fill(0))
    for (let t = 0; t < T; t += 1) {
      D[nOffset + t][nOffset + t] = 2
    }
    const d = Array(dim).fill(0)

    const eqConstraints = []
    const ineqConstraints = []

    const sumConstraint = Array(dim).fill(0)
    for (let i = 0; i < n; i += 1) {
      sumConstraint[i] = 1
    }
    eqConstraints.push({ a: sumConstraint, b: targetSum })

    const scale = Math.sqrt(T)
    for (let t = 0; t < T; t += 1) {
      const a = Array(dim).fill(0)
      const row = this.historicReturns[t]
      for (let i = 0; i < n; i += 1) {
        a[i] = (row[i] - this.benchmark) / scale
      }
      a[pOffset + t] = -1
      a[nOffset + t] = 1
      eqConstraints.push({ a, b: 0 })
    }

    for (let i = 0; i < n; i += 1) {
      const lower = this._lowerBounds[i]
      const upper = this._upperBounds[i]

      const aLower = Array(dim).fill(0)
      aLower[i] = 1
      ineqConstraints.push({ a: aLower, b: lower })

      const aUpper = Array(dim).fill(0)
      aUpper[i] = -1
      ineqConstraints.push({ a: aUpper, b: -upper })
    }

    for (let t = 0; t < T; t += 1) {
      const aP = Array(dim).fill(0)
      aP[pOffset + t] = 1
      ineqConstraints.push({ a: aP, b: 0 })

      const aN = Array(dim).fill(0)
      aN[nOffset + t] = 1
      ineqConstraints.push({ a: aN, b: 0 })
    }

    if (minReturn != null) {
      const aRet = Array(dim).fill(0)
      for (let i = 0; i < n; i += 1) {
        aRet[i] = this.expectedReturns[i]
      }
      ineqConstraints.push({ a: aRet, b: minReturn })
    }

    const allConstraints = [...eqConstraints, ...ineqConstraints]
    const q = allConstraints.length
    const meq = eqConstraints.length

    const Amat = Array.from({ length: dim + 1 }, () => Array(q + 1).fill(0))
    const bvec = Array(q + 1).fill(0)
    for (let j = 1; j <= q; j += 1) {
      const { a, b } = allConstraints[j - 1]
      bvec[j] = b
      for (let i = 1; i <= dim; i += 1) {
        Amat[i][j] = a[i - 1]
      }
    }

    const jitterLevels = [0, 1e-12, 1e-10, 1e-8, 1e-6]
    for (const jitter of jitterLevels) {
      const Dtry = jitter === 0 ? D : addDiagonalJitter(D, jitter)
      const result = quadprog.solveQP(to1BasedMatrix(Dtry), to1BasedVector(d), Amat, bvec, meq)
      if (result?.message) {
        continue
      }
      const solution = (result?.solution ?? []).slice(1)
      if (solution.length !== dim) {
        continue
      }
      if (!solution.every((v) => Number.isFinite(v))) {
        continue
      }

      const eqValid = eqConstraints.every(({ a, b }) => Math.abs(dotVec(a, solution) - b) <= 1e-5)
      const ineqValid = ineqConstraints.every(({ a, b }) => dotVec(a, solution) >= b - 1e-5)
      if (!eqValid || !ineqValid) {
        continue
      }

      return solution.slice(0, n)
    }

    return null
  }

  minSemivariance({ marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }

    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const w = this._solveSemivarianceWeights({ targetSum: this._targetSum })
      if (w) {
        this._targetSum = 1
        return this._setSolvedWeights(w)
      }
    }

    const result = this._optimize(this._penalized((w) => this._semivariance(w)))
    this._targetSum = 1
    return result
  }

  efficientRisk(targetSemideviation, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }

    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const minSemiW = this._solveSemivarianceWeights({ targetSum: this._targetSum })
      const maxRetW = this._solveMaxReturnWeights({ targetSum: this._targetSum })
      if (minSemiW && maxRetW) {
        const targetSemivariance = targetSemideviation ** 2
        const minSemi = this._semivariance(minSemiW)
        if (minSemi > targetSemivariance + 1e-10) {
          this._targetSum = 1
          return this._setSolvedWeights(minSemiW)
        }

        const maxSemi = this._semivariance(maxRetW)
        if (maxSemi <= targetSemivariance + 1e-10) {
          this._targetSum = 1
          return this._setSolvedWeights(maxRetW)
        }

        let lo = this._portfolioReturn(minSemiW)
        let hi = this._portfolioReturn(maxRetW)
        let best = minSemiW

        for (let iter = 0; iter < 50; iter += 1) {
          const mid = (lo + hi) / 2
          const w = this._solveSemivarianceWeights({
            targetSum: this._targetSum,
            minReturn: mid,
          })
          if (!w) {
            hi = mid
            continue
          }

          const semi = this._semivariance(w)
          if (semi <= targetSemivariance + 1e-10) {
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

    // If the max-return portfolio is already within the downside-risk cap,
    // the constrained optimum is exactly max-return.
    const maxRetWeightsByTicker = this.maxReturn()
    const candidate = this.tickers.map((ticker) => maxRetWeightsByTicker[ticker])
    const candidateSemi = Math.sqrt(Math.max(this._semivariance(candidate), 0))
    if (candidateSemi <= targetSemideviation + 1e-10) {
      this.weights = candidate
      this._targetSum = 1
      return this._mapVectorToWeights(this.weights)
    }

    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const semi = Math.sqrt(Math.max(this._semivariance(w), 0))
        const penalty = Math.max(0, semi - targetSemideviation) ** 2 * penaltyScale
        return -this._portfolioReturn(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    if (marketNeutral) {
      this._targetSum = 0
    }

    if (!marketNeutral && this._canUseExactSemivarianceQp()) {
      const w = this._solveSemivarianceWeights({
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
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale
        return this._semivariance(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  portfolioPerformance({ riskFreeRate = 0 } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    const ret = this._portfolioReturn(this.weights)
    const semiDev = Math.sqrt(Math.max(this._semivariance(this.weights), 0))
    const sortino = semiDev === 0 ? Number.POSITIVE_INFINITY : (ret - riskFreeRate) / semiDev
    return [ret, semiDev, sortino]
  }

  // Python alias
  min_semivariance(...args) {
    return this.minSemivariance(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }
}
