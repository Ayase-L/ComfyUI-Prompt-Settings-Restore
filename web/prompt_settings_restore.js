import { app } from "/scripts/app.js";
import { getPngMetadata } from "/scripts/pnginfo.js";
import {
  COMBINER_TYPE, LIBRARY_TYPE, extractCombinerValues, extractLibraryValues,
  findSingleNode, parseWorkflowMetadata, setWidgetValues,
} from "./restore_core.mjs";

const NODE_TYPE = "PromptSettingsRestore";

function element(tag, text = "") {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  return item;
}

function currentNode(type, displayName) {
  const matches = (app.graph?._nodes ?? []).filter((node) => node.type === type);
  if (!matches.length) throw new Error(`現在のワークフローに${displayName}がありません。先に追加してください。`);
  if (matches.length > 1) throw new Error(`現在のワークフローに複数の${displayName}があるため復元できません。`);
  return matches[0];
}

function install(node) {
  if (node.__promptSettingsRestoreInstalled) return;
  node.__promptSettingsRestoreInstalled = true;

  const root = element("div");
  root.style.cssText = "display:grid;gap:8px;padding:8px;box-sizing:border-box;";
  const pick = element("button", "PNGを選択して復元");
  pick.type = "button";
  const status = element("div", "Prompt Library SelectorとPrompt Combinerの設定を復元します。");
  status.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;opacity:.85;";
  const input = element("input");
  input.type = "file";
  input.accept = "image/png,.png";
  input.hidden = true;

  pick.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    pick.disabled = true;
    status.textContent = "画像を解析しています…";
    try {
      const workflow = parseWorkflowMetadata(await getPngMetadata(file));
      const sourceLibrary = findSingleNode(workflow, LIBRARY_TYPE, "Prompt Library Selector");
      const sourceCombiner = findSingleNode(workflow, COMBINER_TYPE, "Prompt Combiner");
      const targetLibrary = currentNode(LIBRARY_TYPE, "Prompt Library Selector");
      const targetCombiner = currentNode(COMBINER_TYPE, "Prompt Combiner");
      const libraryValues = extractLibraryValues(sourceLibrary);
      const combinerValues = extractCombinerValues(sourceCombiner);
      const summary = [
        `Prompt Library Selector: ${setWidgetValues(targetLibrary, libraryValues)}項目`,
        `Prompt Combiner: ${setWidgetValues(targetCombiner, combinerValues)}項目`,
      ];
      targetLibrary.onConfigure?.(targetLibrary.serialize?.() ?? {});
      targetCombiner.onConfigure?.(targetCombiner.serialize?.() ?? {});
      status.textContent = `復元しました。\n${summary.join("\n")}`;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "復元に失敗しました。";
    } finally {
      pick.disabled = false;
    }
  });

  root.append(pick, status, input);
  node.addDOMWidget("prompt_settings_restore_ui", "PROMPT_SETTINGS_RESTORE_UI", root, {
    serialize: false,
    hideOnZoom: false,
  });
  node.setSize([Math.max(node.size?.[0] ?? 0, 360), Math.max(node.size?.[1] ?? 0, 150)]);
}

app.registerExtension({
  name: "prompt-settings-restore.extension",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== NODE_TYPE) return;
    const original = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = original?.apply(this, arguments);
      install(this);
      return result;
    };
  },
});
