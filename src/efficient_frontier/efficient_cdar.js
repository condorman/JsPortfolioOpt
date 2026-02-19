import { EfficientFrontier } from './efficient_frontier.js'
import { dot } from '../_utils/math.js'
import solver from 'javascript-lp-solver'

function validateReturnsMatrix(historicReturns) {
  if (!Array.isArray(historicReturns) || historicReturns.length === 0) {
    throw new Error('historicReturns must be a non-empty matrix')
  }
  const cols = historicReturns[0].length
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

export class EfficientCDaR extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix(historicReturns)
    const covProxy = covarianceFromReturns(historicReturns, options.frequency ?? 252)
    super(expectedReturns, covProxy, options)
    this.historicReturns = historicReturns
    this.beta = options.beta ?? 0.95
    this.frequency = options.frequency ?? 252
    this._alphaValue = null
    this._zValues = null
  }

  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights))
  }

  _cdar(weights) {
    const rets = this._portfolioReturns(weights)
    const cumulative = []
    let running = 0
    for (const r of rets) {
      running += r
      cumulative.push(running)
    }
    let maxSoFar = Number.NEGATIVE_INFINITY
    const drawdowns = cumulative.map((c) => {
      if (c > maxSoFar) {
        maxSoFar = c
      }
      return maxSoFar - c
    })
    const sorted = drawdowns.slice().sort((a, b) => a - b)
    const T = sorted.length
    const c = 1 / (T * (1 - this.beta))
    let best = Number.POSITIVE_INFINITY
    for (let i = 0; i < T; i += 1) {
      const alpha = sorted[i]
      let tail = 0
      for (let t = 0; t < T; t += 1) {
        tail += Math.max(drawdowns[t] - alpha, 0)
      }
      best = Math.min(best, alpha + c * tail)
    }
    return best
  }

  _canUseExactLp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0
  }

  _solveCdarLp({ targetSum = 1, targetReturn = null, targetCdar = null, maximizeReturn = false }) {
    const T = this.historicReturns.length
    const tailScale = 1 / (T * (1 - this.beta))
    const constraints = {
      sum_w: { equal: targetSum },
      u0_eq: { equal: 0 },
    }
    const variables = {}

    for (let i = 0; i < this.nAssets; i += 1) {
      constraints[`w_lb_${i}`] = { min: this._lowerBounds[i] }
      constraints[`w_ub_${i}`] = { max: this._upperBounds[i] }
    }

    for (let t = 0; t < T; t += 1) {
      constraints[`z_ge_${t}`] = { min: 0 } // z_t - u_{t+1} + alpha >= 0
      constraints[`u_dyn_${t}`] = { min: 0 } // u_{t+1} - u_t + r_t @ w >= 0
      constraints[`z_nonneg_${t}`] = { min: 0 }
      constraints[`u_nonneg_${t + 1}`] = { min: 0 }
    }

    if (targetReturn != null) {
      constraints.ret_min = { min: targetReturn }
    }
    if (targetCdar != null) {
      constraints.cdar_max = { max: targetCdar }
    }

    for (let i = 0; i < this.nAssets; i += 1) {
      const variable = {
        obj: maximizeReturn ? this.expectedReturns[i] : 0,
        sum_w: 1,
        [`w_lb_${i}`]: 1,
        [`w_ub_${i}`]: 1,
      }
      for (let t = 0; t < T; t += 1) {
        variable[`u_dyn_${t}`] = this.historicReturns[t][i]
      }
      if (targetReturn != null) {
        variable.ret_min = this.expectedReturns[i]
      }
      variables[`w_${i}`] = variable
    }

    const alpha = { obj: maximizeReturn ? 0 : -1 }
    for (let t = 0; t < T; t += 1) {
      alpha[`z_ge_${t}`] = 1
    }
    if (targetCdar != null) {
      alpha.cdar_max = 1
    }
    variables.alpha = alpha

    for (let k = 0; k <= T; k += 1) {
      const variable = {}
      if (k === 0) {
        variable.u0_eq = 1
      } else {
        variable[`u_nonneg_${k}`] = 1
        variable[`z_ge_${k - 1}`] = -1
      }
      if (k > 0) {
        variable[`u_dyn_${k - 1}`] = 1
      }
      if (k < T) {
        variable[`u_dyn_${k}`] = (variable[`u_dyn_${k}`] ?? 0) - 1
      }
      variables[`u_${k}`] = variable
    }

    for (let t = 0; t < T; t += 1) {
      const variable = {
        obj: maximizeReturn ? 0 : -tailScale,
        [`z_ge_${t}`]: 1,
        [`z_nonneg_${t}`]: 1,
      }
      if (targetCdar != null) {
        variable.cdar_max = tailScale
      }
      variables[`z_${t}`] = variable
    }

    const model = {
      optimize: 'obj',
      opType: 'max',
      constraints,
      variables,
    }
    const result = solver.Solve(model)
    if (!result?.feasible) {
      return null
    }

    const weights = Array.from(
      { length: this.nAssets },
      (_, i) => Number(result[`w_${i}`] ?? 0),
    )
    const alphaValue = Number(result.alpha ?? 0)
    const zValues = Array.from({ length: T }, (_, t) => Number(result[`z_${t}`] ?? 0))
    return { weights, alphaValue, zValues }
  }

  _setLpSolution(solution) {
    this.weights = solution.weights.slice()
    this._alphaValue = solution.alphaValue
    this._zValues = solution.zValues.slice()
    return this._mapVectorToWeights(this.weights)
  }

  minCdar({ marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({ targetSum, maximizeReturn: false })
      if (solution) {
        return this._setLpSolution(solution)
      }
    }

    if (marketNeutral) {
      this._targetSum = 0
    }
    const result = this._optimize(this._penalized((w) => this._cdar(w)))
    this._targetSum = 1
    return result
  }

  efficientRisk(targetCdar, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({
        targetSum,
        targetCdar,
        maximizeReturn: true,
      })
      if (solution) {
        return this._setLpSolution(solution)
      }
    }

    if (marketNeutral) {
      this._targetSum = 0
    }
    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const cdar = this._cdar(w)
        const penalty = Math.max(0, cdar - targetCdar) ** 2 * penaltyScale
        return -this._portfolioReturn(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCdarLp({
        targetSum,
        targetReturn,
        maximizeReturn: false,
      })
      if (solution) {
        return this._setLpSolution(solution)
      }
    }

    if (marketNeutral) {
      this._targetSum = 0
    }
    const penaltyScale = 5e3
    const result = this._optimize(
      this._penalized((w) => {
        const penalty = Math.max(0, targetReturn - this._portfolioReturn(w)) ** 2 * penaltyScale
        return this._cdar(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  portfolioPerformance() {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires weights to be computed first')
    }
    const mu = this._portfolioReturn(this.weights)
    if (this._alphaValue != null && this._zValues != null) {
      const T = this.historicReturns.length
      const tailScale = 1 / (T * (1 - this.beta))
      const cdar = this._alphaValue + tailScale * this._zValues.reduce((acc, v) => acc + v, 0)
      return [mu, cdar]
    }
    return [mu, this._cdar(this.weights)]
  }

  min_cdar(...args) {
    return this.minCdar(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }
}
