import { PiFolder } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { readFile } from '../../../util/readFile';
import {
  applyBPMNImportPlan,
  buildBPMNImportPlan,
  parseBPMNXml,
} from '../../../util/bpmn';

type ImportFormat = 'json' | 'bpmn' | 'unknown';

function looksLikeJson(content: string) {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function looksLikeBPMN(content: string) {
  const trimmed = content.trim();
  return /^<[\s\S]*\bdefinitions\b/i.test(trimmed);
}

function detectImportFormat(fileName: string, content: string): ImportFormat {
  const lowered = fileName.trim().toLowerCase();

  if (lowered.endsWith('.bpm') || lowered.endsWith('.bpmn')) {
    return 'bpmn';
  }

  if (lowered.endsWith('.json')) {
    return 'json';
  }

  if (looksLikeBPMN(content)) {
    return 'bpmn';
  }

  if (looksLikeJson(content)) {
    return 'json';
  }

  return 'unknown';
}

export const OpenTool = observer(function OpenTool() {
  const d = Diagram.use();

  return (
    <PiFolder
      className="tool"
      onClick={async () => {
        const file = await readFile({
          accept:
            '.json,.bpm,.bpmn,application/json,text/xml,application/xml',
        });

        if (!file) {
          return;
        }

        const format = detectImportFormat(file.fileName, file.content);

        if (format === 'json') {
          if (!looksLikeJson(file.content)) {
            console.error(
              `[OpenTool] The file '${file.fileName}' is not valid JSON.`,
            );
            return;
          }

          if (await d.reset()) {
            d.import(file.content);
          }
          return;
        }

        if (format === 'bpmn') {
          try {
            const parsed = parseBPMNXml(file.content);
            const plan = buildBPMNImportPlan(parsed);

            if (await d.reset()) {
              const applied = applyBPMNImportPlan(d, plan);
              const allWarnings = [...plan.warnings, ...applied.warnings];
              allWarnings.forEach((warning) => {
                console.warn(`[BPMN Import] ${warning}`);
              });
              console.info(
                `[BPMN Import] Imported '${file.fileName}' with ${applied.summary.nodes} nodes, ${applied.summary.edges} edges and ${applied.summary.lanes} lane groups.`,
              );
            }
          } catch (error) {
            console.error(
              `[BPMN Import] Failed to import '${file.fileName}'.`,
              error,
            );
          }
          return;
        }

        console.error(
          `[OpenTool] Unsupported file format for '${file.fileName}'.`,
        );
      }}
      title="Open"
    />
  );
});
