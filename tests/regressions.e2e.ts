import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('reload restores completed days instead of losing the rescue plan', async ({ app, screen, browser }) => {
  await app.open();
  await screen.getByRole('button', '🌱 MY money tree is DYING').tap();
  await screen.getByRole('button', 'Build my 14-day revive plan →').tap();
  await screen.getByRole('button', 'Mark day 1 done').tap();
  await expect(screen.getByText('1 / 14 days done')).toBeVisible();
  await browser.reload();
  await expect(screen.getByText('1 / 14 days done')).toBeVisible();
});

test('reporting improvement preserves actual checked days', async ({ app, screen, browser }) => {
  await app.open();
  await screen.getByRole('button', '🌱 MY money tree is DYING').tap();
  await screen.getByRole('button', 'Build my 14-day revive plan →').tap();
  await screen.getByRole('button', /doing better/).tap();
  const progress = await browser.evaluate(() => Object.keys(localStorage)
    .filter(key => key.startsWith('planttriage.plan.'))
    .map(key => JSON.parse(localStorage.getItem(key)!).checked));
  expect(progress.flat().filter(Boolean)).toHaveLength(0);
});

test('wet and dry symptoms warn of mixed signals', async ({ app, screen }) => {
  await app.open();
  await screen.getByRole('button', '📷 Help my plant').tap();
  await screen.getByRole('button', 'Skip photo for now').tap();
  await screen.getByRole('button', /Yellowing leaves/).tap();
  await screen.getByRole('button', /Drooping stems/).tap();
  await screen.getByRole('button', /Wilting/).tap();
  await screen.getByRole('button', 'Diagnose →').tap();
  await expect(screen.getByText('🫥 Mixed signals:')).toBeVisible();
});
