import { portfolioReturn, portfolioVariance } from './objective_functions.js'
import { covToCorr } from './risk_models.js'

function validateReturnsMatrix(returns) {
  if (!Array.isArray(returns) || returns.length === 0) {
    throw new TypeError('returns are not a matrix')
  }
  const cols = returns[0].length
  for (const row of returns) {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new TypeError('returns rows must have equal length')
    }
  }
}

function validateCovarianceMatrix(covMatrix) {
  if (!Array.isArray(covMatrix) || covMatrix.length === 0) {
    throw new TypeError('covMatrix is not a matrix')
  }
  const n = covMatrix.length
  for (const row of covMatrix) {
    if (!Array.isArray(row) || row.length !== n) {
      throw new TypeError('covMatrix must be square')
    }
  }
}

function covarianceFromReturns(returns, frequency = 1) {
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

function correlationFromReturns(returns) {
  const cov = covarianceFromReturns(returns, 1)
  return covToCorr(cov)
}

function roundMatrix(matrix, digits = 6) {
  const scale = 10 ** digits
  return matrix.map((row) => row.map((v) => Math.round(v * scale) / scale))
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function pairKey(a, b) {
  return a < b ? `${a}::${b}` : `${b}::${a}`
}

function singleLinkage(distanceMatrix) {
  const n = distanceMatrix.length
  const distances = new Map()
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      distances.set(pairKey(i, j), distanceMatrix[i][j])
    }
  }

  const size = new Map(Array.from({ length: n }, (_, i) => [i, 1]))
  let active = Array.from({ length: n }, (_, i) => i)
  const linkage = []
  let nextId = n

  const getDistance = (a, b) => distances.get(pairKey(a, b))
  const setDistance = (a, b, v) => {
    distances.set(pairKey(a, b), v)
  }

  while (active.length > 1) {
    let bestA = active[0]
    let bestB = active[1]
    let bestDistance = getDistance(bestA, bestB)

    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i]
        const b = active[j]
        const d = getDistance(a, b)
        if (
          d < bestDistance - 1e-12 ||
          (Math.abs(d - bestDistance) <= 1e-12 &&
            (a < bestA || (a === bestA && b < bestB)))
        ) {
          bestA = a
          bestB = b
          bestDistance = d
        }
      }
    }

    const count = (size.get(bestA) ?? 0) + (size.get(bestB) ?? 0)
    linkage.push([bestA, bestB, bestDistance, count])

    const survivors = active.filter((id) => id !== bestA && id !== bestB)
    for (const k of survivors) {
      const d = Math.min(getDistance(bestA, k), getDistance(bestB, k))
      setDistance(nextId, k, d)
    }

    size.set(nextId, count)
    active = [...survivors, nextId].sort((a, b) => a - b)
    nextId += 1
  }

  return linkage
}

function quasiDiagonal(linkage, nLeaves) {
  const nodes = new Map()
  for (let i = 0; i < nLeaves; i += 1) {
    nodes.set(i, { leaf: true })
  }
  for (let i = 0; i < linkage.length; i += 1) {
    const [left, right] = linkage[i]
    nodes.set(nLeaves + i, { leaf: false, left, right })
  }

  const rootId = nLeaves + linkage.length - 1
  const out = []
  const walk = (id) => {
    const node = nodes.get(id)
    if (!node) {
      throw new Error('invalid linkage tree')
    }
    if (node.leaf) {
      out.push(id)
      return
    }
    walk(node.left)
    walk(node.right)
  }
  walk(rootId)
  return out
}

function getClusterVariance(covMatrix, indices) {
  const diagInv = indices.map((idx) => 1 / covMatrix[idx][idx])
  const denom = diagInv.reduce((acc, v) => acc + v, 0)
  const weights = diagInv.map((v) => v / denom)

  let variance = 0
  for (let i = 0; i < indices.length; i += 1) {
    for (let j = 0; j < indices.length; j += 1) {
      variance += weights[i] * covMatrix[indices[i]][indices[j]] * weights[j]
    }
  }
  return variance
}

function rawHrpAllocation(covMatrix, orderedIndices) {
  const weights = Array(covMatrix.length).fill(0)
  for (const idx of orderedIndices) {
    weights[idx] = 1
  }

  let clusterItems = [orderedIndices.slice()]
  while (clusterItems.length > 0) {
    clusterItems = clusterItems.flatMap((items) => {
      if (items.length <= 1) {
        return []
      }
      const mid = Math.floor(items.length / 2)
      return [items.slice(0, mid), items.slice(mid)]
    })

    for (let i = 0; i < clusterItems.length; i += 2) {
      const first = clusterItems[i]
      const second = clusterItems[i + 1]
      const firstVariance = getClusterVariance(covMatrix, first)
      const secondVariance = getClusterVariance(covMatrix, second)
      const alpha = 1 - firstVariance / (firstVariance + secondVariance)
      for (const idx of first) {
        weights[idx] *= alpha
      }
      for (const idx of second) {
        weights[idx] *= 1 - alpha
      }
    }
  }
  return weights
}

export class HRPOpt {
  constructor(returns = null, { covMatrix = null, tickers = null } = {}) {
    if (returns == null && covMatrix == null) {
      throw new Error('Either returns or covMatrix must be provided')
    }
    if (returns != null) {
      validateReturnsMatrix(returns)
    }
    if (covMatrix != null) {
      validateCovarianceMatrix(covMatrix)
    }

    this.returns = returns
    this.covMatrix = covMatrix
    this.clusters = null
    const nAssets = returns?.[0]?.length ?? covMatrix?.length ?? 0
    this.tickers = tickers ?? Array.from({ length: nAssets }, (_, i) => String(i))
    this.weights = null
  }

  optimize(linkageMethod = 'single') {
    if (linkageMethod !== 'single') {
      throw new Error('linkage_method must be one recognised by scipy')
    }

    let cov
    let corr
    if (this.returns == null) {
      cov = this.covMatrix
      corr = roundMatrix(covToCorr(this.covMatrix), 6)
    } else {
      cov = covarianceFromReturns(this.returns, 1)
      corr = correlationFromReturns(this.returns)
    }

    const n = corr.length
    const distance = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) =>
        Math.sqrt(clamp((1 - corr[i][j]) / 2, 0, 1)),
      ),
    )

    this.clusters = singleLinkage(distance)
    const sortIx = quasiDiagonal(this.clusters, n)
    const hrpWeights = rawHrpAllocation(cov, sortIx)

    this.weights = hrpWeights.slice()
    return Object.fromEntries(this.tickers.map((ticker, i) => [ticker, this.weights[i]]))
  }

  portfolioPerformance({ riskFreeRate = 0, frequency = 252 } = {}) {
    if (this.weights == null) {
      throw new Error('portfolio_performance requires optimize() first')
    }

    let cov
    let mu = null
    if (this.returns == null) {
      cov = this.covMatrix
    } else {
      cov = covarianceFromReturns(this.returns, frequency)
      mu = Array.from({ length: this.tickers.length }, (_, c) => {
        let acc = 0
        for (const row of this.returns) {
          acc += row[c]
        }
        return (acc / this.returns.length) * frequency
      })
    }

    const volatility = Math.sqrt(Math.max(portfolioVariance(this.weights, cov), 0))
    if (mu == null) {
      return [null, volatility, null]
    }

    const annualReturn = portfolioReturn(this.weights, mu, { negative: false })
    const sharpe = volatility === 0 ? Number.POSITIVE_INFINITY : (annualReturn - riskFreeRate) / volatility
    return [annualReturn, volatility, sharpe]
  }

  portfolio_performance(...args) {
    return this.portfolioPerformance(...args)
  }
}
