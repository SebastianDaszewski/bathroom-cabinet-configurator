import { normalize, type RuleResult } from '../domain/rules'
import { DEFAULT_CONFIG, parseConfig, type Config } from '../domain/schema'

type Scalar = string | number | boolean
type Flat = Record<string, Scalar>

function flatten(value: object, prefix = ''): Flat {
  const flat: Flat = {}
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof child === 'object' && child !== null) Object.assign(flat, flatten(child, path))
    else flat[path] = child as Scalar
  }
  return flat
}

function unflatten(flat: Record<string, unknown>): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.')
    let node = root
    for (const key of keys.slice(0, -1)) {
      node[key] = typeof node[key] === 'object' && node[key] !== null ? node[key] : {}
      node = node[key] as Record<string, unknown>
    }
    node[keys[keys.length - 1]] = value
  }
  return root
}

function parseScalar(raw: string, like: Scalar): unknown {
  if (typeof like === 'number') return raw.trim() === '' ? Number.NaN : Number(raw)
  if (typeof like === 'boolean') return raw === '1' || raw === 'true'
  return raw
}

function formatScalar(value: Scalar): string {
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}

const DEFAULTS = flatten(DEFAULT_CONFIG)

export function encodeConfig(config: Config): string {
  const params = new URLSearchParams()
  for (const [path, value] of Object.entries(flatten(config))) {
    if (value !== DEFAULTS[path]) params.set(path, formatScalar(value))
  }
  return params.toString()
}

export function hasConfigParams(search: string): boolean {
  const params = new URLSearchParams(search)
  return Object.keys(DEFAULTS).some((path) => params.has(path))
}

export function decodeConfig(search: string): RuleResult {
  const params = new URLSearchParams(search)
  const flat: Record<string, unknown> = { ...DEFAULTS }
  for (const [path, like] of Object.entries(DEFAULTS)) {
    const raw = params.get(path)
    if (raw !== null) flat[path] = parseScalar(raw, like)
  }
  return normalize(parseConfig(unflatten(flat)))
}
