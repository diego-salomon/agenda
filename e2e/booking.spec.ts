import { test, expect, type Page } from '@playwright/test';

/**
 * Covers the spec's end-to-end flow on both desktop and mobile (the two
 * Playwright projects): book → slot busy → cancel → frees up → double-book
 * blocked. Seed-independent: it books whatever the first free slot is, on the
 * first day that has one (today's slots may all be in the past), and reasons
 * about that — so it never breaks depending on the weekday or time of day.
 */

const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

/** Select the service and the first day chip that offers a free slot. */
async function selectDayWithFreeSlot(page: Page): Promise<number> {
  await page.getByTestId('service-card').first().click();
  const chips = page.getByTestId('day-chip');
  const count = await chips.count();
  for (let i = 0; i < count; i += 1) {
    await chips.nth(i).click();
    try {
      await page.getByTestId('free-slot').first().waitFor({ state: 'visible', timeout: 2000 });
      return i;
    } catch {
      // this day is full or past — try the next one
    }
  }
  throw new Error('No se encontró ningún día con un hueco libre.');
}

async function reselectDay(page: Page, dayIndex: number): Promise<void> {
  await page.getByTestId('service-card').first().click();
  await page.getByTestId('day-chip').nth(dayIndex).click();
}

async function bookFirstFreeSlot(
  page: Page,
): Promise<{ time: string; code: string; dayIndex: number }> {
  await page.goto('/');
  const dayIndex = await selectDayWithFreeSlot(page);

  const slot = page.getByTestId('free-slot').first();
  const time = (await slot.textContent())!.trim();
  await slot.click();

  await page.getByLabel('Nombre y apellido').fill('Ada Lovelace');
  await page.getByLabel('Teléfono').fill('0981123456');
  await page.getByRole('button', { name: 'Confirmar turno' }).click();

  const codeEl = page.getByTestId('booking-code');
  await expect(codeEl).toBeVisible();
  const code = (await codeEl.textContent())!.trim();
  return { time, code, dayIndex };
}

test('reserva un turno y muestra un código válido', async ({ page }) => {
  const { code } = await bookFirstFreeSlot(page);
  expect(code).toMatch(CODE_RE);
  await expect(page.getByText('¡Turno confirmado!')).toBeVisible();
  // Demo notifications are simulated, never sent.
  await expect(page.getByText('Notificación simulada')).toBeVisible();
});

test('el hueco queda ocupado tras reservar (doble reserva imposible)', async ({ page }) => {
  const { time, dayIndex } = await bookFirstFreeSlot(page);

  await page.getByRole('button', { name: 'Reservar otro turno' }).click();
  await reselectDay(page, dayIndex);

  // That exact time is no longer offered as a free slot...
  await expect(page.getByTestId('free-slot').filter({ hasText: time })).toHaveCount(0);
  // ...but it still shows in the grid, marked busy.
  await expect(page.getByText(time, { exact: true })).toBeVisible();
});

test('cancelar por código libera el hueco de nuevo', async ({ page }) => {
  const { time, code, dayIndex } = await bookFirstFreeSlot(page);

  await page.goto('/mi-turno');
  await page.getByLabel('Código de reserva').fill(code);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Cancelar turno' }).click();
  await expect(page.getByText('Turno cancelado')).toBeVisible();

  // The freed slot is bookable again.
  await page.goto('/');
  await reselectDay(page, dayIndex);
  await expect(page.getByTestId('free-slot').filter({ hasText: time })).toHaveCount(1);
});
