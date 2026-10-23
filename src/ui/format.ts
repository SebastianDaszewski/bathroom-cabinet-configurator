const PLN = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const DECIMAL = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

export function formatPln(grosze: number): string {
  return PLN.format(grosze / 100)
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${DECIMAL.format(quantity)} ${unit}`
}

export function pluralPl(count: number, [one, few, many]: [string, string, string]): string {
  if (count === 1) return one
  const lastTwo = count % 100
  const last = count % 10
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few
  return many
}
