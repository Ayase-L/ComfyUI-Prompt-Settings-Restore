export const LIBRARY_TYPE = "OPTPromptLibrarySelector";
export const COMBINER_TYPE = "PromptCombiner";

export const COMBINER_WIDGET_NAMES = [
  "quality_text", "quality_enabled", "character_text", "character_enabled",
  "body_text", "body_enabled", "outfit_text", "outfit_enabled",
  "expression_text", "expression_enabled", "pose_text", "pose_enabled",
  "composition_text", "composition_enabled", "camera_text", "camera_enabled",
  "background_text", "background_enabled", "lighting_text", "lighting_enabled",
  "other_text", "other_enabled", "section_separator", "custom_separator",
  "normalize_commas", "trim_spaces", "add_trailing_comma",
  "trigger_word_text", "trigger_word_enabled",
];

export function parseWorkflowMetadata(metadata) {
  const raw = metadata?.workflow;
  if (!raw) throw new Error("この画像にはComfyUIのワークフローがありません。");
  try {
    const workflow = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!workflow || !Array.isArray(workflow.nodes)) throw new Error("invalid workflow");
    return workflow;
  } catch (_error) {
    throw new Error("画像内のワークフローを読み取れませんでした。");
  }
}
export function findSingleNode(workflow, type, displayName) {
  const matches = workflow.nodes.filter((node) => node?.type === type || node?.class_type === type);
  if (!matches.length) throw new Error(`画像のワークフローに${displayName}がありません。`);
  if (matches.length > 1) throw new Error(`画像に複数の${displayName}があるため復元できません。`);
  return matches[0];
}

export function extractLibraryValues(source) {
  const values = source?.widgets_values;
  if (!Array.isArray(values) || typeof values[0] !== "string") {
    throw new Error("Prompt Library Selectorの保存値を読み取れませんでした。");
  }
  try {
    const state = JSON.parse(values[0]);
    if (!state || !Array.isArray(state.selected_ids) || !Array.isArray(state.snapshot)) {
      throw new Error("invalid state");
    }
  } catch (_error) {
    throw new Error("Prompt Library Selectorの選択内容が壊れています。");
  }
  return {
    selection_json: values[0],
    separator: values[1] ?? "comma + newline",
    simple_combine: values[2] === true,
    anima_character_clauses: values[3] === true,
  };
}

export function extractCombinerValues(source) {
  const saved = source?.properties?.prompt_combiner?.restore;
  if (saved?.schema_version === 1 && saved.categories && saved.settings) {
    const result = {};
    for (const [key, value] of Object.entries(saved.categories)) {
      result[`${key}_text`] = String(value?.text ?? "");
      result[`${key}_enabled`] = value?.enabled !== false;
    }
    Object.assign(result, saved.settings);
    return result;
  }
  if (!Array.isArray(source?.widgets_values)) {
    throw new Error("Prompt Combinerの保存値を読み取れませんでした。");
  }
  return Object.fromEntries(COMBINER_WIDGET_NAMES.map((name, index) => [name, source.widgets_values[index]]));
}

export function setWidgetValues(target, values) {
  const widgets = new Map((target?.widgets ?? []).map((widget) => [widget.name, widget]));
  let count = 0;
  for (const [name, value] of Object.entries(values)) {
    const widget = widgets.get(name);
    if (!widget || value === undefined) continue;
    widget.value = value;
    widget.callback?.(value);
    count += 1;
  }
  target.graph?.setDirtyCanvas?.(true, true);
  return count;
}
