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
