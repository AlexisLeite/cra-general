import { Edge } from '../../store/elements/Edge';

export class EdgeWithLoad extends Edge {
  setLoad(h: number) {
    h = Math.max(0, Math.min(100, h));

    this.state.strokeWidth = Math.max(3, Math.min(h, 8));
    this.state.stroke = `rgb(255,${255 - (255 * h) / 100},${255 - (255 * h) / 100})`;
  }
}
