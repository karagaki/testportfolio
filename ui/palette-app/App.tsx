import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ConfigProvider,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Space,
  Typography,
  Divider,
  Tag,
  Card,
  Upload,
  message,
  Tooltip,
  ColorPicker,
  List,
  Checkbox,
} from 'antd';
import {
  CloseOutlined,
  MinusOutlined,
  AimOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { Draft, Rule, PickerTarget, SaveStatus } from './types';
import * as adapter from './adapter';

const { Text } = Typography;
const { TextArea } = Input;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateCounterRef = useRef(0);

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
    window.__aps_react_update = () => {
      updateCounterRef.current++;
      syncFromGlobal();
    };
    return () => {
      window.__aps_react_update = undefined;
    };
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
        match: {
          ...prev.match,
          keywords: [...prev.match.keywords, value],
        },
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
    if (!draft.targetSelector?.trim()) {
      message.warning('対象の枠を選択してください');
      return;
    }
    const allowNoKeywords = draft.date.enabled && draft.date.applyWithoutKeyword;
    if (!draft.match.keywords.length && !allowNoKeywords) {
      message.warning('キーワードを追加してください');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('');
    try {
      await adapter.saveRule(draft);
      setSaveStatus('success');
      setSaveMessage('保存OK');
      message.success('ルールを保存しました');
      setTimeout(() => {
        if (saveStatus === 'success') {
          setSaveStatus('idle');
          setSaveMessage('');
        }
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
      const errorMsg = err instanceof Error ? err.message : '保存失敗';
      setSaveMessage(errorMsg);
      message.error(errorMsg);
    }
  }, [draft, saveStatus]);

  const handleExport = useCallback(async () => {
    try {
      await adapter.exportData();
      message.success('エクスポート完了');
    } catch {
      message.error('エクスポート失敗');
    }
  }, []);

  const handleImport = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await adapter.importData(payload, importMode);
      message.success('インポート完了');
    } catch {
      message.error('インポート失敗');
    }
  }, [importMode]);

  const handleStartPicker = useCallback((target: PickerTarget) => {
    adapter.startPicker(target);
  }, []);

  if (!visible) return null;

  const statusIcon = {
    idle: null,
    saving: <LoadingOutlined style={{ color: '#1890ff' }} />,
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    error: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
  }[saveStatus];

  const statusColor = {
    idle: undefined,
    saving: undefined,
    success: 'success' as const,
    error: 'danger' as const,
  }[saveStatus];

  return (
    <ConfigProvider
      theme={{
        token: {
          fontSize: 12,
          borderRadius: 4,
        },
      }}
    >
      <Card
        className={`aps-palette-react ${minimized ? 'aps-minimized' : ''}`}
        size="small"
        title={
          <Space>
            <span>Aパレットサーチ</span>
            {saveStatus !== 'idle' && (
              <Space size={4}>
                {statusIcon}
                <Text type={statusColor} style={{ fontSize: 11 }}>
                  {saveMessage}
                </Text>
              </Space>
            )}
          </Space>
        }
        extra={
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              onClick={() => adapter.minimizePalette()}
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => adapter.closePalette()}
            />
          </Space>
        }
        styles={{
          body: { display: minimized ? 'none' : 'block', padding: '8px 12px' },
        }}
      >
        <div className="aps-page-info" style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {pageInfo}
          </Text>
        </div>

        <Tabs
          size="small"
          defaultActiveKey="basic"
          items={[
            {
              key: 'basic',
              label: '基本',
              children: (
                <Form layout="vertical" size="small">
                  <Form.Item label="タイトル">
                    <Input
                      value={draft.meta.title}
                      onChange={e =>
                        handleDraftChange({ meta: { ...draft.meta, title: e.target.value } })
                      }
                      placeholder="ルール名（任意）"
                    />
                  </Form.Item>

                  <Form.Item label="対象セレクタ">
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        value={draft.targetSelector}
                        onChange={e =>
                          handleDraftChange({ targetSelector: e.target.value })
                        }
                        placeholder="CSSセレクタ"
                        style={{ flex: 1 }}
                      />
                      <Button
                        icon={<AimOutlined />}
                        onClick={() => handleStartPicker('target')}
                        type={pickerActive ? 'primary' : 'default'}
                      >
                        {pickerActive ? '選択中' : '選択'}
                      </Button>
                    </Space.Compact>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      選択中: {targetDisplay}
                    </Text>
                  </Form.Item>

                  <Form.Item label="キーワード">
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onPressEnter={handleAddKeyword}
                        placeholder="キーワードを入力"
                        style={{ flex: 1 }}
                      />
                      <Button icon={<PlusOutlined />} onClick={handleAddKeyword}>
                        追加
                      </Button>
                    </Space.Compact>
                    <div style={{ marginTop: 4 }}>
                      {draft.match.keywords.map((kw, i) => (
                        <Tag
                          key={i}
                          closable
                          onClose={() => handleRemoveKeyword(i)}
                          style={{ marginBottom: 4 }}
                        >
                          {kw}
                        </Tag>
                      ))}
                    </div>
                  </Form.Item>

                  <Form.Item label="対象URL">
                    <Input
                      value={draft.scope.pathPattern}
                      onChange={e =>
                        handleDraftChange({
                          scope: { ...draft.scope, pathPattern: e.target.value },
                        })
                      }
                      placeholder="パスパターン"
                    />
                    <Space direction="vertical" size={0} style={{ marginTop: 4 }}>
                      <Checkbox
                        checked={draft.scope.useWildcard}
                        onChange={e =>
                          handleDraftChange({
                            scope: { ...draft.scope, useWildcard: e.target.checked },
                          })
                        }
                      >
                        * を使う
                      </Checkbox>
                      <Checkbox
                        checked={draft.scope.applyToAllPaths}
                        onChange={e =>
                          handleDraftChange({
                            scope: { ...draft.scope, applyToAllPaths: e.target.checked },
                          })
                        }
                      >
                        このホスト内の全ページに適用
                      </Checkbox>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'list',
              label: 'リスト',
              children: (
                <Form layout="vertical" size="small">
                  <Form.Item>
                    <Switch
                      checked={draft.list.enabled}
                      onChange={checked =>
                        handleDraftChange({ list: { ...draft.list, enabled: checked } })
                      }
                    />
                    <Text style={{ marginLeft: 8 }}>類似項目を処理</Text>
                  </Form.Item>

                  {draft.list.enabled && (
                    <>
                      <Form.Item label="類似項目セレクタ">
                        <Input
                          value={draft.list.itemSelector}
                          onChange={e =>
                            handleDraftChange({
                              list: { ...draft.list, itemSelector: e.target.value },
                            })
                          }
                          placeholder="リストアイテムのセレクタ"
                        />
                      </Form.Item>
                      <Button
                        size="small"
                        onClick={() => adapter.generateListSelector()}
                      >
                        現在の選択から類似セレクタ生成
                      </Button>
                    </>
                  )}
                </Form>
              ),
            },
            {
              key: 'date',
              label: '日付',
              children: (
                <Form layout="vertical" size="small">
                  <Form.Item>
                    <Switch
                      checked={draft.date.enabled}
                      onChange={checked =>
                        handleDraftChange({ date: { ...draft.date, enabled: checked } })
                      }
                    />
                    <Text style={{ marginLeft: 8 }}>過去日付をグレー化</Text>
                  </Form.Item>

                  {draft.date.enabled && (
                    <>
                      <Form.Item>
                        <Checkbox
                          checked={draft.date.applyWithoutKeyword}
                          onChange={e =>
                            handleDraftChange({
                              date: { ...draft.date, applyWithoutKeyword: e.target.checked },
                            })
                          }
                        >
                          キーワード一致なしでも適用
                        </Checkbox>
                      </Form.Item>

                      <Form.Item label="日付取得元">
                        <Select
                          value={draft.date.sourceType}
                          onChange={value =>
                            handleDraftChange({ date: { ...draft.date, sourceType: value } })
                          }
                          options={[
                            { value: 'attr', label: '属性' },
                            { value: 'text', label: 'テキスト' },
                            { value: 'dayNumber', label: '日付番号 + 年月ヘッダ' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item label="日付要素セレクタ">
                        <Space.Compact style={{ width: '100%' }}>
                          <Input
                            value={draft.date.dateSelector}
                            onChange={e =>
                              handleDraftChange({
                                date: { ...draft.date, dateSelector: e.target.value },
                              })
                            }
                            placeholder="日付要素のセレクタ"
                            style={{ flex: 1 }}
                          />
                          <Button
                            icon={<AimOutlined />}
                            onClick={() => handleStartPicker('date')}
                          >
                            選択
                          </Button>
                        </Space.Compact>
                      </Form.Item>

                      {draft.date.sourceType === 'attr' && (
                        <Form.Item label="日付属性名">
                          <Input
                            value={draft.date.dateAttr}
                            onChange={e =>
                              handleDraftChange({
                                date: { ...draft.date, dateAttr: e.target.value },
                              })
                            }
                            placeholder="data-date"
                          />
                        </Form.Item>
                      )}

                      {draft.date.sourceType === 'dayNumber' && (
                        <>
                          <Form.Item label="年月ヘッダセレクタ">
                            <Space.Compact style={{ width: '100%' }}>
                              <Input
                                value={draft.date.headerSelector}
                                onChange={e =>
                                  handleDraftChange({
                                    date: { ...draft.date, headerSelector: e.target.value },
                                  })
                                }
                                placeholder="年月ヘッダのセレクタ"
                                style={{ flex: 1 }}
                              />
                              <Button
                                icon={<AimOutlined />}
                                onClick={() => handleStartPicker('header')}
                              >
                                選択
                              </Button>
                            </Space.Compact>
                          </Form.Item>

                          <Form.Item label="年月フォーマット">
                            <Select
                              value={draft.date.headerFormat}
                              onChange={value =>
                                handleDraftChange({
                                  date: { ...draft.date, headerFormat: value },
                                })
                              }
                              options={[
                                { value: 'jp_ym', label: '2026年1月' },
                                { value: 'ym_slash', label: '2026/1' },
                                { value: 'en_month_ym', label: 'January 2026' },
                              ]}
                            />
                          </Form.Item>
                        </>
                      )}

                      <Form.Item label="グレー強度">
                        <Select
                          value={draft.date.grayPreset}
                          onChange={value =>
                            handleDraftChange({ date: { ...draft.date, grayPreset: value } })
                          }
                          options={[
                            { value: 'weak', label: '弱' },
                            { value: 'medium', label: '中' },
                            { value: 'strong', label: '強' },
                          ]}
                        />
                      </Form.Item>
                    </>
                  )}
                </Form>
              ),
            },
            {
              key: 'paint',
              label: '表現',
              children: (
                <Form layout="vertical" size="small">
                  <Form.Item label="表現タイプ">
                    <Select
                      value={draft.paint.type}
                      onChange={value =>
                        handleDraftChange({ paint: { ...draft.paint, type: value } })
                      }
                      options={[
                        { value: 'highlight', label: '塗り（highlight）' },
                        { value: 'text', label: '文字（text）' },
                        { value: 'collapse', label: '非表示（詰める）' },
                      ]}
                    />
                  </Form.Item>

                  {draft.paint.type === 'highlight' && (
                    <Form.Item label="背景色">
                      <ColorPicker
                        value={draft.paint.bg}
                        onChange={(_, hex) =>
                          handleDraftChange({ paint: { ...draft.paint, bg: hex } })
                        }
                        showText
                      />
                    </Form.Item>
                  )}

                  {draft.paint.type === 'text' && (
                    <Form.Item label="文字色">
                      <ColorPicker
                        value={draft.paint.fg}
                        onChange={(_, hex) =>
                          handleDraftChange({ paint: { ...draft.paint, fg: hex } })
                        }
                        showText
                      />
                    </Form.Item>
                  )}
                </Form>
              ),
            },
          ]}
        />

        <Divider style={{ margin: '8px 0' }} />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button type="primary" onClick={handleSave} loading={saveStatus === 'saving'}>
            保存して有効化
          </Button>
          <Space size={4}>
            <Tooltip title="エクスポート">
              <Button icon={<DownloadOutlined />} size="small" onClick={handleExport} />
            </Tooltip>
            <Tooltip title="インポート">
              <Button
                icon={<UploadOutlined />}
                size="small"
                onClick={() => fileInputRef.current?.click()}
              />
            </Tooltip>
            <Select
              size="small"
              value={importMode}
              onChange={setImportMode}
              options={[
                { value: 'merge', label: 'マージ' },
                { value: 'replace', label: '置換' },
              ]}
              style={{ width: 80 }}
            />
          </Space>
        </Space>

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

        <Divider style={{ margin: '8px 0' }} />

        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 12 }}>
            このページのルール一覧
          </Text>
        </div>

        {rules.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 11 }}>
            ルールはまだありません。
          </Text>
        ) : (
          <List
            size="small"
            dataSource={rules}
            renderItem={rule => (
              <List.Item
                style={{ padding: '4px 0' }}
                actions={[
                  <Checkbox
                    key="toggle"
                    checked={rule.enabled}
                    onChange={e => adapter.toggleRule(rule.id, e.target.checked)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => adapter.editRule(rule.id)}
                  />,
                  <Button
                    key="delete"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => adapter.deleteRule(rule.id)}
                  />,
                ]}
              >
                <Text style={{ fontSize: 11 }}>
                  {rule.meta?.title || rule.targetSelector || '無題'}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </ConfigProvider>
  );
}
