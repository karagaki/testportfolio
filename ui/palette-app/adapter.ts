import type { Draft, Rule, PickerTarget, AdapterCallbacks } from './types';

declare global {
  interface Window {
    __aps_adapter_callbacks?: AdapterCallbacks;
    __aps_adapter_state?: {
      pageInfo: string;
      draft: Draft;
      rules: Rule[];
      pickerActive: boolean;
      visible: boolean;
      minimized: boolean;
      targetDisplay: string;
    };
    __aps_react_update?: () => void;
  }
}

export function getCallbacks(): AdapterCallbacks | null {
  return window.__aps_adapter_callbacks ?? null;
}

export function getState() {
  return window.__aps_adapter_state ?? null;
}

export function startPicker(target: PickerTarget): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onPickTargetChange(target);
  callbacks.onTogglePicker();
}

export function stopPicker(): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onTogglePicker();
}

export function generateListSelector(): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onGenerateListSelector();
}

export async function saveRule(draft: Draft): Promise<void> {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  await callbacks.onSaveRule(draft);
}

export function editRule(ruleId: string): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onRuleEdit(ruleId);
}

export function deleteRule(ruleId: string): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onRuleDelete(ruleId);
}

export function toggleRule(ruleId: string, enabled: boolean): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onRuleToggle(ruleId, enabled);
}

export async function exportData(): Promise<void> {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  await callbacks.onExport();
}

export async function importData(payload: unknown, mode: string): Promise<void> {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  await callbacks.onImport(payload, mode);
}

export function closePalette(): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onClose();
}

export function minimizePalette(): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onMinimize();
}

export function updateDraft(draft: Draft): void {
  const callbacks = getCallbacks();
  if (!callbacks) return;
  callbacks.onDraftChange(draft);
}

export function notifyReactUpdate(): void {
  if (window.__aps_react_update) {
    window.__aps_react_update();
  }
}
