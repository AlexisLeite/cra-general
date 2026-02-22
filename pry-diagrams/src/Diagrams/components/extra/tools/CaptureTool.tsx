import html2canvas from 'html2canvas';
import { LetterTool } from './LetterTool';

type CaptureOptions = {
  scale?: number;
  backgroundColor?: string | null;
};

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function toBounds(x: number, y: number, width: number, height: number): Bounds {
  return { minX: x, minY: y, maxX: x + width, maxY: y + height };
}

function mergeBounds(all: Bounds[]): Bounds | null {
  if (!all.length) return null;
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function pxToNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHtmlNodeBox(node: HTMLElement) {
  const style = window.getComputedStyle(node);
  const left = pxToNumber(style.left);
  const top = pxToNumber(style.top);
  const width = pxToNumber(style.width);
  const height = pxToNumber(style.height);
  return { left, top, width, height };
}

function getZIndex(node: HTMLElement): number {
  const value = window.getComputedStyle(node).zIndex;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveDiagramBackgroundColor(
  provided: string | null | undefined,
): string | null {
  if (provided !== undefined) return provided;

  const frame = document.querySelector('.canvas__frame') as HTMLElement | null;
  if (!frame) return '#ffffff';

  const color = window.getComputedStyle(frame).backgroundColor;
  return color || '#ffffff';
}

async function captureHtmlNodeImage(
  node: HTMLElement,
  box: { width: number; height: number },
  scale: number,
  backgroundColor: string | null,
) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '-100000px';
  wrapper.style.width = `${box.width}px`;
  wrapper.style.height = `${box.height}px`;
  wrapper.style.overflow = 'hidden';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '1';
  wrapper.style.zIndex = '-1';

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.position = 'relative';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.width = `${box.width}px`;
  clone.style.height = `${box.height}px`;
  clone.style.transform = 'none';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      backgroundColor,
      scale,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(1, Math.ceil(box.width)),
      windowHeight: Math.max(1, Math.ceil(box.height)),
    });

    return canvas.toDataURL('image/png');
  } finally {
    wrapper.remove();
  }
}

function setAttr(el: Element, name: string, value: string) {
  if (!value) return;
  el.setAttribute(name, value);
}

function inlineSvgComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const sourceEls = [source, ...Array.from(source.querySelectorAll('*'))];
  const cloneEls = [clone, ...Array.from(clone.querySelectorAll('*'))];
  const len = Math.min(sourceEls.length, cloneEls.length);

  for (let i = 0; i < len; i++) {
    const s = window.getComputedStyle(sourceEls[i]);
    const t = cloneEls[i];

    setAttr(t, 'display', s.display);
    setAttr(t, 'visibility', s.visibility);
    setAttr(t, 'opacity', s.opacity);

    setAttr(t, 'fill', s.fill);
    setAttr(t, 'fill-opacity', s.fillOpacity);

    setAttr(t, 'stroke', s.stroke);
    setAttr(t, 'stroke-width', s.strokeWidth);
    setAttr(t, 'stroke-opacity', s.strokeOpacity);
    setAttr(t, 'stroke-linecap', s.strokeLinecap);
    setAttr(t, 'stroke-linejoin', s.strokeLinejoin);
    setAttr(t, 'stroke-dasharray', s.strokeDasharray);
    setAttr(t, 'stroke-dashoffset', s.strokeDashoffset);

    setAttr(t, 'font-family', s.fontFamily);
    setAttr(t, 'font-size', s.fontSize);
    setAttr(t, 'font-weight', s.fontWeight);
    setAttr(t, 'text-anchor', s.textAnchor);
    setAttr(t, 'dominant-baseline', s.dominantBaseline);
  }
}

async function captureAsSvg({
  scale = window.devicePixelRatio,
  backgroundColor,
}: CaptureOptions = {}): Promise<void> {
  const foreground = document.querySelector(
    'svg.foreground',
  ) as SVGSVGElement | null;
  if (!foreground) return;

  await document.fonts?.ready;

  const vectorRoots = Array.from(
    foreground.querySelectorAll('[data-id]'),
  ).filter(
    (node): node is SVGGraphicsElement => node instanceof SVGGraphicsElement,
  );

  const htmlNodes = Array.from(
    document.querySelectorAll('.scalable_components .diagram__node[data-id]'),
  )
    .filter((node): node is HTMLElement => node instanceof HTMLElement)
    .filter((node) => !node.querySelector('.diagram__node[data-id]'));

  const htmlLayers = htmlNodes
    .map((node, domIndex) => ({
      node,
      box: getHtmlNodeBox(node),
      zIndex: getZIndex(node),
      domIndex,
    }))
    .filter(({ box }) => box.width > 0 && box.height > 0)
    .sort((a, b) => {
      if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
      const areaA = a.box.width * a.box.height;
      const areaB = b.box.width * b.box.height;
      if (areaA !== areaB) return areaB - areaA;
      return a.domIndex - b.domIndex;
    });

  const svgBounds = vectorRoots
    .map((node) => {
      try {
        const box = node.getBBox();
        if (box.width <= 0 && box.height <= 0) return null;
        return toBounds(box.x, box.y, box.width, box.height);
      } catch {
        return null;
      }
    })
    .filter((box): box is Bounds => box !== null);

  const htmlBounds = htmlLayers.map(({ box }) =>
    toBounds(box.left, box.top, box.width, box.height),
  );

  const union = mergeBounds([...svgBounds, ...htmlBounds]);
  if (!union) return;

  const padding = 50;
  const minX = Math.floor(union.minX - padding);
  const minY = Math.floor(union.minY - padding);
  const width = Math.max(1, Math.ceil(union.maxX - union.minX + padding * 2));
  const height = Math.max(1, Math.ceil(union.maxY - union.minY + padding * 2));

  const MAX = 8192;
  const safeScale = Math.min(scale, MAX / Math.max(width, height));
  const resolvedBackgroundColor =
    resolveDiagramBackgroundColor(backgroundColor);

  const serializer = new XMLSerializer();
  const clonedForeground = foreground.cloneNode(true) as SVGSVGElement;
  inlineSvgComputedStyles(foreground, clonedForeground);

  const vectorLayer = Array.from(clonedForeground.querySelectorAll('[data-id]'))
    .map((node) => serializer.serializeToString(node))
    .join('');

  const customLayer: string[] = [];
  for (const { node, box } of htmlLayers) {
    const href = await captureHtmlNodeImage(
      node,
      { width: box.width, height: box.height },
      safeScale,
      resolvedBackgroundColor,
    );
    customLayer.push(
      `<image x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" preserveAspectRatio="none" href="${escapeXml(href)}" />`,
    );
  }

  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    resolvedBackgroundColor
      ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${escapeXml(resolvedBackgroundColor)}" />`
      : '',
    `<g data-layer="custom-renderers" transform="translate(${-minX} ${-minY})">`,
    ...customLayer,
    '</g>',
    `<g data-layer="vector" transform="translate(${-minX} ${-minY})">`,
    vectorLayer,
    '</g>',
    '</svg>',
  ]
    .filter(Boolean)
    .join('');

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  download(url, 'capture.svg');
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export const CaptureTool = () => {
  return (
    <LetterTool
      letters="SC"
      active={false}
      onClick={() => {
        captureAsSvg();
      }}
      title="Screenshot"
    />
  );
};
