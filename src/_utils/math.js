export function assertArray(name, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array`)
  }
}

export function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice())
}

export function isMatrix(matrix) {
  return Array.isArray(matrix) && matrix.every((row) => Array.isArray(row))
}

export function validateMatrix(name, matrix) {
  if (!isMatrix(matrix)) {
    throw new TypeError(`${name} must be a 2D numeric array`)
  }
  const width = matrix[0]?.length ?? 0
  if (width === 0) {
    throw new Error(`${name} cannot be empty`)
  }
  for (const row of matrix) {
    if (row.length !== width) {
      throw new Error(`${name} rows must have equal length`)
    }
    for (const cell of row) {
      if (!Number.isFinite(cell)) {
        throw new Error(`${name} contains non-finite values`)
      }
    }
  }
}

export function transpose(matrix) {
  validateMatrix('matrix', matrix)
  const rows = matrix.length
  const cols = matrix[0].length
  const out = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out[c][r] = matrix[r][c]
    }
  }
  return out
}

export function dot(a, b) {
  assertArray('a', a)
  assertArray('b', b)
  if (a.length !== b.length) {
    throw new Error('dot: vectors must have same length')
  }
  let sum = 0
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i]
  }
  return sum
}

export function matVec(matrix, vector) {
  validateMatrix('matrix', matrix)
  assertArray('vector', vector)
  if (matrix[0].length !== vector.length) {
    throw new Error('matVec: incompatible shapes')
  }
  return matrix.map((row) => dot(row, vector))
}

export function matMul(a, b) {
  validateMatrix('a', a)
  validateMatrix('b', b)
  if (a[0].length !== b.length) {
    throw new Error('matMul: incompatible shapes')
  }
  const out = Array.from({ length: a.length }, () => Array(b[0].length).fill(0))
  for (let i = 0; i < a.length; i += 1) {
    for (let k = 0; k < b.length; k += 1) {
      const aik = a[i][k]
      for (let j = 0; j < b[0].length; j += 1) {
        out[i][j] += aik * b[k][j]
      }
    }
  }
  return out
}

export function mean(values) {
  assertArray('values', values)
  if (values.length === 0) {
    throw new Error('mean: values cannot be empty')
  }
  return values.reduce((acc, v) => acc + v, 0) / values.length
}

export function variance(values) {
  assertArray('values', values)
  if (values.length < 2) {
    return 0
  }
  const m = mean(values)
  let acc = 0
  for (const v of values) {
    const d = v - m
    acc += d * d
  }
  return acc / (values.length - 1)
}

export function covariance(x, y) {
  assertArray('x', x)
  assertArray('y', y)
  if (x.length !== y.length) {
    throw new Error('covariance: vectors must have same length')
  }
  if (x.length < 2) {
    return 0
  }
  const mx = mean(x)
  const my = mean(y)
  let acc = 0
  for (let i = 0; i < x.length; i += 1) {
    acc += (x[i] - mx) * (y[i] - my)
  }
  return acc / (x.length - 1)
}

export function column(matrix, index) {
  validateMatrix('matrix', matrix)
  return matrix.map((row) => row[index])
}

export function normalizeWeights(weights) {
  assertArray('weights', weights)
  const sum = weights.reduce((acc, w) => acc + w, 0)
  if (sum === 0) {
    throw new Error('weights sum cannot be zero')
  }
  return weights.map((w) => w / sum)
}
