import { observer } from 'mobx-react-lite';
import type { ChangeEvent } from 'react';
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
    <div className="diagram__plain_panel" id="BPMNStatisticsPanel">
      <div className="collapsible_panel__header data" aria-expanded>
        <span className="collapsible_panel__title">Statistics Data</span>
      </div>
      <div className="collapsible_panel__content data">
        <div className="diagram__stats_section">
          <input
            type="file"
            accept=".json,application/json"
            onChange={onUpload}
          />
          <div className="diagram__stats_actions">
            <button
              onClick={() => controller.apply()}
              disabled={!controller.hasDataset}
            >
              Re-apply
            </button>
            <button
              onClick={() => controller.clear()}
              disabled={!controller.hasDataset}
            >
              Clear
            </button>
            <button onClick={() => controller.downloadSampleFile()}>
              Sample
            </button>
          </div>
          {controller.fileName && (
            <div className="diagram__stats_meta">
              Loaded file: {controller.fileName}
            </div>
          )}
          {controller.error && (
            <div className="diagram__stats_meta diagram__stats_meta_error">
              {controller.error}
            </div>
          )}
          {controller.hasDataset && (
            <div className="diagram__stats_meta">
              Nodes matched: {controller.matchedNodes} | Unmatched rows:{' '}
              {controller.unmatchedNodeStats}
              <br />
              Edges matched: {controller.matchedEdges} | Unmatched rows:{' '}
              {controller.unmatchedEdgeStats}
            </div>
          )}
        </div>
      </div>

      <div className="collapsible_panel__header metrics" aria-expanded>
        <span className="collapsible_panel__title">Metrics</span>
      </div>
      <div className="collapsible_panel__content metrics">
        <div className="diagram__stats_section">
          <label className="diagram__stats_label">
            Node metric
            <select
              value={controller.nodeMetric}
              onChange={(ev) =>
                controller.setNodeMetric(ev.target.value as BPMNMetric)
              }
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="diagram__stats_label">
            Edge metric
            <select
              value={controller.edgeMetric}
              onChange={(ev) =>
                controller.setEdgeMetric(ev.target.value as BPMNMetric)
              }
            >
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="collapsible_panel__header scale" aria-expanded>
        <span className="collapsible_panel__title">Scale</span>
      </div>
      <div className="collapsible_panel__content scale">
        <div className="diagram__stats_section">
          <label className="diagram__stats_label">
            Scale mode
            <select
              value={controller.scaleMode}
              onChange={(ev) =>
                controller.setScaleMode(ev.target.value as 'linear' | 'log')
              }
            >
              <option value="linear">Linear</option>
              <option value="log">Log</option>
            </select>
          </label>

          <label className="diagram__stats_label">
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
            <div className="diagram__stats_grid_2">
              <label className="diagram__stats_label">
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
              <label className="diagram__stats_label">
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
      </div>

      <div className="collapsible_panel__header appearance" aria-expanded>
        <span className="collapsible_panel__title">Appearance</span>
      </div>
      <div className="collapsible_panel__content appearance">
        <div className="diagram__stats_section">
          <div className="diagram__stats_grid_2">
            <label className="diagram__stats_label">
              Low color
              <input
                type="color"
                value={controller.lowColor}
                onChange={(ev) => controller.setLowColor(ev.target.value)}
              />
            </label>

            <label className="diagram__stats_label">
              High color
              <input
                type="color"
                value={controller.highColor}
                onChange={(ev) => controller.setHighColor(ev.target.value)}
              />
            </label>
          </div>

          <label className="diagram__stats_checkbox">
            <input
              type="checkbox"
              checked={controller.reverseScale}
              onChange={(ev) => controller.setReverseScale(ev.target.checked)}
            />
            Reverse scale
          </label>

          <label className="diagram__stats_label">
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

          <div className="diagram__stats_grid_2">
            <label className="diagram__stats_label">
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

            <label className="diagram__stats_label">
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
      </div>
    </div>
  );
});
