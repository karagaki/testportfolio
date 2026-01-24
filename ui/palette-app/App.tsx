import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Draft, Rule, PickerTarget, SaveStatus } from './types';
import * as adapter from './adapter';
import './ads.css';

// ===== Types =====
type StepKey = 'step1' | 'step2' | 'step3_1' | 'step3_2' | 'step3_3' | 'step4' | 'step5';
type StepState = 'inactive' | 'current' | 'done';
type CardKey = 'target' | 'element' | 'condition' | 'helper' | 'save';

interface StepConfig {
  key: StepKey;
  number: string;
  label: string;
  guide: string;
}

const STEPS: StepConfig[] = [
  { key: 'step1', number: '1', label: '対象URL', guide: 'このルールを適用するURLを設定します' },
  { key: 'step2', number: '2', label: '対象要素', guide: '色分けする要素をページ上で選択します' },
  { key: 'step3_1', number: '3-1', label: '類似項目', guide: '同じ構造の要素をまとめて処理するか設定します' },
  { key: 'step3_2', number: '3-2', label: 'キーワード', guide: 'マッチさせるキーワードを追加します' },
  { key: 'step3_3', number: '3-3', label: '日付設定', guide: '過去日付のグレー表示を設定します' },
  { key: 'step4', number: '4', label: '日付セレクタ', guide: '日付を取得する要素を指定します' },
  { key: 'step5', number: '5', label: '保存', guide: 'ルールを保存して有効化します' },
];

const STEP_ORDER: StepKey[] = ['step1', 'step2', 'step3_1', 'step3_2', 'step3_3', 'step4', 'step5'];

// ===== Default Draft =====
const defaultDraft: Draft = {
  id: null,
  enabled: true,
  scope: {
    host: '',
    pathPattern: '',
    useWildcard: false,
    applyToAllPaths: false,
  },
  list: {
    enabled: false,
    itemSelector: '',
  },
  targetSelector: '',
  match: {
    mode: 'includes',
    keywords: [],
  },
  date: {
    enabled: false,
    applyWithoutKeyword: false,
    sourceType: 'attr',
    dateSelector: '',
    dateAttr: 'data-date',
    headerSelector: '',
    headerFormat: 'jp_ym',
    grayPreset: 'medium',
  },
  paint: {
    type: 'highlight',
    bg: '#ffc0cb',
    fg: '#888888',
    border: 'rgba(0,0,0,0.15)',
  },
  meta: {
    title: '',
  },
};

function mergeDraft(base: Draft, partial: Partial<Draft>): Draft {
  return {
    ...base,
    ...partial,
    scope: { ...base.scope, ...partial.scope },
    list: { ...base.list, ...partial.list },
    match: { ...base.match, ...partial.match },
    date: { ...base.date, ...partial.date },
    paint: { ...base.paint, ...partial.paint },
    meta: { ...base.meta, ...partial.meta },
  };
}

// ===== Step State Calculator =====
function calculateStepCompletion(draft: Draft): Record<StepKey, boolean> {
  const step1 = !!draft.scope.host?.trim();
  const step2 = !!draft.targetSelector?.trim();
  const step3_1 = !draft.list.enabled || !!draft.list.itemSelector?.trim();
  const step3_2 = draft.match.keywords.length > 0 || (draft.date.enabled && draft.date.applyWithoutKeyword);
  const step3_3 = !draft.date.enabled || true; // If date.enabled, minimal settings are OK
  const step4 = !draft.date.enabled || !!draft.date.dateSelector?.trim();
  const step5 = false; // Step5 is never "complete" until saved

  return { step1, step2, step3_1, step3_2, step3_3, step4, step5 };
}

function normalizeStepStates(completion: Record<StepKey, boolean>): Record<StepKey, StepState> {
  const states: Record<StepKey, StepState> = {} as Record<StepKey, StepState>;
  let foundIncomplete = false;

  for (const key of STEP_ORDER) {
    if (foundIncomplete) {
      states[key] = 'inactive';
    } else if (!completion[key]) {
      states[key] = 'current';
      foundIncomplete = true;
    } else {
      states[key] = 'done';
    }
  }

  // If all complete, step5 is current
  if (!foundIncomplete) {
    states.step5 = 'current';
  }

  return states;
}

// ===== Components =====

function StepNav({
  steps,
  states,
  activeStep,
  onStepClick,
}: {
  steps: StepConfig[];
  states: Record<StepKey, StepState>;
  activeStep: StepKey;
  onStepClick: (key: StepKey) => void;
}) {
  return (
    <div className="ads-step-nav">
      {steps.map(step => {
        const state = states[step.key];
        return (
          <div
            key={step.key}
            className={`ads-step-item ads-step-item--${state}`}
            onClick={() => onStepClick(step.key)}
            style={{ cursor: state !== 'inactive' ? 'pointer' : 'default' }}
          >
            <span className="ads-step-number">{step.number}</span>
            <span className="ads-step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SectionMessage({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'warning' }) {
  return (
    <div className={`ads-section-message ${variant === 'warning' ? 'ads-section-message--warning' : ''}`}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ads-field">
      <label className="ads-field-label">{label}</label>
      {children}
    </div>
  );
}

// ===== Step Content Components =====

function Step1Content({
  draft,
  onChange,
  pageInfo,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
  pageInfo: string;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">1 対象URL</div>
      <SectionMessage>このルールを適用するURLを設定します</SectionMessage>

      <div style={{ marginBottom: 12, fontSize: 11, color: '#6b778c' }}>
        現在のページ: {pageInfo}
      </div>

      <Field label="パスパターン">
        <input
          type="text"
          className="ads-field-input"
          value={draft.scope.pathPattern}
          onChange={e => onChange({ scope: { ...draft.scope, pathPattern: e.target.value } })}
          placeholder="例: /calendar/*"
        />
      </Field>

      <label className="ads-checkbox">
        <input
          type="checkbox"
          checked={draft.scope.useWildcard}
          onChange={e => onChange({ scope: { ...draft.scope, useWildcard: e.target.checked } })}
        />
        * をワイルドカードとして使用
      </label>

      <label className="ads-checkbox" style={{ marginTop: 8 }}>
        <input
          type="checkbox"
          checked={draft.scope.applyToAllPaths}
          onChange={e => onChange({ scope: { ...draft.scope, applyToAllPaths: e.target.checked } })}
        />
        このホスト内の全ページに適用
      </label>
    </div>
  );
}

function Step2Content({
  draft,
  onChange,
  pickerActive,
  targetDisplay,
  onStartPicker,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
  pickerActive: boolean;
  targetDisplay: string;
  onStartPicker: (target: PickerTarget) => void;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">2 対象要素</div>
      <SectionMessage>色分けする要素をページ上で選択します</SectionMessage>

      <Field label="対象セレクタ">
        <div className="ads-input-row">
          <input
            type="text"
            className="ads-field-input"
            value={draft.targetSelector}
            onChange={e => onChange({ targetSelector: e.target.value })}
            placeholder="CSSセレクタ"
          />
          <button
            className={`ads-btn ${pickerActive ? 'ads-btn--primary' : 'ads-btn--subtle'}`}
            onClick={() => onStartPicker('target')}
          >
            {pickerActive ? '選択中...' : '選択'}
          </button>
        </div>
      </Field>

      <div style={{ fontSize: 11, color: '#6b778c' }}>
        選択中: {targetDisplay}
      </div>

      <Field label="タイトル（任意）">
        <input
          type="text"
          className="ads-field-input"
          value={draft.meta.title}
          onChange={e => onChange({ meta: { ...draft.meta, title: e.target.value } })}
          placeholder="ルール名"
        />
      </Field>
    </div>
  );
}

function Step3_1Content({
  draft,
  onChange,
  onGenerateListSelector,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
  onGenerateListSelector: () => void;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">3-1 類似項目</div>
      <SectionMessage>同じ構造の要素をまとめて処理するか設定します</SectionMessage>

      <div className="ads-switch" style={{ marginBottom: 12 }}>
        <div
          className={`ads-switch-toggle ${draft.list.enabled ? 'ads-active' : ''}`}
          onClick={() => onChange({ list: { ...draft.list, enabled: !draft.list.enabled } })}
        />
        <span>類似項目を処理する</span>
      </div>

      {draft.list.enabled && (
        <>
          <Field label="類似項目セレクタ">
            <input
              type="text"
              className="ads-field-input"
              value={draft.list.itemSelector}
              onChange={e => onChange({ list: { ...draft.list, itemSelector: e.target.value } })}
              placeholder="リストアイテムのセレクタ"
            />
          </Field>
          <button className="ads-btn ads-btn--subtle ads-btn--sm" onClick={onGenerateListSelector}>
            現在の選択から類似セレクタ生成
          </button>
        </>
      )}
    </div>
  );
}

function Step3_2Content({
  draft,
  onChange,
  keywordInput,
  setKeywordInput,
  onAddKeyword,
  onRemoveKeyword,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
  keywordInput: string;
  setKeywordInput: (v: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (index: number) => void;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">3-2 キーワード</div>
      <SectionMessage>マッチさせるキーワードを追加します</SectionMessage>

      <Field label="キーワード追加">
        <div className="ads-input-row">
          <input
            type="text"
            className="ads-field-input"
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddKeyword()}
            placeholder="キーワードを入力"
          />
          <button className="ads-btn ads-btn--subtle" onClick={onAddKeyword}>
            追加
          </button>
        </div>
      </Field>

      <div className="ads-tag-list">
        {draft.match.keywords.map((kw, i) => (
          <span className="ads-tag" key={i}>
            {kw}
            <button className="ads-tag-remove" onClick={() => onRemoveKeyword(i)}>×</button>
          </span>
        ))}
        {draft.match.keywords.length === 0 && (
          <span style={{ fontSize: 11, color: '#6b778c' }}>キーワードがありません</span>
        )}
      </div>

      <Field label="表現タイプ">
        <select
          className="ads-field-select"
          value={draft.paint.type}
          onChange={e => onChange({ paint: { ...draft.paint, type: e.target.value as Draft['paint']['type'] } })}
        >
          <option value="highlight">塗り（背景色）</option>
          <option value="text">文字色変更</option>
          <option value="collapse">非表示（詰める）</option>
        </select>
      </Field>

      {draft.paint.type === 'highlight' && (
        <Field label="背景色">
          <input
            type="color"
            className="ads-color-input"
            value={draft.paint.bg}
            onChange={e => onChange({ paint: { ...draft.paint, bg: e.target.value } })}
          />
        </Field>
      )}

      {draft.paint.type === 'text' && (
        <Field label="文字色">
          <input
            type="color"
            className="ads-color-input"
            value={draft.paint.fg}
            onChange={e => onChange({ paint: { ...draft.paint, fg: e.target.value } })}
          />
        </Field>
      )}
    </div>
  );
}

function Step3_3Content({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">3-3 日付設定</div>
      <SectionMessage>過去日付のグレー表示を設定します</SectionMessage>

      <div className="ads-switch" style={{ marginBottom: 12 }}>
        <div
          className={`ads-switch-toggle ${draft.date.enabled ? 'ads-active' : ''}`}
          onClick={() => onChange({ date: { ...draft.date, enabled: !draft.date.enabled } })}
        />
        <span>過去日付をグレー化</span>
      </div>

      {draft.date.enabled && (
        <>
          <label className="ads-checkbox" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={draft.date.applyWithoutKeyword}
              onChange={e => onChange({ date: { ...draft.date, applyWithoutKeyword: e.target.checked } })}
            />
            キーワード一致なしでも適用
          </label>

          <Field label="日付取得元">
            <select
              className="ads-field-select"
              value={draft.date.sourceType}
              onChange={e => onChange({ date: { ...draft.date, sourceType: e.target.value as Draft['date']['sourceType'] } })}
            >
              <option value="attr">属性</option>
              <option value="text">テキスト</option>
              <option value="dayNumber">日付番号 + 年月ヘッダ</option>
            </select>
          </Field>

          <Field label="グレー強度">
            <select
              className="ads-field-select"
              value={draft.date.grayPreset}
              onChange={e => onChange({ date: { ...draft.date, grayPreset: e.target.value as Draft['date']['grayPreset'] } })}
            >
              <option value="weak">弱</option>
              <option value="medium">中</option>
              <option value="strong">強</option>
            </select>
          </Field>
        </>
      )}
    </div>
  );
}

function Step4Content({
  draft,
  onChange,
  onStartPicker,
}: {
  draft: Draft;
  onChange: (partial: Partial<Draft>) => void;
  onStartPicker: (target: PickerTarget) => void;
}) {
  if (!draft.date.enabled) {
    return (
      <div className="ads-card">
        <div className="ads-card-title">4 日付セレクタ</div>
        <SectionMessage variant="warning">
          日付機能が無効のため、このステップはスキップされます
        </SectionMessage>
      </div>
    );
  }

  return (
    <div className="ads-card">
      <div className="ads-card-title">4 日付セレクタ</div>
      <SectionMessage>日付を取得する要素を指定します</SectionMessage>

      <Field label="日付要素セレクタ">
        <div className="ads-input-row">
          <input
            type="text"
            className="ads-field-input"
            value={draft.date.dateSelector}
            onChange={e => onChange({ date: { ...draft.date, dateSelector: e.target.value } })}
            placeholder="日付要素のセレクタ"
          />
          <button className="ads-btn ads-btn--subtle" onClick={() => onStartPicker('date')}>
            選択
          </button>
        </div>
      </Field>

      {draft.date.sourceType === 'attr' && (
        <Field label="日付属性名">
          <input
            type="text"
            className="ads-field-input"
            value={draft.date.dateAttr}
            onChange={e => onChange({ date: { ...draft.date, dateAttr: e.target.value } })}
            placeholder="data-date"
          />
        </Field>
      )}

      {draft.date.sourceType === 'dayNumber' && (
        <>
          <Field label="年月ヘッダセレクタ">
            <div className="ads-input-row">
              <input
                type="text"
                className="ads-field-input"
                value={draft.date.headerSelector}
                onChange={e => onChange({ date: { ...draft.date, headerSelector: e.target.value } })}
                placeholder="年月ヘッダのセレクタ"
              />
              <button className="ads-btn ads-btn--subtle" onClick={() => onStartPicker('header')}>
                選択
              </button>
            </div>
          </Field>

          <Field label="年月フォーマット">
            <select
              className="ads-field-select"
              value={draft.date.headerFormat}
              onChange={e => onChange({ date: { ...draft.date, headerFormat: e.target.value as Draft['date']['headerFormat'] } })}
            >
              <option value="jp_ym">2026年1月</option>
              <option value="ym_slash">2026/1</option>
              <option value="en_month_ym">January 2026</option>
            </select>
          </Field>
        </>
      )}
    </div>
  );
}

function Step5Content({
  draft,
  saveStatus,
  saveMessage,
  canSave,
  onSave,
}: {
  draft: Draft;
  saveStatus: SaveStatus;
  saveMessage: string;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <div className="ads-card">
      <div className="ads-card-title">5 保存</div>
      <SectionMessage>ルールを保存して有効化します</SectionMessage>

      {!canSave && (
        <SectionMessage variant="warning">
          保存するには、対象要素の選択とキーワードの追加が必要です
        </SectionMessage>
      )}

      <button
        className="ads-btn ads-btn--primary"
        style={{ width: '100%', marginTop: 12 }}
        disabled={!canSave || saveStatus === 'saving'}
        onClick={onSave}
      >
        {saveStatus === 'saving' ? '保存中...' : '保存して有効化'}
      </button>

      {saveStatus === 'success' && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#006644' }}>{saveMessage}</div>
      )}
      {saveStatus === 'error' && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#bf2600' }}>{saveMessage}</div>
      )}
    </div>
  );
}

function RulesList({
  rules,
  onToggle,
  onEdit,
  onDelete,
}: {
  rules: Rule[];
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (rules.length === 0) {
    return (
      <div className="ads-card">
        <div className="ads-card-title">このページのルール</div>
        <div style={{ fontSize: 11, color: '#6b778c' }}>ルールはまだありません</div>
      </div>
    );
  }

  return (
    <div className="ads-card">
      <div className="ads-card-title">このページのルール</div>
      <div className="ads-rule-list">
        {rules.map(rule => (
          <div className="ads-rule-item" key={rule.id}>
            <span className="ads-rule-name">{rule.meta?.title || rule.targetSelector || '無題'}</span>
            <div className="ads-rule-actions">
              <input
                type="checkbox"
                checked={rule.enabled !== false}
                onChange={e => onToggle(rule.id, e.target.checked)}
              />
              <button className="ads-btn ads-btn--subtle ads-btn--sm" onClick={() => onEdit(rule.id)}>
                編集
              </button>
              <button className="ads-btn ads-btn--subtle ads-btn--sm" onClick={() => onDelete(rule.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== New UI Skeleton (Phase 1) =====
function NewPanelSkeleton({
  pickerActive,
  onClose,
  onCancel,
  onStepClick,
  cardRefs,
  cardContents,
}: {
  pickerActive: boolean;
  onClose: () => void;
  onCancel: () => void;
  onStepClick: (key: CardKey) => void;
  cardRefs: Record<CardKey, React.RefObject<HTMLElement>>;
  cardContents: Record<CardKey, React.ReactNode>;
}) {
  // In phase1, badge states are static placeholders
  // Will be connected to actual state in phase2
  return (
    <div className="aps2-root">
      <div className="aps2-topbar">
        <div className="aps2-title">Aパレットサーチ</div>
        <div className="aps2-mode">
          {pickerActive ? '選択モード：対象要素を選択中' : '編集モード'}
        </div>
        <div className="aps2-actions">
          <button className="aps2-btn" onClick={onClose}>終了</button>
          <button className="aps2-btn" onClick={onCancel}>キャンセル</button>
        </div>
      </div>

      <div className="aps2-progress" role="tablist">
        <button className="aps2-step is-done" data-step="target" onClick={() => onStepClick('target')}>対象</button>
        <button className="aps2-step is-editing" data-step="element" onClick={() => onStepClick('element')}>要素</button>
        <button className="aps2-step is-empty" data-step="condition" onClick={() => onStepClick('condition')}>条件</button>
        <button className="aps2-step is-empty" data-step="helper" onClick={() => onStepClick('helper')}>補助</button>
        <button className="aps2-step is-empty" data-step="save" onClick={() => onStepClick('save')}>保存</button>
      </div>

      <div className="aps2-cards">
        <section className="aps2-card" data-card="target" ref={cardRefs.target}>
          <header className="aps2-card-h">
            <div className="aps2-card-t">対象</div>
            <div className="aps2-badge is-done">完了</div>
          </header>
          <div className="aps2-card-b">
            {cardContents.target}
          </div>
        </section>

        <section className="aps2-card" data-card="element" ref={cardRefs.element}>
          <header className="aps2-card-h">
            <div className="aps2-card-t">要素</div>
            <div className="aps2-badge is-editing">編集中</div>
          </header>
          <div className="aps2-card-b">
            {cardContents.element}
          </div>
        </section>

        <section className="aps2-card" data-card="condition" ref={cardRefs.condition}>
          <header className="aps2-card-h">
            <div className="aps2-card-t">条件</div>
            <div className="aps2-badge is-empty">未設定</div>
          </header>
          <div className="aps2-card-b">
            {cardContents.condition}
          </div>
        </section>

        <section className="aps2-card" data-card="helper" ref={cardRefs.helper}>
          <header className="aps2-card-h">
            <div className="aps2-card-t">補助</div>
            <div className="aps2-badge is-empty">未設定</div>
          </header>
          <div className="aps2-card-b">
            {cardContents.helper}
          </div>
        </section>

        <section className="aps2-card" data-card="save" ref={cardRefs.save}>
          <header className="aps2-card-h">
            <div className="aps2-card-t">保存・有効化</div>
            <div className="aps2-badge is-empty">未設定</div>
          </header>
          <div className="aps2-card-b">
            {cardContents.save}
          </div>
        </section>
      </div>
    </div>
  );
}

// ===== Main App =====

export default function App() {
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [rules, setRules] = useState<Rule[]>([]);
  const [pageInfo, setPageInfo] = useState('');
  const [pickerActive, setPickerActive] = useState(false);
  const [targetDisplay, setTargetDisplay] = useState('未選択');
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [activeStep, setActiveStep] = useState<StepKey>('step1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetCardRef = useRef<HTMLDivElement>(null);
  const elementCardRef = useRef<HTMLDivElement>(null);
  const conditionCardRef = useRef<HTMLDivElement>(null);
  const helperCardRef = useRef<HTMLDivElement>(null);
  const saveCardRef = useRef<HTMLDivElement>(null);

  const syncFromGlobal = useCallback(() => {
    const state = adapter.getState();
    if (state) {
      setDraft(state.draft);
      setRules(state.rules);
      setPageInfo(state.pageInfo);
      setPickerActive(state.pickerActive);
      setVisible(state.visible);
      setMinimized(state.minimized);
      setTargetDisplay(state.targetDisplay);
    }
  }, []);

  useEffect(() => {
    syncFromGlobal();
    window.__aps_react_update = () => syncFromGlobal();
    return () => { window.__aps_react_update = undefined; };
  }, [syncFromGlobal]);

  const handleDraftChange = useCallback((partial: Partial<Draft>) => {
    setDraft(prev => {
      const updated = mergeDraft(prev, partial);
      adapter.updateDraft(updated);
      return updated;
    });
  }, []);

  const handleAddKeyword = useCallback(() => {
    const value = keywordInput.trim();
    if (!value) return;
    setDraft(prev => {
      const updated = {
        ...prev,
        match: { ...prev.match, keywords: [...prev.match.keywords, value] },
      };
      adapter.updateDraft(updated);
      return updated;
    });
    setKeywordInput('');
  }, [keywordInput]);

  const handleRemoveKeyword = useCallback((index: number) => {
    setDraft(prev => {
      const keywords = [...prev.match.keywords];
      keywords.splice(index, 1);
      const updated = { ...prev, match: { ...prev.match, keywords } };
      adapter.updateDraft(updated);
      return updated;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft.targetSelector?.trim()) return;
    const allowNoKeywords = draft.date.enabled && draft.date.applyWithoutKeyword;
    if (!draft.match.keywords.length && !allowNoKeywords) return;

    setSaveStatus('saving');
    setSaveMessage('');
    try {
      await adapter.saveRule(draft);
      setSaveStatus('success');
      setSaveMessage('保存完了');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(err instanceof Error ? err.message : '保存失敗');
    }
  }, [draft]);

  const handleExport = useCallback(async () => {
    try {
      await adapter.exportData();
    } catch {}
  }, []);

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await adapter.importData(payload, importMode);
    } catch {}
  }, [importMode]);

  const handleStartPicker = useCallback((target: PickerTarget) => {
    adapter.startPicker(target);
  }, []);

  // Calculate step states
  const stepCompletion = useMemo(() => calculateStepCompletion(draft), [draft]);
  const stepStates = useMemo(() => normalizeStepStates(stepCompletion), [stepCompletion]);

  // Auto-navigate to current step
  useEffect(() => {
    const currentStep = STEP_ORDER.find(key => stepStates[key] === 'current');
    if (currentStep && activeStep !== currentStep) {
      // Only auto-navigate if user hasn't manually selected a completed step
      if (stepStates[activeStep] !== 'done') {
        setActiveStep(currentStep);
      }
    }
  }, [stepStates, activeStep]);

  const canSave = !!draft.targetSelector?.trim() &&
    (draft.match.keywords.length > 0 || (draft.date.enabled && draft.date.applyWithoutKeyword));

  const handleStepClick = (key: StepKey) => {
    if (stepStates[key] !== 'inactive') {
      setActiveStep(key);
    }
  };

  const cardRefs = useMemo(() => ({
    target: targetCardRef,
    element: elementCardRef,
    condition: conditionCardRef,
    helper: helperCardRef,
    save: saveCardRef,
  }), []);

  const handleCardStepClick = useCallback((key: CardKey) => {
    const ref = cardRefs[key];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [cardRefs]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 'step1':
        return <Step1Content draft={draft} onChange={handleDraftChange} pageInfo={pageInfo} />;
      case 'step2':
        return (
          <Step2Content
            draft={draft}
            onChange={handleDraftChange}
            pickerActive={pickerActive}
            targetDisplay={targetDisplay}
            onStartPicker={handleStartPicker}
          />
        );
      case 'step3_1':
        return (
          <Step3_1Content
            draft={draft}
            onChange={handleDraftChange}
            onGenerateListSelector={() => adapter.generateListSelector()}
          />
        );
      case 'step3_2':
        return (
          <Step3_2Content
            draft={draft}
            onChange={handleDraftChange}
            keywordInput={keywordInput}
            setKeywordInput={setKeywordInput}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
          />
        );
      case 'step3_3':
        return <Step3_3Content draft={draft} onChange={handleDraftChange} />;
      case 'step4':
        return <Step4Content draft={draft} onChange={handleDraftChange} onStartPicker={handleStartPicker} />;
      case 'step5':
        return (
          <Step5Content
            draft={draft}
            saveStatus={saveStatus}
            saveMessage={saveMessage}
            canSave={canSave}
            onSave={handleSave}
          />
        );
      default:
        return null;
    }
  };

  const cardContents = useMemo(() => ({
    target: <Step1Content draft={draft} onChange={handleDraftChange} pageInfo={pageInfo} />,
    element: (
      <Step2Content
        draft={draft}
        onChange={handleDraftChange}
        pickerActive={pickerActive}
        targetDisplay={targetDisplay}
        onStartPicker={handleStartPicker}
      />
    ),
    condition: (
      <>
        <Step3_1Content
          draft={draft}
          onChange={handleDraftChange}
          onGenerateListSelector={() => adapter.generateListSelector()}
        />
        <Step3_2Content
          draft={draft}
          onChange={handleDraftChange}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          onAddKeyword={handleAddKeyword}
          onRemoveKeyword={handleRemoveKeyword}
        />
      </>
    ),
    helper: (
      <>
        <Step3_3Content draft={draft} onChange={handleDraftChange} />
        <Step4Content draft={draft} onChange={handleDraftChange} onStartPicker={handleStartPicker} />
      </>
    ),
    save: (
      <Step5Content
        draft={draft}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        canSave={canSave}
        onSave={handleSave}
      />
    ),
  }), [
    draft,
    pageInfo,
    handleDraftChange,
    pickerActive,
    targetDisplay,
    handleStartPicker,
    keywordInput,
    setKeywordInput,
    handleAddKeyword,
    handleRemoveKeyword,
    saveStatus,
    saveMessage,
    canSave,
    handleSave,
  ]);

  if (!visible) return null;

  return (
    <>
      {/* ===== New UI (Phase 1 skeleton) ===== */}
      <NewPanelSkeleton
        pickerActive={pickerActive}
        onClose={() => adapter.closePalette()}
        onCancel={() => adapter.stopPicker()}
        onStepClick={handleCardStepClick}
        cardRefs={cardRefs}
        cardContents={cardContents}
      />

      {/* ===== Old UI (hidden for phase1, kept for rollback) ===== */}
      <div className={`ads-panel aps-legacy-hidden ${minimized ? 'ads-minimized' : ''}`}>
      {/* Header */}
      <div className="ads-panel-header">
        <span className="ads-panel-title">Aパレットサーチ</span>
        <div className="ads-panel-actions">
          <button className="ads-icon-btn" onClick={() => adapter.minimizePalette()}>
            {minimized ? '+' : '_'}
          </button>
          <button className="ads-icon-btn" onClick={() => adapter.closePalette()}>
            ×
          </button>
        </div>
      </div>

      {/* Picker banner */}
      <div className={`ads-banner ${pickerActive ? 'ads-active' : ''}`}>
        <span>選択モード: 要素を選択中</span>
        <div className="ads-banner-actions">
          <button className="ads-btn ads-btn--sm ads-btn--subtle" onClick={() => adapter.startPicker('target')}>
            終了
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="ads-panel-body">
        {/* Left: Step navigation */}
        <StepNav
          steps={STEPS}
          states={stepStates}
          activeStep={activeStep}
          onStepClick={handleStepClick}
        />

        {/* Right: Main content */}
        <div className="ads-main">
          {renderStepContent()}
          <RulesList
            rules={rules}
            onToggle={(id, enabled) => adapter.toggleRule(id, enabled)}
            onEdit={id => adapter.editRule(id)}
            onDelete={id => adapter.deleteRule(id)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="ads-footer">
        <div className="ads-footer-secondary">
          <button className="ads-btn ads-btn--subtle ads-btn--sm" onClick={handleExport}>
            エクスポート
          </button>
          <button className="ads-btn ads-btn--subtle ads-btn--sm" onClick={() => fileInputRef.current?.click()}>
            インポート
          </button>
          <select
            className="ads-field-select"
            style={{ width: 80, padding: '4px 6px', fontSize: 11 }}
            value={importMode}
            onChange={e => setImportMode(e.target.value as 'merge' | 'replace')}
          >
            <option value="merge">マージ</option>
            <option value="replace">置換</option>
          </select>
        </div>
        <span style={{ fontSize: 11, color: '#6b778c' }}>ルール: {rules.length}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
          e.target.value = '';
        }}
      />

      {/* Status bar */}
      <div className="ads-status-bar">
        <span className={saveStatus === 'saving' ? 'ads-status-saving' : saveStatus === 'success' ? 'ads-status-success' : saveStatus === 'error' ? 'ads-status-error' : ''}>
          {saveStatus === 'idle' ? '下書き' : saveStatus === 'saving' ? '保存中...' : saveMessage}
        </span>
      </div>
    </div>
    </>
  );
}
