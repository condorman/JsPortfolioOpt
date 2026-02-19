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

export class EfficientCVaR extends EfficientFrontier {
  constructor(expectedReturns, historicReturns, options = {}) {
    validateReturnsMatrix(historicReturns)
    const covProxy = covarianceFromReturns(historicReturns, options.frequency ?? 252)
    super(expectedReturns, covProxy, options)
    this.historicReturns = historicReturns
    this.beta = options.beta ?? 0.95
    this.frequency = options.frequency ?? 252
    this._alphaValue = null
    this._uValues = null
  }

  _portfolioReturns(weights) {
    return this.historicReturns.map((row) => dot(row, weights))
  }

  _cvar(weights) {
    const losses = this._portfolioReturns(weights).map((r) => -r)
    const sorted = losses.slice().sort((a, b) => a - b)
    const T = sorted.length
    const c = 1 / (T * (1 - this.beta))

    let best = Number.POSITIVE_INFINITY
    for (let i = 0; i < T; i += 1) {
      const alpha = sorted[i]
      let tail = 0
      for (let t = 0; t < T; t += 1) {
        tail += Math.max(losses[t] - alpha, 0)
      }
      best = Math.min(best, alpha + c * tail)
    }
    return best
  }

  _canUseExactLp() {
    return this._additionalObjectives.length === 0 && this._additionalConstraints.length === 0
  }

  _solveCvarLp({ targetSum = 1, targetReturn = null, targetCvar = null, maximizeReturn = false }) {
    const T = this.historicReturns.length
    const tailScale = 1 / (T * (1 - this.beta))
    const constraints = {
      sum_w: { equal: targetSum },
    }
    const variables = {}

    for (let i = 0; i < this.nAssets; i += 1) {
      constraints[`w_lb_${i}`] = { min: this._lowerBounds[i] }
      constraints[`w_ub_${i}`] = { max: this._upperBounds[i] }
    }

    for (let t = 0; t < T; t += 1) {
      constraints[`loss_${t}`] = { min: 0 }
      constraints[`u_nonneg_${t}`] = { min: 0 }
    }

    if (targetReturn != null) {
      constraints.ret_min = { min: targetReturn }
    }
    if (targetCvar != null) {
      constraints.cvar_max = { max: targetCvar }
    }

    for (let i = 0; i < this.nAssets; i += 1) {
      const variable = {
        obj: maximizeReturn ? this.expectedReturns[i] : 0,
        sum_w: 1,
        [`w_lb_${i}`]: 1,
        [`w_ub_${i}`]: 1,
      }
      for (let t = 0; t < T; t += 1) {
        variable[`loss_${t}`] = this.historicReturns[t][i]
      }
      if (targetReturn != null) {
        variable.ret_min = this.expectedReturns[i]
      }
      variables[`w_${i}`] = variable
    }

    const alpha = { obj: maximizeReturn ? 0 : -1 }
    for (let t = 0; t < T; t += 1) {
      alpha[`loss_${t}`] = 1
    }
    if (targetCvar != null) {
      alpha.cvar_max = 1
    }
    variables.alpha = alpha

    for (let t = 0; t < T; t += 1) {
      const variable = {
        obj: maximizeReturn ? 0 : -tailScale,
        [`loss_${t}`]: 1,
        [`u_nonneg_${t}`]: 1,
      }
      if (targetCvar != null) {
        variable.cvar_max = tailScale
      }
      variables[`u_${t}`] = variable
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
    const uValues = Array.from({ length: T }, (_, t) => Number(result[`u_${t}`] ?? 0))
    return { weights, alphaValue, uValues }
  }

  _setLpSolution(solution) {
    this.weights = solution.weights.slice()
    this._alphaValue = solution.alphaValue
    this._uValues = solution.uValues.slice()
    return this._mapVectorToWeights(this.weights)
  }

  minCvar({ marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({ targetSum, maximizeReturn: false })
      if (solution) {
        return this._setLpSolution(solution)
      }
    }

    if (marketNeutral) {
      this._targetSum = 0
    }
    const result = this._optimize(this._penalized((w) => this._cvar(w)))
    this._targetSum = 1
    return result
  }

  efficientRisk(targetCvar, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({
        targetSum,
        targetCvar,
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
        const cvar = this._cvar(w)
        const penalty = Math.max(0, cvar - targetCvar) ** 2 * penaltyScale
        return -this._portfolioReturn(w) + penalty
      }),
    )
    this._targetSum = 1
    return result
  }

  efficientReturn(targetReturn, { marketNeutral = false } = {}) {
    const targetSum = marketNeutral ? 0 : 1
    if (this._canUseExactLp()) {
      const solution = this._solveCvarLp({
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
        return this._cvar(w) + penalty
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
    if (this._alphaValue != null && this._uValues != null) {
      const T = this.historicReturns.length
      const tailScale = 1 / (T * (1 - this.beta))
      const cvar = this._alphaValue + tailScale * this._uValues.reduce((acc, v) => acc + v, 0)
      return [mu, cvar]
    }
    return [mu, this._cvar(this.weights)]
  }

  min_cvar(...args) {
    return this.minCvar(...args)
  }

  efficient_risk(...args) {
    return this.efficientRisk(...args)
  }

  efficient_return(...args) {
    return this.efficientReturn(...args)
  }
}
