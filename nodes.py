class PromptSettingsRestore:
    """Frontend-only utility for restoring prompt-node settings from a PNG."""

    RETURN_TYPES = ()
    FUNCTION = "restore"
    CATEGORY = "Prompt Tools"
    DESCRIPTION = "Restore Prompt Library Selector and Prompt Combiner settings from a ComfyUI PNG."
    OUTPUT_NODE = True

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    def restore(self):
        return ()


NODE_CLASS_MAPPINGS = {"PromptSettingsRestore": PromptSettingsRestore}
NODE_DISPLAY_NAME_MAPPINGS = {"PromptSettingsRestore": "Prompt Settings Restore"}
