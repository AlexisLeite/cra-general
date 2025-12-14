import type React from 'react';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { EdgeArrowHead, EdgeLineStyle } from '../../../store/types';

export interface RenderEdgeProps {
  points: Coordinates[];
  color?: string;
  width?: number;
  arrowSize?: number;
  className?: string;

  endStroke?: string;
  startStroke?: string;
  startType?: EdgeArrowHead;
  endType?: EdgeArrowHead;

  lineStyle?: EdgeLineStyle;

  draggable?: boolean;

  onMidpointMouseDown?: (midpointIndex: number, ev: React.MouseEvent) => void;
}

export interface MidpointInfo extends Coordinates {
  insertIndex: number;
  startIndex: number;
  endIndex: number;
  isHorizontal: boolean;
  isStartSegment: boolean;
  isEndSegment: boolean;
}
