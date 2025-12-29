type EnumType = Record<string, any>;

export function getEnumStr(theEnum: EnumType, index: number) {
  return `bpmn__event__${theEnum[index]}`;
}
