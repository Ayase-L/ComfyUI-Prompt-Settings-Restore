import assert from "node:assert/strict";
import {
  extractCombinerValues, extractLibraryValues, findSingleNode, parseWorkflowMetadata,
  setWidgetValues,
} from "../web/restore_core.mjs";

const libraryState = JSON.stringify({ selected_ids: ["a"], snapshot: [{ id: "a", prompt: "alice" }] });
const workflow = parseWorkflowMetadata({ workflow: JSON.stringify({ nodes: [
  { type: "OPTPromptLibrarySelector", widgets_values: [libraryState, "newline", true, false] },
  { type: "PromptCombiner", properties: { prompt_combiner: { restore: {
    schema_version: 1,
    categories: { quality: { text: "masterpiece", enabled: true } },
    settings: { section_separator: "Comma", trim_spaces: true },
  } } } },
] }) });

assert.equal(findSingleNode(workflow, "OPTPromptLibrarySelector", "library").type, "OPTPromptLibrarySelector");
assert.deepEqual(extractLibraryValues(workflow.nodes[0]), {
  selection_json: libraryState, separator: "newline", simple_combine: true, anima_character_clauses: false,
});
assert.equal(extractCombinerValues(workflow.nodes[1]).quality_text, "masterpiece");
const widget = { name: "quality_text", value: "", callback(value) { this.called = value; } };
assert.equal(setWidgetValues({ widgets: [widget] }, { quality_text: "best quality" }), 1);
assert.equal(widget.value, "best quality");
assert.equal(widget.called, "best quality");
assert.throws(() => findSingleNode({ nodes: [] }, "PromptCombiner", "combiner"), /ありません/);
console.log("restore_core tests passed");
