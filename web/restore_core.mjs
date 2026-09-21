export const LIBRARY_TYPE = "OPTPromptLibrarySelector";
export const COMBINER_TYPE = "PromptCombiner";
export const POWER_LORA_TYPE = "PowerLoraLoaderStandalone";
export const KSAMPLER_TYPE = "KSampler";

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

export function findNodes(workflow, type) {
  return (workflow?.nodes ?? []).filter((node) => node?.type === type || node?.class_type === type);
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

function normalizeLink(link) {
  if (Array.isArray(link)) {
    return { id: link[0], originId: link[1], originSlot: link[2], targetId: link[3], targetSlot: link[4] };
  }
  return {
    id: link?.id,
    originId: link?.origin_id ?? link?.originId,
    originSlot: link?.origin_slot ?? link?.originSlot,
    targetId: link?.target_id ?? link?.targetId,
    targetSlot: link?.target_slot ?? link?.targetSlot,
  };
}

export function findLibraryCombinerConnections(workflow, sourceLibrary, sourceCombiner) {
  const links = Array.isArray(workflow?.links) ? workflow.links.map(normalizeLink) : [];
  const libraryId = String(sourceLibrary?.id);
  const combinerId = String(sourceCombiner?.id);
  return links
    .filter((link) => String(link.originId) === libraryId && String(link.targetId) === combinerId)
    .map((link) => ({
      originSlot: Number(link.originSlot),
      inputName: sourceCombiner?.inputs?.[Number(link.targetSlot)]?.name,
    }))
    .filter((connection) => Number.isInteger(connection.originSlot) && connection.inputName);
}

export function restoreLibraryCombinerConnections(targetLibrary, targetCombiner, connections) {
  let count = 0;
  for (const connection of connections) {
    const targetSlot = (targetCombiner?.inputs ?? []).findIndex((input) => input.name === connection.inputName);
    if (targetSlot < 0) continue;
    const input = targetCombiner.inputs[targetSlot];
    if (input?.link != null) targetCombiner.disconnectInput?.(targetSlot);
    targetLibrary.connect?.(connection.originSlot, targetCombiner, targetSlot);
    count += 1;
  }
  targetCombiner.graph?.setDirtyCanvas?.(true, true);
  return count;
}

export function extractPowerLoraValues(source) {
  const raw = source?.widgets_values?.[0];
  if (typeof raw !== "string") {
    throw new Error("Power Lora Loader (Standalone)の保存値を読み取れませんでした。");
  }
  try {
    if (!Array.isArray(JSON.parse(raw))) throw new Error("invalid rows");
  } catch (_error) {
    throw new Error("Power Lora Loader (Standalone)のLoRA設定が壊れています。");
  }
  return {
    loras: raw,
    properties: source?.properties && typeof source.properties === "object"
      ? JSON.parse(JSON.stringify(source.properties))
      : {},
    mode: source?.mode,
  };
}

export function applyPowerLoraValues(target, values) {
  if (!target?.powerLora?.state || typeof target.powerLora.rebuild !== "function") {
    throw new Error("復元先のPower Lora Loader (Standalone)を初期化できていません。");
  }
  let currentRows;
  let sourceRows;
  try {
    currentRows = JSON.parse(target.powerLora.state.value || "[]");
    sourceRows = JSON.parse(values.loras);
    if (!Array.isArray(currentRows) || !Array.isArray(sourceRows)) throw new Error("invalid rows");
  } catch (_error) {
    throw new Error("Power Lora Loader (Standalone)のLoRA設定をマージできませんでした。");
  }
  const mergedRows = currentRows.map((row) => ({ ...row, enabled: false }));
  const indexesByName = new Map();
  mergedRows.forEach((row, index) => {
    if (typeof row?.name === "string" && !indexesByName.has(row.name)) indexesByName.set(row.name, index);
  });
  let restored = 0;
  let added = 0;
  let disabled = mergedRows.length;
  const activatedExisting = new Set();
  for (const row of sourceRows) {
    if (row?.enabled !== true || typeof row?.name !== "string" || !row.name) continue;
    const index = indexesByName.get(row.name);
    if (index === undefined) {
      indexesByName.set(row.name, mergedRows.length);
      mergedRows.push({ ...row });
      added += 1;
    } else {
      mergedRows[index] = { ...mergedRows[index], ...row };
      if (!activatedExisting.has(index)) {
        activatedExisting.add(index);
        disabled -= 1;
      }
    }
    restored += 1;
  }
  target.graph?.beforeChange?.();
  target.properties = { ...(target.properties ?? {}), ...(values.properties ?? {}) };
  target.powerLora.state.value = JSON.stringify(mergedRows);
  target.powerLora.rebuild(true);
  if (values.mode !== undefined) target.mode = values.mode;
  target.graph?.afterChange?.();
  target.setDirtyCanvas?.(true, true);
  return { restored, added, disabled, total: mergedRows.length };
}

export function extractKSamplerSeed(source) {
  const seed = source?.widgets_values?.[0];
  if (typeof seed !== "number" || !Number.isFinite(seed) || seed < 0 || !Number.isInteger(seed)) {
    throw new Error("KSamplerのseed値を読み取れませんでした。");
  }
  return seed;
}

export function applyKSamplerSeed(target, seed) {
  const seedWidget = (target?.widgets ?? []).find((widget) => widget.name === "seed");
  if (!seedWidget) throw new Error("復元先KSamplerのseed入力が見つかりません。");
  seedWidget.value = seed;
  seedWidget.callback?.(seed);
  const control = (target.widgets ?? []).find((widget) => widget.name === "control_after_generate");
  if (control) {
    control.value = "fixed";
    control.callback?.("fixed");
  }
  target.graph?.setDirtyCanvas?.(true, true);
}

export function matchKSamplers(sourceNodes, targetNodes) {
  if (!sourceNodes.length) throw new Error("画像のワークフローにKSamplerがありません。");
  if (!targetNodes.length) throw new Error("現在のワークフローにKSamplerがありません。先に追加してください。");
  const targetsById = new Map(targetNodes.map((node) => [String(node.id), node]));
  const matches = sourceNodes
    .map((source) => ({ source, target: targetsById.get(String(source.id)) }))
    .filter((pair) => pair.target);
  if (matches.length) return matches;
  if (sourceNodes.length === 1 && targetNodes.length === 1) {
    return [{ source: sourceNodes[0], target: targetNodes[0] }];
  }
  throw new Error("複数のKSamplerをノードIDで対応付けできないため復元を中断しました。");
}
