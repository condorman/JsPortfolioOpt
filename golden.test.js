import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturePath = path.join(__dirname, 'golden-PyPortfolioOpt', 'golden.json')
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))

describe('golden fixture schema', () => {
  it('contains required top-level keys', () => {
    for (const key of ['schemaVersion', 'baseline', 'environment', 'datasets', 'cases', 'coverage']) {
      expect(fixture).toHaveProperty(key)
    }
  })

  it('contains 295 scenarios and valid coverage counters', () => {
    expect(Array.isArray(fixture.cases)).toBe(true)
    expect(fixture.cases.length).toBe(295)
    expect(fixture.coverage.cases_from_tests).toBe(289)
    expect(fixture.coverage.cases_extra_api).toBe(6)
    expect(fixture.coverage.total_cases).toBe(295)
  })

  it('ensures every case has the expected schema fields', () => {
    for (const scenario of fixture.cases) {
      for (const key of [
        'id',
        'module',
        'source_test',
        'call',
        'inputs_ref',
        'expected',
        'tolerance',
        'expectation_kind',
      ]) {
        expect(scenario).toHaveProperty(key)
      }
    }
  })

  it('has no missing API coverage and gate is passed', () => {
    expect(fixture.coverage.missingApi).toEqual([])
    expect(fixture.coverage.gatePassed).toBe(true)
  })
})

describe('golden fixture critical invariants', () => {
  it('includes all 6 extra API scenarios', () => {
    const extras = fixture.cases.filter((s) => s.id.startsWith('extra::')).map((s) => s.id)
    expect(extras.sort()).toEqual([
      'extra::base_optimizer::deepcopy',
      'extra::base_optimizer::is_parameter_defined',
      'extra::base_optimizer::update_parameter_value',
      'extra::black_litterman::default_omega',
      'extra::black_litterman::idzorek_method',
      'extra::risk_models::min_cov_determinant',
    ])
  })

  it('contains known upstream skipped tests in metadata', () => {
    expect(fixture.coverage.upstreamSkips.length).toBe(4)
  })

  it('tracks pass/fail scenario counters', () => {
    expect(fixture.coverage.scenarioPasses + fixture.coverage.scenarioFailures).toBe(
      fixture.coverage.total_cases,
    )
  })
})
