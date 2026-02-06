import { observer } from 'mobx-react-lite';
import type { ChangeEvent, CSSProperties } from 'react';
import { CollapsiblePanel } from '../../../layout/CollapsiblePanel';
import type { BPMNStatisticsController } from './BPMNStatisticsController';
import type { BPMNMetric } from './types';

type BPMNStatisticsPanelProps = {
  controller: BPMNStatisticsController;
};

const metricOptions: Array<{ label: string; value: BPMNMetric }> = [
  { label: 'Throughput', value: 'throughput' },
  { label: 'Duration (ms)', value: 'durationMs' },
  { label: 'Error rate', value: 'errorRate' },
];

const sectionStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const grid2Style: CSSProperties = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: '1fr 1fr',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  fontSize: 12,
};

const smallStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.9,
};

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const BPMNStatisticsPanel = observer(function BPMNStatisticsPanel({
  controller,
}: BPMNStatisticsPanelProps) {
  const onUpload = (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (file) {
      void controller.loadFromFile(file);
    }
    ev.target.value = '';
  };

  return (
    <CollapsiblePanel
      id="BPMNStatisticsPanel"
      defaultWidth={320}
      minWidth={260}
      maxWidth={520}
      sections={[
        {
          key: 'data',
          title: 'Statistics Data',
          children: (
            <div style={sectionStyle}>
              <input type="file" accept=".json,application/json" onChange={onUpload} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => controller.apply()} disabled={!controller.hasDataset}>
                  Re-apply
                </button>
                <button onClick={() => controller.clear()} disabled={!controller.hasDataset}>
                  Clear
                </button>
                <button onClick={() => controller.downloadSampleFile()}>
                  Download sample
                </button>
              </div>
              {controller.fileName && (
                <div style={smallStyle}>Loaded file: {controller.fileName}</div>
              )}
              {controller.error && (
                <div style={{ ...smallStyle, color: '#ef4444' }}>{controller.error}</div>
              )}
              {controller.hasDataset && (
                <div style={smallStyle}>
                  Nodes matched: {controller.matchedNodes} | Unmatched rows:{' '}
                  {controller.unmatchedNodeStats}
                  <br />
                  Edges matched: {controller.matchedEdges} | Unmatched rows:{' '}
                  {controller.unmatchedEdgeStats}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'metrics',
          title: 'Metrics',
          children: (
            <div style={sectionStyle}>
              <label style={labelStyle}>
                Node metric
                <select
                  value={controller.nodeMetric}
                  onChange={(ev) => controller.setNodeMetric(ev.target.value as BPMNMetric)}
                >
                  {metricOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Edge metric
                <select
                  value={controller.edgeMetric}
                  onChange={(ev) => controller.setEdgeMetric(ev.target.value as BPMNMetric)}
                >
                  {metricOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ),
        },
        {
          key: 'scale',
          title: 'Scale',
          children: (
            <div style={sectionStyle}>
              <label style={labelStyle}>
                Scale mode
                <select
                  value={controller.scaleMode}
                  onChange={(ev) => controller.setScaleMode(ev.target.value as 'linear' | 'log')}
                >
                  <option value="linear">Linear</option>
                  <option value="log">Log</option>
                </select>
              </label>

              <label style={labelStyle}>
                Range mode
                <select
                  value={controller.rangeMode}
                  onChange={(ev) =>
                    controller.setRangeMode(ev.target.value as 'auto' | 'manual')
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                </select>
              </label>

              {controller.rangeMode === 'manual' && (
                <div style={grid2Style}>
                  <label style={labelStyle}>
                    Min
                    <input
                      type="number"
                      value={controller.manualMin}
                      onChange={(ev) =>
                        controller.setManualMin(
                          parseNumber(ev.target.value, controller.manualMin),
                        )
                      }
                    />
                  </label>
                  <label style={labelStyle}>
                    Max
                    <input
                      type="number"
                      value={controller.manualMax}
                      onChange={(ev) =>
                        controller.setManualMax(
                          parseNumber(ev.target.value, controller.manualMax),
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'appearance',
          title: 'Appearance',
          children: (
            <div style={sectionStyle}>
              <div style={grid2Style}>
                <label style={labelStyle}>
                  Low color
                  <input
                    type="color"
                    value={controller.lowColor}
                    onChange={(ev) => controller.setLowColor(ev.target.value)}
                  />
                </label>

                <label style={labelStyle}>
                  High color
                  <input
                    type="color"
                    value={controller.highColor}
                    onChange={(ev) => controller.setHighColor(ev.target.value)}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={controller.reverseScale}
                  onChange={(ev) => controller.setReverseScale(ev.target.checked)}
                />
                Reverse scale
              </label>

              <label style={labelStyle}>
                Node fill alpha
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={controller.nodeAlpha}
                  onChange={(ev) =>
                    controller.setNodeAlpha(
                      parseNumber(ev.target.value, controller.nodeAlpha),
                    )
                  }
                />
              </label>

              <div style={grid2Style}>
                <label style={labelStyle}>
                  Edge min width
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={controller.edgeMinWidth}
                    onChange={(ev) =>
                      controller.setEdgeMinWidth(
                        parseNumber(ev.target.value, controller.edgeMinWidth),
                      )
                    }
                  />
                </label>

                <label style={labelStyle}>
                  Edge max width
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={controller.edgeMaxWidth}
                    onChange={(ev) =>
                      controller.setEdgeMaxWidth(
                        parseNumber(ev.target.value, controller.edgeMaxWidth),
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
});
