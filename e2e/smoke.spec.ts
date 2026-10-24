import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const SCENE_RENDER = { timeout: 20_000 }

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('renders the configurator with a 3D view and a price', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Szafka pod umywalkę na wymiar' })).toBeVisible()
  await expect(page.locator('.scene canvas')).toBeVisible()
  await expect(page.locator('.price-amount')).toHaveText(/zł/)
})

test('a wider cabinet costs more and is kept in the link', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Zapisz zdjęcie' })).toBeEnabled(SCENE_RENDER)
  const price = page.locator('.price-amount')
  const before = await price.textContent()

  const width = page.getByRole('textbox', { name: 'Szerokość' })
  await width.fill('800')
  await width.press('Enter')

  await expect(price).not.toHaveText(before ?? '')
  await expect(page).toHaveURL(/width=800/, SCENE_RENDER)
})

test('downloads the cut list as CSV from the summary', async ({ page }) => {
  await page.getByRole('tab', { name: /Podsumowanie/ }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Pobierz listę formatek (CSV)' }).click(),
  ])

  expect(download.suggestedFilename()).toBe('szafka-600x500x500-formatki.csv')
  const content = await readFile(await download.path(), 'utf-8')
  expect(content).toContain('Nazwa;Materiał;Dekor')
  expect(content).toContain('Wieniec górny')
})

test('asks before starting over', async ({ page }) => {
  await page.getByRole('button', { name: 'Zacznij od nowa' }).click()
  const dialog = page.getByRole('dialog', { name: 'Zacząć od nowa?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Anuluj' }).click()
  await expect(dialog).toBeHidden()
})

test('fits the screen without horizontal scrolling', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('shows what each option adds to the price', async ({ page }) => {
  await page.getByRole('tab', { name: /Szuflady/ }).click()
  const tipOn = page.locator('.segment', { hasText: 'Otwieranie naciśnięciem (Tip-On)' })
  await expect(tipOn.locator('.segment-note')).toHaveText(/^\+\d/)

  await page.getByRole('button', { name: 'Co oznaczają opcje: Otwieranie' }).click()
  await expect(page.getByText('Szuflada domyka się sama')).toBeVisible()
})

test('lets the customer pick the handle style and finish', async ({ page }) => {
  await page.getByRole('tab', { name: /Fronty/ }).click()
  await page.locator('.segment', { hasText: 'Jeden uchwyt' }).click()

  const price = page.locator('.price-amount')
  const before = await price.textContent()
  const gold = page.locator('.segment', { hasText: 'Złoty szczotkowany' })
  await expect(gold.locator('.segment-note')).toHaveText(/^\+\d/)

  await page.locator('.segment', { hasText: 'Łukowy' }).click()
  await gold.click()
  await expect(price).not.toHaveText(before ?? '')
  await expect(page).toHaveURL(/handleStyle=bow/)
  await expect(page).toHaveURL(/handleFinish=gold/)
})

async function openInquiry(page: Page) {
  await page.getByRole('tab', { name: /Podsumowanie/ }).click()
  await page.getByRole('button', { name: 'Wyślij zapytanie' }).click()
  return page.getByRole('dialog', { name: 'Wyślij zapytanie' })
}

async function fillInquiry(dialog: Locator) {
  await dialog.getByLabel('Imię i nazwisko').fill('Anna Nowak')
  await dialog.getByLabel('Adres e-mail').fill('anna@example.com')
  await dialog.getByRole('button', { name: 'Wyślij zapytanie' }).click()
}

test('validates the inquiry before sending it', async ({ page }) => {
  const dialog = await openInquiry(page)
  await dialog.getByRole('button', { name: 'Wyślij zapytanie' }).click()

  await expect(dialog.getByText('Podaj imię i nazwisko.')).toBeVisible()
  await expect(dialog.getByText('Podaj poprawny adres e-mail.')).toBeVisible()
})

test('sends the inquiry with the configuration', async ({ page }) => {
  let sent: { inquiry: { name: string }; link: string } | undefined
  await page.route('**/api/inquiry', async (route) => {
    sent = route.request().postDataJSON()
    await route.fulfill({ json: { ok: true } })
  })

  await fillInquiry(await openInquiry(page))

  await expect(page.getByRole('dialog', { name: 'Zapytanie wysłane' })).toBeVisible()
  expect(sent?.inquiry.name).toBe('Anna Nowak')
  expect(sent?.link).toMatch(/^http/)
})

test('offers the mail client when sending fails', async ({ page }) => {
  await page.route('**/api/inquiry', (route) => route.fulfill({ status: 502, json: {} }))
  const dialog = await openInquiry(page)
  await fillInquiry(dialog)

  await expect(dialog.getByRole('alert')).toContainText('Nie udało się wysłać zapytania')
  await expect(dialog.getByRole('button', { name: 'Otwórz w programie pocztowym' })).toBeVisible()
})

test('switches camera views', async ({ page }) => {
  const front = page.getByRole('button', { name: 'Przód', exact: true })
  await front.click()
  await expect(front).toHaveAttribute('aria-pressed', 'true')
})

test('saves a picture of the 3D view', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Zapisz zdjęcie' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('szafka-600x500x500.png')
})
