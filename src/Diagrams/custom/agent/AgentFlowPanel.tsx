import { observer } from 'mobx-react-lite';
import type { AgentFlowController } from './AgentFlowController';
import type {
  ActionPayload,
  ConditionPayload,
  OutcomePayload,
  TriggerPayload,
} from './types';

type AgentFlowPanelProps = {
  controller: AgentFlowController;
};

type PayloadEditorProps<TPayload> = {
  payload: TPayload;
  onPatch: (patch: Partial<TPayload>) => void;
};

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function TriggerPayloadEditor({
  payload,
  onPatch,
}: PayloadEditorProps<TriggerPayload>) {
  return (
    <>
      <label className="diagram__stats_label">
        Trigger type
        <select
          value={payload.triggerType}
          onChange={(ev) =>
            onPatch({
              triggerType: ev.target.value as TriggerPayload['triggerType'],
            })
          }
        >
          <option value="manual">Manual</option>
          <option value="event">Event</option>
          <option value="schedule">Schedule</option>
        </select>
      </label>
      <label className="diagram__stats_label">
        Source
        <input
          value={payload.source}
          onChange={(ev) => onPatch({ source: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Event name
        <input
          value={payload.eventName}
          onChange={(ev) => onPatch({ eventName: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Schedule
        <input
          placeholder="Cron or human-readable schedule"
          value={payload.schedule}
          onChange={(ev) => onPatch({ schedule: ev.target.value })}
        />
      </label>
    </>
  );
}

function ActionPayloadEditor({
  payload,
  onPatch,
}: PayloadEditorProps<ActionPayload>) {
  return (
    <>
      <label className="diagram__stats_label">
        Action type
        <select
          value={payload.actionType}
          onChange={(ev) =>
            onPatch({
              actionType: ev.target.value as ActionPayload['actionType'],
            })
          }
        >
          <option value="task">Task</option>
          <option value="api">API</option>
          <option value="notification">Notification</option>
          <option value="human">Human</option>
        </select>
      </label>
      <label className="diagram__stats_label">
        Operation
        <input
          value={payload.operation}
          onChange={(ev) => onPatch({ operation: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Input ref
        <input
          value={payload.inputRef}
          onChange={(ev) => onPatch({ inputRef: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Output ref
        <input
          value={payload.outputRef}
          onChange={(ev) => onPatch({ outputRef: ev.target.value })}
        />
      </label>
    </>
  );
}

function ConditionPayloadEditor({
  payload,
  onPatch,
}: PayloadEditorProps<ConditionPayload>) {
  return (
    <>
      <label className="diagram__stats_label">
        Expression
        <textarea
          value={payload.expression}
          rows={3}
          onChange={(ev) => onPatch({ expression: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Language
        <select
          value={payload.language}
          onChange={(ev) =>
            onPatch({
              language: ev.target.value as ConditionPayload['language'],
            })
          }
        >
          <option value="rule">Rule</option>
          <option value="javascript">JavaScript</option>
          <option value="jsonpath">JSONPath</option>
        </select>
      </label>
      <div className="diagram__stats_grid_2">
        <label className="diagram__stats_label">
          True label
          <input
            value={payload.trueLabel}
            onChange={(ev) => onPatch({ trueLabel: ev.target.value })}
          />
        </label>
        <label className="diagram__stats_label">
          False label
          <input
            value={payload.falseLabel}
            onChange={(ev) => onPatch({ falseLabel: ev.target.value })}
          />
        </label>
      </div>
    </>
  );
}

function OutcomePayloadEditor({
  payload,
  onPatch,
}: PayloadEditorProps<OutcomePayload>) {
  return (
    <>
      <label className="diagram__stats_label">
        Status
        <select
          value={payload.status}
          onChange={(ev) =>
            onPatch({
              status: ev.target.value as OutcomePayload['status'],
            })
          }
        >
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="neutral">Neutral</option>
        </select>
      </label>
      <label className="diagram__stats_label">
        Code
        <input
          value={payload.code}
          onChange={(ev) => onPatch({ code: ev.target.value })}
        />
      </label>
      <label className="diagram__stats_label">
        Summary
        <textarea
          value={payload.summary}
          rows={3}
          onChange={(ev) => onPatch({ summary: ev.target.value })}
        />
      </label>
    </>
  );
}

export const AgentFlowPanel = observer(function AgentFlowPanel({
  controller,
}: AgentFlowPanelProps) {
  const selectedNodes = controller.selectedAgentNodes;
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  return (
    <div className="diagram__plain_panel" id="AgentFlowPanel">
      <div className="collapsible_panel__header templates" aria-expanded>
        <span className="collapsible_panel__title">Flow Templates</span>
      </div>
      <div className="collapsible_panel__content templates">
        <div className="diagram__stats_section">
          <div className="diagram__stats_actions">
            <button onClick={() => controller.createTriggerOutcomeTemplate()}>
              Trigger Chain
            </button>
            <button onClick={() => controller.createConditionalTemplate()}>
              Conditional
            </button>
            <button
              onClick={() =>
                controller.createChainTemplate({
                  steps: ['action', 'action', 'outcome'],
                  labels: ['Action A', 'Action B', 'Outcome'],
                })
              }
            >
              Action Chain
            </button>
          </div>
        </div>
      </div>

      <div className="collapsible_panel__header layout" aria-expanded>
        <span className="collapsible_panel__title">Template Layout</span>
      </div>
      <div className="collapsible_panel__content layout">
        <div className="diagram__stats_section diagram__stats_grid_2">
          <label className="diagram__stats_label">
            Horizontal gap
            <input
              type="number"
              min={120}
              step={10}
              value={controller.horizontalGap}
              onChange={(ev) =>
                controller.setHorizontalGap(
                  parseNumber(ev.target.value, controller.horizontalGap),
                )
              }
            />
          </label>
          <label className="diagram__stats_label">
            Vertical gap
            <input
              type="number"
              min={80}
              step={10}
              value={controller.verticalGap}
              onChange={(ev) =>
                controller.setVerticalGap(
                  parseNumber(ev.target.value, controller.verticalGap),
                )
              }
            />
          </label>
        </div>
      </div>

      <div className="collapsible_panel__header selected" aria-expanded>
        <span className="collapsible_panel__title">Selected Node</span>
      </div>
      <div className="collapsible_panel__content selected">
        <div className="diagram__stats_section">
          {!selectedNode && (
            <div className="diagram__stats_meta">
              Select exactly one agent node to edit its typed payload.
            </div>
          )}

          {selectedNode && (
            <>
              <div className="diagram__stats_meta">
                ID: {selectedNode.id} | Type: {selectedNode.kind}
              </div>
              <label className="diagram__stats_label">
                Label
                <input
                  value={selectedNode.state.label}
                  onChange={(ev) =>
                    controller.updateNodeLabel(selectedNode.id, ev.target.value)
                  }
                />
              </label>

              {selectedNode.kind === 'trigger' && (
                <TriggerPayloadEditor
                  payload={selectedNode.payload as TriggerPayload}
                  onPatch={(patch) =>
                    controller.updateNodePayload(selectedNode.id, patch)
                  }
                />
              )}

              {selectedNode.kind === 'action' && (
                <ActionPayloadEditor
                  payload={selectedNode.payload as ActionPayload}
                  onPatch={(patch) =>
                    controller.updateNodePayload(selectedNode.id, patch)
                  }
                />
              )}

              {selectedNode.kind === 'condition' && (
                <ConditionPayloadEditor
                  payload={selectedNode.payload as ConditionPayload}
                  onPatch={(patch) =>
                    controller.updateNodePayload(selectedNode.id, patch)
                  }
                />
              )}

              {selectedNode.kind === 'outcome' && (
                <OutcomePayloadEditor
                  payload={selectedNode.payload as OutcomePayload}
                  onPatch={(patch) =>
                    controller.updateNodePayload(selectedNode.id, patch)
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
