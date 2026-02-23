import { expect, type Locator, type Page } from '@playwright/test';

export type Orientation = 'left' | 'right' | 'up' | 'down';

export type EdgeStep = {
  x: number;
  y: number;
  mode: 'auto' | 'manual' | 'static';
};

export type EdgeSnapshot = {
  id: string;
  dragging?: boolean;
  fromNodeId: string;
  fromGatewayId: Orientation;
  toNodeId: string;
  toGatewayId: Orientation;
  displacementStart: { x: number; y: number } | null;
  displacementEnd: { x: number; y: number } | null;
  steps: EdgeStep[];
};

export type DiagramSnapshot = {
  nodes: { id: string; box: [number, number, number, number] }[];
  edges: EdgeSnapshot[];
};

type E2EApi = {
  import: (state: unknown) => DiagramSnapshot;
  export: () => unknown;
  snapshot: () => DiagramSnapshot;
  connect: (
    fromNodeId: string,
    fromGatewayId: Orientation,
    toNodeId: string,
    toGatewayId: Orientation,
  ) => DiagramSnapshot;
  setEdgeHover: (edgeId: string, hover: boolean) => DiagramSnapshot;
  connectorPreview: () => {
    steps: { x: number; y: number }[];
    hasCandidate: boolean;
    candidateGatewayId: Orientation | null;
    candidateNodeId: string | null;
    mouseSnapped: { x: number; y: number } | null;
  };
};

const EPS = 0.001;

function gatewayPositionForOrientation(
  [x, y, width, height]: [number, number, number, number],
  orientation: Orientation,
): [number, number] {
  switch (orientation) {
    case 'left':
      return [x, y + height / 2];
    case 'right':
      return [x + width, y + height / 2];
    case 'up':
      return [x + width / 2, y];
    case 'down':
      return [x + width / 2, y + height];
  }
}

function gatewayState(id: Orientation) {
  const coordinates =
    id === 'left'
      ? [0, 0.5]
      : id === 'right'
        ? [1, 0.5]
        : id === 'up'
          ? [0.5, 0]
          : [0.5, 1];

  return {
    coordinates,
    id,
    orientation: id,
    radius: 5,
    stroke: 'transparent',
    strokeWidth: 10,
    outEdges: [],
    class: 'Gateway',
  };
}

export function taskNode(
  id: string,
  x: number,
  y: number,
  width = 200,
  height = 100,
) {
  return {
    box: [x, y, width, height],
    id,
    label: id,
    movable: true,
    selected: false,
    gateways: [
      gatewayState('left'),
      gatewayState('right'),
      gatewayState('up'),
      gatewayState('down'),
    ],
    class: 'TaskNode',
  };
}

export function diagramFixture(...nodes: ReturnType<typeof taskNode>[]) {
  return {
    position: { x: 0, y: 0, scale: 1 },
    nodes,
  };
}

export async function importFixture(page: Page, state: unknown) {
  await page.evaluate((payload) => {
    (window as any).__diagramE2E.import(payload);
  }, state);
}

export async function snapshot(page: Page): Promise<DiagramSnapshot> {
  return page.evaluate(() => (window as any).__diagramE2E.snapshot() as DiagramSnapshot);
}

export async function exportDiagram(page: Page): Promise<unknown> {
  return page.evaluate(() => (window as any).__diagramE2E.export());
}

export async function connectProgrammatically(
  page: Page,
  fromNodeId: string,
  fromGatewayId: Orientation,
  toNodeId: string,
  toGatewayId: Orientation,
) {
  await page.evaluate(
    ({ fromNodeId, fromGatewayId, toNodeId, toGatewayId }) => {
      (window as any).__diagramE2E.connect(
        fromNodeId,
        fromGatewayId,
        toNodeId,
        toGatewayId,
      );
    },
    { fromNodeId, fromGatewayId, toNodeId, toGatewayId },
  );
}

export async function setEdgeHover(page: Page, edgeId: string, hover: boolean) {
  await page.evaluate(
    ({ edgeId, hover }) => {
      (window as any).__diagramE2E.setEdgeHover(edgeId, hover);
    },
    { edgeId, hover },
  );
}

export async function connectorPreview(page: Page) {
  return page.evaluate(
    () => (window as any).__diagramE2E.connectorPreview() as ReturnType<E2EApi['connectorPreview']>,
  );
}

export async function waitForSingleEdge(page: Page) {
  await expect.poll(async () => (await snapshot(page)).edges.length).toBe(1);
  const snap = await snapshot(page);
  return snap.edges[0];
}

export async function connectGatewaysUi(
  page: Page,
  fromNodeId: string,
  fromGateway: Orientation,
  toNodeId: string,
  toGateway: Orientation,
  options?: {
    targetOffset?: { x?: number; y?: number };
  },
) {
  const sourceNode = page.locator(`.diagram__node[data-id="${fromNodeId}"]`).first();
  const targetNode = page.locator(`.diagram__node[data-id="${toNodeId}"]`).first();

  await expect(sourceNode).toBeVisible();
  await expect(targetNode).toBeVisible();
  await targetNode.click();
  await sourceNode.hover();

  const sourceGateway = page.locator(
    `.diagram__node__gateway[data-gateway-parent="${fromNodeId}"][data-gateway-id="${fromGateway}"]`,
  );
  const targetGateway = page.locator(
    `.diagram__node__gateway[data-gateway-parent="${toNodeId}"][data-gateway-id="${toGateway}"]`,
  );
  await expect(sourceGateway).toBeVisible();
  await expect(targetGateway).toBeVisible();

  const sourceBox = await sourceGateway.boundingBox();
  const targetBox = await targetGateway.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  const tx = targetBox!.x + targetBox!.width / 2 + (options?.targetOffset?.x ?? 0);
  const ty = targetBox!.y + targetBox!.height / 2 + (options?.targetOffset?.y ?? 0);

  await page.mouse.move(
    sourceBox!.x + sourceBox!.width / 2,
    sourceBox!.y + sourceBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(tx, ty, { steps: 16 });
  await page.mouse.up();
}

export function segmentLength(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function areCollinear(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  eps = 0.001,
) {
  const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  return Math.abs(cross) < eps;
}

export function normalizeFromGatewayFrame(
  edge: EdgeSnapshot,
  gateway: Orientation,
) {
  const p0 = edge.steps[0];
  const toLocal = (p: { x: number; y: number }) => {
    const dx = p.x - p0.x;
    const dy = p.y - p0.y;

    switch (gateway) {
      case 'right':
        return { x: dx, y: dy };
      case 'left':
        return { x: -dx, y: dy };
      case 'down':
        return { x: dy, y: -dx };
      case 'up':
        return { x: -dy, y: dx };
    }
  };

  return edge.steps.map(toLocal);
}

export function assertNoRedundantCollinearTriples(
  points: { x: number; y: number }[],
  eps = 0.001,
) {
  for (let i = 0; i < points.length - 2; i++) {
    const a = points[i];
    const b = points[i + 1];
    const c = points[i + 2];
    const ab = segmentLength(a, b);
    const bc = segmentLength(b, c);
    if (ab < eps || bc < eps) {
      continue;
    }
    expect(
      areCollinear(a, b, c, eps),
      `redundant collinear triple at ${i}: ${JSON.stringify({ a, b, c, points })}`,
    ).toBeFalsy();
  }
}

export async function startConnectionDrag(
  page: Page,
  fromNodeId: string,
  fromGateway: Orientation,
) {
  const sourceNode = page.locator(`.diagram__node[data-id="${fromNodeId}"]`).first();
  await expect(sourceNode).toBeVisible();
  await sourceNode.hover();

  const sourceGateway = page.locator(
    `.diagram__node__gateway[data-gateway-parent="${fromNodeId}"][data-gateway-id="${fromGateway}"]`,
  );
  await expect(sourceGateway).toBeVisible();
  const sourceBox = await sourceGateway.boundingBox();
  expect(sourceBox).not.toBeNull();

  const x = sourceBox!.x + sourceBox!.width / 2;
  const y = sourceBox!.y + sourceBox!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  return { x, y };
}

export async function moveMouse(page: Page, x: number, y: number) {
  await page.mouse.move(x, y, { steps: 8 });
}

export async function endMouseDrag(page: Page) {
  await page.mouse.up();
}

export async function dragLocatorBy(page: Page, locator: Locator, dx: number, dy: number) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

export async function dragNodeBy(page: Page, nodeId: string, dx: number, dy: number) {
  const node = page.locator(`.diagram__node[data-id="${nodeId}"]`).first();
  await expect(node).toBeVisible();
  await dragLocatorBy(page, node, dx, dy);
}

export function assertOrthogonal(edge: EdgeSnapshot) {
  for (let i = 0; i < edge.steps.length - 1; i++) {
    const a = edge.steps[i];
    const b = edge.steps[i + 1];
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    expect(dx < EPS || dy < EPS).toBeTruthy();
  }
}

export function assertNoAdjacentDuplicates(edge: EdgeSnapshot) {
  for (let i = 0; i < edge.steps.length - 1; i++) {
    const a = edge.steps[i];
    const b = edge.steps[i + 1];
    expect(Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS).toBeFalsy();
  }
}

export function assertEndpointModes(edge: EdgeSnapshot) {
  expect(edge.steps.length).toBeGreaterThan(1);
  expect(edge.steps[0].mode).toBe('static');
  expect(edge.steps.at(-1)?.mode).toBe('static');
}

export function assertConnectsToSelectedGateways(
  edge: EdgeSnapshot,
  nodeBoxes: Map<string, [number, number, number, number]>,
) {
  const fromBox = nodeBoxes.get(edge.fromNodeId);
  const toBox = nodeBoxes.get(edge.toNodeId);
  expect(fromBox).toBeTruthy();
  expect(toBox).toBeTruthy();

  const [fx, fy] = gatewayPositionForOrientation(fromBox!, edge.fromGatewayId);
  const [tx, ty] = gatewayPositionForOrientation(toBox!, edge.toGatewayId);
  const first = edge.steps[0];
  const last = edge.steps.at(-1)!;

  expect(Math.abs(first.x - fx)).toBeLessThan(1);
  expect(Math.abs(first.y - fy)).toBeLessThan(1);
  expect(Math.abs(last.x - tx)).toBeLessThan(1);
  expect(Math.abs(last.y - ty)).toBeLessThan(1);
}

export function assertLeavesSourceOrientation(edge: EdgeSnapshot, orientation: Orientation) {
  const first = edge.steps[0];
  const second = edge.steps[1];
  switch (orientation) {
    case 'left':
      expect(second.x).toBeLessThan(first.x + EPS);
      expect(Math.abs(second.y - first.y)).toBeLessThan(1);
      break;
    case 'right':
      expect(second.x).toBeGreaterThan(first.x - EPS);
      expect(Math.abs(second.y - first.y)).toBeLessThan(1);
      break;
    case 'up':
      expect(second.y).toBeLessThan(first.y + EPS);
      expect(Math.abs(second.x - first.x)).toBeLessThan(1);
      break;
    case 'down':
      expect(second.y).toBeGreaterThan(first.y - EPS);
      expect(Math.abs(second.x - first.x)).toBeLessThan(1);
      break;
  }
}

export function assertArrivesAtTargetOrientation(edge: EdgeSnapshot, orientation: Orientation) {
  const prev = edge.steps[edge.steps.length - 2];
  const last = edge.steps[edge.steps.length - 1];
  switch (orientation) {
    case 'left':
      expect(prev.x).toBeLessThan(last.x + EPS);
      expect(Math.abs(prev.y - last.y)).toBeLessThan(1);
      break;
    case 'right':
      expect(prev.x).toBeGreaterThan(last.x - EPS);
      expect(Math.abs(prev.y - last.y)).toBeLessThan(1);
      break;
    case 'up':
      expect(prev.y).toBeLessThan(last.y + EPS);
      expect(Math.abs(prev.x - last.x)).toBeLessThan(1);
      break;
    case 'down':
      expect(prev.y).toBeGreaterThan(last.y - EPS);
      expect(Math.abs(prev.x - last.x)).toBeLessThan(1);
      break;
  }
}

export function nodeBoxMap(diagram: DiagramSnapshot) {
  return new Map(diagram.nodes.map((node) => [node.id, node.box]));
}

export function hasManualPoints(edge: EdgeSnapshot) {
  return edge.steps.some((step) => step.mode === 'manual');
}
