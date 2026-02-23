import { expect, test } from '@playwright/test';

test('viewer renders toolbar/showcase and can add a node', async ({ page }) => {
  await page.goto('/');

  const toolbar = page.locator('.toolbar');
  const showcase = page.locator('#BPMNShapesShowcasePanel');
  const canvas = page.locator('.canvas__frame');
  const nodes = page.locator('.scalable_components .diagram__node[data-id]');
  const firstShowcaseItem = showcase.locator('.diagram__showcase_item').first();

  await expect(toolbar).toBeVisible();
  await expect(showcase).toBeVisible();
  await expect(showcase.getByText('Nodes')).toBeVisible();
  await expect(showcase.locator('.diagram__showcase_item')).toHaveCount(4);
  await expect(canvas).toBeVisible();

  const beforeCount = await nodes.count();

  const itemBox = await firstShowcaseItem.boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(itemBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();

  await page.mouse.move(
    itemBox!.x + itemBox!.width / 2,
    itemBox!.y + itemBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBox!.x + canvasBox!.width * 0.5,
    canvasBox!.y + canvasBox!.height * 0.5,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect.poll(async () => nodes.count()).toBeGreaterThan(beforeCount);
});
