import assert from "node:assert/strict";
import {
  applyPowerLoraValues, extractCombinerValues, extractLibraryValues,
  extractPowerLoraValues, findLibraryCombinerConnections, findSingleNode,
  parseWorkflowMetadata, restoreLibraryCombinerConnections, setWidgetValues,
} from "../web/restore_core.mjs";

const libraryState = JSON.stringify({ selected_ids: ["a"], snapshot: [{ id: "a", prompt: "alice" }] });
const workflow = parseWorkflowMetadata({ workflow: JSON.stringify({ nodes: [
  { id: 10, type: "OPTPromptLibrarySelector", widgets_values: [libraryState, "newline", true, false] },
  { id: 20, type: "PromptCombiner", inputs: [{ name: "quality_external", link: 7 }], properties: { prompt_combiner: { restore: {
    schema_version: 1,
    categories: { quality: { text: "masterpiece", enabled: true } },
    settings: { section_separator: "Comma", trim_spaces: true },
  } } } },
], links: [[7, 10, 0, 20, 0, "STRING"]] }) });

assert.equal(findSingleNode(workflow, "OPTPromptLibrarySelector", "library").type, "OPTPromptLibrarySelector");
assert.deepEqual(extractLibraryValues(workflow.nodes[0]), {
  selection_json: libraryState, separator: "newline", simple_combine: true, anima_character_clauses: false,
});
assert.equal(extractCombinerValues(workflow.nodes[1]).quality_text, "masterpiece");
const widget = { name: "quality_text", value: "", callback(value) { this.called = value; } };
assert.equal(setWidgetValues({ widgets: [widget] }, { quality_text: "best quality" }), 1);
assert.equal(widget.value, "best quality");
assert.equal(widget.called, "best quality");
const connections = findLibraryCombinerConnections(workflow, workflow.nodes[0], workflow.nodes[1]);
assert.deepEqual(connections, [{ originSlot: 0, inputName: "quality_external" }]);
const targetLibrary = { connect(slot, target, targetSlot) { this.connection = [slot, target, targetSlot]; } };
const targetCombiner = { inputs: [{ name: "quality_external", link: 99 }], disconnectInput(slot) { this.disconnected = slot; } };
assert.equal(restoreLibraryCombinerConnections(targetLibrary, targetCombiner, connections), 1);
assert.equal(targetCombiner.disconnected, 0);
assert.deepEqual(targetLibrary.connection.slice(0, 2), [0, targetCombiner]);
const loraSource = {
  widgets_values: ['[{"name":"style.safetensors","enabled":true,"strength_model":0.8,"strength_clip":0.7}]'],
  properties: { "Show Strengths": "Separate Model & Clip", Match: "style" }, mode: 2,
};
const loraValues = extractPowerLoraValues(loraSource);
const loraTarget = {
  properties: {}, powerLora: { state: { value: "[]" }, rebuild(preserve) { this.preserve = preserve; } },
  graph: { beforeChange() { this.before = true; }, afterChange() { this.after = true; } },
};
applyPowerLoraValues(loraTarget, loraValues);
assert.equal(loraTarget.powerLora.state.value, loraSource.widgets_values[0]);
assert.equal(loraTarget.properties.Match, "style");
assert.equal(loraTarget.powerLora.preserve, true);
assert.equal(loraTarget.mode, 2);
assert.throws(() => findSingleNode({ nodes: [] }, "PromptCombiner", "combiner"), /ありません/);
console.log("restore_core tests passed");
