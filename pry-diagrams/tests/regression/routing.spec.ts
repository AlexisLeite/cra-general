import { expect, test, type Page } from '@playwright/test';
import {
  assertArrivesAtTargetOrientation,
  assertConnectsToSelectedGateways,
  assertEndpointModes,
  assertLeavesSourceOrientation,
  assertNoAdjacentDuplicates,
  assertNoRedundantCollinearTriples,
  assertOrthogonal,
  connectProgrammatically,
  connectGatewaysUi,
  connectorPreview,
  diagramFixture,
  dragLocatorBy,
  dragNodeBy,
  endMouseDrag,
  exportDiagram,
  hasManualPoints,
  importFixture,
  moveMouse,
  normalizeFromGatewayFrame,
  nodeBoxMap,
  segmentLength,
  setEdgeHover,
  snapshot,
  startConnectionDrag,
  taskNode,
  type DiagramSnapshot,
  type EdgeSnapshot,
  type Orientation,
  waitForSingleEdge,
} from './routing.helpers';

const ORIENTATIONS: Orientation[] = ['left', 'right', 'up', 'down'];

async function openAndLoad(page: Page, fixture: unknown) {
  await page.goto('/');
  await importFixture(page, fixture);
}

function assertEdgeRoutingInvariants(edge: EdgeSnapshot, diagram?: DiagramSnapshot) {
  assertOrthogonal(edge);
  assertNoAdjacentDuplicates(edge);
  assertEndpointModes(edge);
  if (diagram) {
    assertConnectsToSelectedGateways(edge, nodeBoxMap(diagram));
  }
}

function assertOrthogonalPoints(points: { x: number; y: number }[]) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    expect(dx < 0.001 || dy < 0.001).toBeTruthy();
  }
}

function expectPointNear(
  point: { x: number; y: number },
  expected: { x: number; y: number },
  eps = 1,
) {
  expect(Math.abs(point.x - expected.x)).toBeLessThanOrEqual(eps);
  expect(Math.abs(point.y - expected.y)).toBeLessThanOrEqual(eps);
}

function reversedEdge(edge: EdgeSnapshot): EdgeSnapshot {
  return {
    ...edge,
    fromNodeId: edge.toNodeId,
    fromGatewayId: edge.toGatewayId,
    toNodeId: edge.fromNodeId,
    toGatewayId: edge.fromGatewayId,
    displacementStart: edge.displacementEnd,
    displacementEnd: edge.displacementStart,
    steps: [...edge.steps].reverse(),
  };
}

function assertSmoothOrthogonalPath(edge: EdgeSnapshot) {
  assertOrthogonal(edge);
  assertNoAdjacentDuplicates(edge);
  assertNoRedundantCollinearTriples(edge.steps);
  assertNoReducibleOrthogonalDetours(edge);
}

function assertNoReducibleOrthogonalDetours(edge: EdgeSnapshot) {
  for (let i = 0; i < edge.steps.length - 3; i++) {
    const a = edge.steps[i];
    const b = edge.steps[i + 1];
    const c = edge.steps[i + 2];
    const d = edge.steps[i + 3];
    const isOrthChain =
      (Math.abs(a.x - b.x) < 0.001 || Math.abs(a.y - b.y) < 0.001) &&
      (Math.abs(b.x - c.x) < 0.001 || Math.abs(b.y - c.y) < 0.001) &&
      (Math.abs(c.x - d.x) < 0.001 || Math.abs(c.y - d.y) < 0.001);
    const adAligned = Math.abs(a.x - d.x) < 0.001 || Math.abs(a.y - d.y) < 0.001;
    if (!isOrthChain || !adAligned) continue;

    const modeB = b.mode ?? 'auto';
    const modeC = c.mode ?? 'auto';
    if (modeB === 'auto' && modeC === 'auto') {
      throw new Error(
        `reducible orthogonal detour at ${i}: ${JSON.stringify({ a, b, c, d, steps: edge.steps })}`,
      );
    }
  }
}

function perpendicularDragForSegment(
  a: { x: number; y: number },
  b: { x: number; y: number },
  amount = 80,
) {
  const horizontal = Math.abs(a.y - b.y) < 0.001;
  return horizontal ? { dx: 0, dy: amount } : { dx: amount, dy: 0 };
}

async function dragMidpointAndEnsureChange(
  page: Page,
  edgeId: string,
  before: EdgeSnapshot,
  midpointId = 0,
  amount = 80,
) {
  const locator = page
    .locator(`.edge_drag_point[data-edge-id="${edgeId}"][data-midpoint-id="${midpointId}"]`)
    .first();
  await expect(locator).toBeVisible();

  const baseDrag = perpendicularDragForSegment(
    before.steps[midpointId],
    before.steps[midpointId + 1],
    amount,
  );

  const tryDrag = async (dx: number, dy: number) => {
    await dragLocatorBy(page, locator, dx, dy);
    return (await snapshot(page)).edges.find((e) => e.id === edgeId)!;
  };

  let after = await tryDrag(baseDrag.dx, baseDrag.dy);
  if (JSON.stringify(after.steps) === JSON.stringify(before.steps)) {
    after = await tryDrag(-baseDrag.dx || 0, -baseDrag.dy || 0);
  }

  return after;
}

function fixtureForCombo(from: Orientation, to: Orientation) {
  const baseX = 420;
  const baseY = 320;
  const xFrom = from === 'left' ? -1 : from === 'right' ? 1 : 0;
  const yFrom = from === 'up' ? -1 : from === 'down' ? 1 : 0;
  const xTo = to === 'left' ? 1 : to === 'right' ? -1 : 0;
  const yTo = to === 'up' ? 1 : to === 'down' ? -1 : 0;
  const xSign = xFrom + xTo || 1;
  const ySign = yFrom + yTo || 1;

  return diagramFixture(
    taskNode('A', baseX, baseY),
    taskNode('B', baseX + xSign * 420, baseY + ySign * 260),
  );
}

test('routes a straight connection between two nodes', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 120, 120), taskNode('B', 420, 120)),
  );

  await connectGatewaysUi(page, 'A', 'right', 'B', 'left');

  const edge = await waitForSingleEdge(page);
  const diagram = await snapshot(page);

  assertEdgeRoutingInvariants(edge, diagram);
  expect(edge.steps.length).toBe(2);
  expect(edge.fromGatewayId).toBe('right');
  expect(edge.toGatewayId).toBe('left');
  expect(edge.steps.every((s) => s.mode !== 'manual')).toBeTruthy();
});

test('routes an orthogonal connection between two nodes', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');

  const edge = await waitForSingleEdge(page);
  const diagram = await snapshot(page);

  assertEdgeRoutingInvariants(edge, diagram);
  expect(edge.steps.length).toBeGreaterThanOrEqual(3);
  expect(edge.steps.every((s) => s.mode !== 'manual')).toBeTruthy();
  assertLeavesSourceOrientation(edge, 'left');
  assertArrivesAtTargetOrientation(edge, 'left');
});

test('connecting with endpoint displacement keeps the displacement after connection', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 180, 180), taskNode('B', 560, 180)),
  );

  // Left/right gateways support vertical endpoint displacement.
  await connectGatewaysUi(page, 'A', 'right', 'B', 'left', {
    targetOffset: { y: 30 },
  });

  const edge = await waitForSingleEdge(page);
  const diagram = await snapshot(page);
  assertOrthogonal(edge);
  assertNoAdjacentDuplicates(edge);
  assertEndpointModes(edge);

  expect(edge.displacementEnd).not.toBeNull();
  expect(edge.displacementEnd!.x).toBe(0);
  expect(Math.abs(edge.displacementEnd!.y)).toBeGreaterThanOrEqual(25);

  const toNode = diagram.nodes.find((n) => n.id === edge.toNodeId)!;
  const gatewayCenterX = toNode.box[0];
  const gatewayCenterY = toNode.box[1] + toNode.box[3] / 2;
  expectPointNear(edge.steps.at(-1)!, {
    x: gatewayCenterX + edge.displacementEnd!.x,
    y: gatewayCenterY + edge.displacementEnd!.y,
  });

  await page.waitForTimeout(30);
  const stabilized = (await snapshot(page)).edges[0];
  expect(stabilized.displacementEnd).toEqual(edge.displacementEnd);
  expectPointNear(stabilized.steps.at(-1)!, {
    x: gatewayCenterX + stabilized.displacementEnd!.x,
    y: gatewayCenterY + stabilized.displacementEnd!.y,
  });

  // Displacement must survive subsequent recomputes.
  await dragNodeBy(page, 'B', 60, 0);
  const afterMoveDiagram = await snapshot(page);
  const afterMove = afterMoveDiagram.edges[0];
  expect(afterMove.displacementEnd).toEqual(edge.displacementEnd);
  const movedToNode = afterMoveDiagram.nodes.find((n) => n.id === afterMove.toNodeId)!;
  expectPointNear(afterMove.steps.at(-1)!, {
    x: movedToNode.box[0] + afterMove.displacementEnd!.x,
    y: movedToNode.box[1] + movedToNode.box[3] / 2 + afterMove.displacementEnd!.y,
  });
});

for (const from of ORIENTATIONS) {
  for (const to of ORIENTATIONS) {
    test(`routes from ${from} to ${to}`, async ({ page }) => {
      await openAndLoad(
        page,
        fixtureForCombo(from, to),
      );

      await connectProgrammatically(page, 'A', from, 'B', to);

      const edge = await waitForSingleEdge(page);
      const diagram = await snapshot(page);

      assertEdgeRoutingInvariants(edge, diagram);
      expect(edge.fromGatewayId).toBe(from);
      expect(edge.toGatewayId).toBe(to);
      assertLeavesSourceOrientation(edge, from);
      assertArrivesAtTargetOrientation(edge, to);
    });
  }
}

test('allows dragging edge segments for custom routing', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const beforeEdge = await waitForSingleEdge(page);

  await setEdgeHover(page, beforeEdge.id, true);
  const after = await dragMidpointAndEnsureChange(page, beforeEdge.id, beforeEdge, 0, 80);
  try {
    assertEdgeRoutingInvariants(after);
  } catch (e) {
    throw new Error(
      `straight-edge post-drop path invalid: ${JSON.stringify(after.steps)}\n${e instanceof Error ? e.message : String(e)}`,
    );
  }
  expect(
    hasManualPoints(after),
    `custom route drag produced no manual points: ${JSON.stringify(after.steps)}`,
  ).toBeTruthy();
  expect(JSON.stringify(after.steps)).not.toBe(JSON.stringify(beforeEdge.steps));
});

test('edge hover drag indicators hide when edge hover state clears', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const edge = await waitForSingleEdge(page);

  const edgeGroup = page.locator(`.edge[data-id="${edge.id}"]`).first();
  await expect(edgeGroup).toBeVisible();
  await setEdgeHover(page, edge.id, true);

  const midpoint = page
    .locator(`.edge_drag_point[data-edge-id="${edge.id}"][data-midpoint-id="0"]`)
    .first();
  await expect(midpoint).toBeVisible();

  await setEdgeHover(page, edge.id, false);
  await expect(midpoint).toBeHidden();
});

test('repeated edge segment drags never leave diagonal segments', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 700, 420)),
  );

  await connectProgrammatically(page, 'A', 'right', 'B', 'left');
  let edge = await waitForSingleEdge(page);
  await setEdgeHover(page, edge.id, true);

  edge = await dragMidpointAndEnsureChange(page, edge.id, edge, 0, 120);
  assertSmoothOrthogonalPath(edge);

  await setEdgeHover(page, edge.id, true);
  const secondMidpointIndex = Math.min(1, Math.max(0, edge.steps.length - 2));
  edge = await dragMidpointAndEnsureChange(page, edge.id, edge, secondMidpointIndex, -120);
  assertSmoothOrthogonalPath(edge);

  await setEdgeHover(page, edge.id, true);
  const thirdMidpointIndex = Math.min(2, Math.max(0, edge.steps.length - 2));
  edge = await dragMidpointAndEnsureChange(page, edge.id, edge, thirdMidpointIndex, 100);
  assertSmoothOrthogonalPath(edge);
});

function assertGatewayAdjacentDragPrefix(
  edge: EdgeSnapshot,
  gateway: Orientation,
  leadLength: number,
  minAbsPerpendicularDisplacement = 1,
) {
  const local = normalizeFromGatewayFrame(edge, gateway);
  expect(local.length).toBeGreaterThanOrEqual(4);
  const localMsg = `local path: ${JSON.stringify(local)}`;

  const lead = leadLength;
  expect(Math.abs(local[0].x), localMsg).toBeLessThan(0.001);
  expect(Math.abs(local[0].y), localMsg).toBeLessThan(0.001);
  expect(Math.abs(local[1].x - lead), localMsg).toBeLessThan(0.001);
  expect(Math.abs(local[1].y), localMsg).toBeLessThan(0.001);

  // Bend must happen after the fixed lead segment.
  expect(Math.abs(local[2].x - lead), localMsg).toBeLessThan(0.001);
  expect(Math.abs(local[2].y), localMsg).toBeGreaterThanOrEqual(minAbsPerpendicularDisplacement);

  // No tiny pinned stub right after the gateway.
  expect(Math.abs(segmentLength(local[0], local[1]) - lead), localMsg).toBeLessThanOrEqual(0.001);

  assertNoRedundantCollinearTriples(local);
}

function assertGatewayLeadSegment(edge: EdgeSnapshot, gateway: Orientation, leadLength: number) {
  const local = normalizeFromGatewayFrame(edge, gateway);
  expect(local.length).toBeGreaterThanOrEqual(2);
  expect(Math.abs(local[0].x)).toBeLessThan(0.001);
  expect(Math.abs(local[0].y)).toBeLessThan(0.001);
  expect(Math.abs(local[1].x - leadLength)).toBeLessThan(0.001);
  expect(Math.abs(local[1].y)).toBeLessThan(0.001);
}

test('dragging gateway-adjacent segment preserves fixed lead segment and inserts bend after it', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );
  const gridSize = 50;

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const beforeEdge = await waitForSingleEdge(page);
  expect(beforeEdge.steps.length).toBeGreaterThanOrEqual(3);
  const beforeSourceLocal = normalizeFromGatewayFrame(beforeEdge, beforeEdge.fromGatewayId);
  const leadLength = Math.abs(beforeSourceLocal[1].x - beforeSourceLocal[0].x);
  expect(leadLength).toBeGreaterThan(0);

  await setEdgeHover(page, beforeEdge.id, true);
  const firstMidpoint = page
    .locator(`.edge_drag_point[data-edge-id="${beforeEdge.id}"][data-midpoint-id="0"]`)
    .first();
  await expect(firstMidpoint).toBeVisible();
  const afterEdge = await dragMidpointAndEnsureChange(page, beforeEdge.id, beforeEdge, 0, 70);
  assertEdgeRoutingInvariants(afterEdge);
  assertSmoothOrthogonalPath(afterEdge);

  // Primary diagnostic: dragging the first segment must create a bend only after
  // the fixed gateway lead segment, never by leaving a tiny stub on the gateway.
  assertGatewayAdjacentDragPrefix(afterEdge, afterEdge.fromGatewayId, leadLength, gridSize / 2);
  const beforeTargetLead = Math.abs(
    normalizeFromGatewayFrame(reversedEdge(beforeEdge), beforeEdge.toGatewayId)[1].x,
  );
  assertGatewayLeadSegment(reversedEdge(afterEdge), afterEdge.toGatewayId, beforeTargetLead);

  const sourceLocal = normalizeFromGatewayFrame(afterEdge, afterEdge.fromGatewayId);
  expect(Math.abs(sourceLocal[1].x - leadLength)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[2].x - leadLength)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[2].y)).toBeGreaterThanOrEqual(gridSize / 2);
});

test('dragging terminal gateway-adjacent segment preserves target fixed lead segment and inserts bend before it', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );
  const gridSize = 50;

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const beforeEdge = await waitForSingleEdge(page);
  const targetLeadLength = gridSize;

  await setEdgeHover(page, beforeEdge.id, true);
  const terminalMidpointId = beforeEdge.steps.length - 2;
  const afterEdge = await dragMidpointAndEnsureChange(page, beforeEdge.id, beforeEdge, terminalMidpointId, 70);

  assertEdgeRoutingInvariants(afterEdge);
  assertSmoothOrthogonalPath(afterEdge);
  const reversed = reversedEdge(afterEdge);
  const targetLocal = normalizeFromGatewayFrame(reversed, afterEdge.toGatewayId);
  try {
    assertGatewayLeadSegment(reversed, afterEdge.toGatewayId, targetLeadLength);
    assertGatewayAdjacentDragPrefix(reversed, afterEdge.toGatewayId, targetLeadLength, gridSize / 2);
  } catch (e) {
    throw new Error(
      `terminal drag bad path: ${JSON.stringify({ steps: afterEdge.steps, reversed: reversed.steps, targetLocal })}\n${e instanceof Error ? e.message : String(e)}`,
    );
  }
});

test('straight connected nodes can be bent while preserving fixed gateway lead segments', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 180, 180), taskNode('B', 560, 180)),
  );
  const gridSize = 50;

  await connectProgrammatically(page, 'A', 'right', 'B', 'left');
  const before = await waitForSingleEdge(page);
  expect(before.steps.length).toBe(2);
  const straightLeadLength = 50;

  await setEdgeHover(page, before.id, true);
  const midpoint = page
    .locator(`.edge_drag_point[data-edge-id="${before.id}"][data-midpoint-id="0"]`)
    .first();
  const midpointCount = await page.locator(
    `.edge_drag_point[data-edge-id="${before.id}"][data-midpoint-id="0"]`,
  ).count();
  expect(
    midpointCount,
    'Straight edge must expose a draggable segment handle so users can insert a bend to avoid obstacles',
  ).toBeGreaterThan(0);
  await expect(midpoint).toBeVisible();
  const box = await midpoint.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width, `straight midpoint bbox: ${JSON.stringify(box)}`).toBeGreaterThan(0);
  expect(box!.height, `straight midpoint bbox: ${JSON.stringify(box)}`).toBeGreaterThan(0);
  const mx = box!.x + box!.width / 2;
  const my = box!.y + box!.height / 2;
  await page.mouse.move(mx, my);
  await page.mouse.down();
  await page.mouse.move(mx, my + 100, { steps: 10 });
  const duringDrag = (await snapshot(page)).edges.find((e) => e.id === before.id)!;
  await page.mouse.up();
  const after = (await snapshot(page)).edges.find((e) => e.id === before.id)!;
  expect(
    duringDrag.dragging,
    `straight-edge drag did not start; during snapshot: ${JSON.stringify(duringDrag)}`,
  ).toBeTruthy();
  expect(
    duringDrag.steps.length,
    `straight-edge during-drag result: ${JSON.stringify(duringDrag.steps)}`,
  ).toBeGreaterThanOrEqual(4);
  try {
    assertEdgeRoutingInvariants(after);
    assertSmoothOrthogonalPath(after);
  } catch (e) {
    throw new Error(
      `straight-edge post-drop path invalid: ${JSON.stringify(after.steps)}\n${e instanceof Error ? e.message : String(e)}`,
    );
  }
  expect(
    after.steps.length,
    `straight-edge drag result: ${JSON.stringify(after.steps)}`,
  ).toBeGreaterThanOrEqual(4);

  assertGatewayAdjacentDragPrefix(after, 'right', straightLeadLength, gridSize / 2);
  assertGatewayLeadSegment(reversedEdge(after), 'left', straightLeadLength);

  // Exact diagnostic for endpoint-adjacent drag on a straight edge:
  // the first bend must be inserted after the fixed lead segment.
  const sourceLocal = normalizeFromGatewayFrame(after, 'right');
  expect(Math.abs(sourceLocal[0].x)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[1].x - straightLeadLength)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[1].y)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[2].x - straightLeadLength)).toBeLessThan(0.001);
  expect(Math.abs(sourceLocal[2].y)).toBeGreaterThanOrEqual(gridSize / 2);
});

test('preserves custom routing when moving nodes after user routing', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const edge = await waitForSingleEdge(page);

  await setEdgeHover(page, edge.id, true);
  const initial = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  const afterManual = await dragMidpointAndEnsureChange(page, edge.id, initial, 0, 100);
  expect(
    hasManualPoints(afterManual),
    `custom route drag produced no manual points: ${JSON.stringify(afterManual.steps)}`,
  ).toBeTruthy();
  const manualCountBeforeMove = afterManual.steps.filter((s) => s.mode === 'manual').length;

  await dragNodeBy(page, 'A', 80, 40);
  let afterSourceMove = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  assertEdgeRoutingInvariants(afterSourceMove);
  expect(hasManualPoints(afterSourceMove)).toBeTruthy();
  expect(afterSourceMove.steps.filter((s) => s.mode === 'manual').length).toBeGreaterThanOrEqual(1);
  expect(JSON.stringify(afterSourceMove.steps)).not.toBe(JSON.stringify(afterManual.steps));

  await dragNodeBy(page, 'B', -60, 50);
  const afterTargetMove = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  assertEdgeRoutingInvariants(afterTargetMove);
  expect(hasManualPoints(afterTargetMove)).toBeTruthy();
  expect(afterTargetMove.steps.filter((s) => s.mode === 'manual').length).toBeGreaterThanOrEqual(
    Math.min(1, manualCountBeforeMove),
  );

  // Sync routing guard: no delayed second reroute after the drag completes.
  await page.waitForTimeout(30);
  const stabilized = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  expect(stabilized.steps).toEqual(afterTargetMove.steps);
});

test('loading an exported diagram preserves edge routes', async ({ page }) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await connectProgrammatically(page, 'A', 'left', 'B', 'left');
  const edge = await waitForSingleEdge(page);
  await setEdgeHover(page, edge.id, true);

  const beforeDrag = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  const afterManual = await dragMidpointAndEnsureChange(page, edge.id, beforeDrag, 0, 100);
  expect(hasManualPoints(afterManual)).toBeTruthy();
  assertSmoothOrthogonalPath(afterManual);

  const exported = await exportDiagram(page);

  await page.goto('/');
  await importFixture(page, exported);

  const loaded = await waitForSingleEdge(page);
  assertEdgeRoutingInvariants(loaded);
  assertSmoothOrthogonalPath(loaded);
  expect(loaded.steps).toEqual(afterManual.steps);
  expect(hasManualPoints(loaded)).toBeTruthy();
});

test('moving target after bending a straight edge does not create a terminal pocket near gateway', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 180, 180), taskNode('B', 560, 180)),
  );
  const gridSize = 50;

  await connectProgrammatically(page, 'A', 'right', 'B', 'left');
  const edge = await waitForSingleEdge(page);
  await setEdgeHover(page, edge.id, true);

  const midpoint = page
    .locator(`.edge_drag_point[data-edge-id="${edge.id}"][data-midpoint-id="0"]`)
    .first();
  await expect(midpoint).toBeVisible();
  await dragLocatorBy(page, midpoint, 0, 100);

  const afterManual = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;
  assertSmoothOrthogonalPath(afterManual);
  expect(hasManualPoints(afterManual)).toBeTruthy();

  await dragNodeBy(page, 'B', 220, 0);
  const afterMove = (await snapshot(page)).edges.find((e) => e.id === edge.id)!;

  assertEdgeRoutingInvariants(afterMove);
  assertSmoothOrthogonalPath(afterMove);
  expect(hasManualPoints(afterMove)).toBeTruthy();

  const targetLocal = normalizeFromGatewayFrame(reversedEdge(afterMove), afterMove.toGatewayId);
  expect(targetLocal.length).toBeGreaterThanOrEqual(3);
  expect(
    Math.abs(targetLocal[1].x),
    `post-move target local path invalid: ${JSON.stringify({ steps: afterMove.steps, targetLocal })}`,
  ).toBeGreaterThan(0);
  expect(Math.abs(targetLocal[1].y)).toBeLessThan(0.001);
  // No immediate rectangular pocket next to the target lead segment.
  if (targetLocal.length >= 5) {
    const [p0, p1, p2, p3] = targetLocal;
    const isPocket =
      Math.abs(p1.y) < 0.001 &&
      Math.abs(p2.x - p1.x) < 0.001 &&
      Math.abs(p3.y - p2.y) < 0.001 &&
      Math.abs(p3.y) < 0.001 &&
      Math.abs(p3.x - p1.x) > 0.001;
    expect(isPocket, `target local path shows terminal pocket: ${JSON.stringify(targetLocal)}`).toBeFalsy();
  }
});

test('connection preview follows the mouse orthogonally while creating a new edge', async ({
  page,
}) => {
  await openAndLoad(page, diagramFixture(taskNode('A', 220, 180), taskNode('B', 900, 900)));

  const start = await startConnectionDrag(page, 'A', 'right');
  const p1 = { x: start.x + 180, y: start.y + 110 };
  const p2 = { x: start.x + 260, y: start.y - 70 };

  await moveMouse(page, p1.x, p1.y);
  const preview1 = await connectorPreview(page);
  expect(preview1.hasCandidate).toBeFalsy();
  expect(preview1.steps.length).toBeGreaterThanOrEqual(3);
  assertOrthogonalPoints(preview1.steps);
  expect(preview1.mouseSnapped).not.toBeNull();

  const last1 = preview1.steps.at(-1)!;

  await moveMouse(page, p2.x, p2.y);
  const preview2 = await connectorPreview(page);
  expect(preview2.hasCandidate).toBeFalsy();
  expect(preview2.steps.length).toBeGreaterThanOrEqual(3);
  assertOrthogonalPoints(preview2.steps);
  expect(preview2.mouseSnapped).not.toBeNull();

  const last2 = preview2.steps.at(-1)!;
  // The preview must follow the mouse target (same movement direction/magnitude
  // in canvas space), not only remain orthogonal.
  const mouseDelta = {
    x: preview2.mouseSnapped!.x - preview1.mouseSnapped!.x,
    y: preview2.mouseSnapped!.y - preview1.mouseSnapped!.y,
  };
  const previewDelta = {
    x: last2.x - last1.x,
    y: last2.y - last1.y,
  };

  if (Math.abs(mouseDelta.x) > 0.001) {
    expect(Math.sign(previewDelta.x)).toBe(Math.sign(mouseDelta.x));
    expect(Math.abs(previewDelta.x)).toBeGreaterThan(0.001);
  }
  if (Math.abs(mouseDelta.y) > 0.001) {
    expect(Math.sign(previewDelta.y)).toBe(Math.sign(mouseDelta.y));
    expect(Math.abs(previewDelta.y)).toBeGreaterThan(0.001);
  }
  expect(
    Math.abs(last2.x - last1.x) > 0.001 || Math.abs(last2.y - last1.y) > 0.001,
  ).toBeTruthy();

  await endMouseDrag(page);
});

test('connection preview matches the created edge path when dropping on a target gateway', async ({
  page,
}) => {
  await openAndLoad(
    page,
    diagramFixture(taskNode('A', 220, 180), taskNode('B', 620, 420)),
  );

  await startConnectionDrag(page, 'A', 'right');
  const targetNode = page.locator(`.diagram__node[data-id="B"]`).first();
  await expect(targetNode).toBeVisible();
  const nodeBox = await targetNode.boundingBox();
  expect(nodeBox).not.toBeNull();
  const tx = nodeBox!.x;
  const ty = nodeBox!.y + nodeBox!.height / 2 + 30;

  await moveMouse(page, tx, ty);

  await expect.poll(async () => (await connectorPreview(page)).hasCandidate).toBeTruthy();
  const preview = await connectorPreview(page);
  expect(preview.candidateNodeId).toBe('B');
  expect(preview.candidateGatewayId).toBe('left');
  expect(preview.steps.length).toBeGreaterThanOrEqual(3);
  assertOrthogonalPoints(preview.steps);

  const previewPoints = preview.steps.map((p) => ({ x: p.x, y: p.y }));
  await endMouseDrag(page);

  const edge = await waitForSingleEdge(page);
  const edgePoints = edge.steps.map((p) => ({ x: p.x, y: p.y }));
  expect(
    edgePoints,
    `preview/final mismatch\npreview=${JSON.stringify(previewPoints)}\nfinal=${JSON.stringify(edge.steps)}`,
  ).toEqual(previewPoints);
});
