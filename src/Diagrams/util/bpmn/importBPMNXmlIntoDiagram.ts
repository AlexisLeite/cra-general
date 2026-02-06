import { Diagram } from '../../store/Diagram';
import { applyBPMNImportPlan } from './applyBPMNImportPlan';
import { buildBPMNImportPlan } from './buildBPMNImportPlan';
import { parseBPMNXml } from './parseBPMNXml';
import type { BPMNImportSummary } from './types';

export function importBPMNXmlIntoDiagram(
  diagram: Diagram,
  xml: string,
  _fileName = '',
): {
  warnings: string[];
  summary: BPMNImportSummary;
} {
  const parsed = parseBPMNXml(xml);
  const plan = buildBPMNImportPlan(parsed);
  const applied = applyBPMNImportPlan(diagram, plan);

  return {
    warnings: [...plan.warnings, ...applied.warnings],
    summary: applied.summary,
  };
}
