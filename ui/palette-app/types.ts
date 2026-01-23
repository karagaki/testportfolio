export interface Scope {
  host: string;
  pathPattern: string;
  useWildcard: boolean;
  applyToAllPaths: boolean;
}

export interface ListConfig {
  enabled: boolean;
  itemSelector: string;
}

export interface MatchConfig {
  mode: string;
  keywords: string[];
}

export interface DateConfig {
  enabled: boolean;
  applyWithoutKeyword: boolean;
  sourceType: 'attr' | 'text' | 'dayNumber';
  dateSelector: string;
  dateAttr: string;
  headerSelector: string;
  headerFormat: 'jp_ym' | 'ym_slash' | 'en_month_ym';
  grayPreset: 'weak' | 'medium' | 'strong';
}

export interface PaintConfig {
  type: 'highlight' | 'text' | 'collapse';
  bg: string;
  fg: string;
  border: string;
}

export interface MetaConfig {
  title: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Draft {
  id: string | null;
  enabled: boolean;
  scope: Scope;
  list: ListConfig;
  targetSelector: string;
  match: MatchConfig;
  date: DateConfig;
  paint: PaintConfig;
  meta: MetaConfig;
}

export interface Rule extends Draft {
  id: string;
}

export type PickerTarget = 'target' | 'date' | 'header';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface AdapterCallbacks {
  onTogglePicker: () => void;
  onPickTargetChange: (target: PickerTarget) => void;
  onGenerateListSelector: () => void;
  onExport: () => Promise<void>;
  onImport: (payload: unknown, mode: string) => Promise<void>;
  onSaveRule: (draft: Draft) => Promise<void>;
  onRuleEdit: (ruleId: string) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleToggle: (ruleId: string, enabled: boolean) => void;
  onClose: () => void;
  onMinimize: () => void;
  onDraftChange: (draft: Draft) => void;
}
