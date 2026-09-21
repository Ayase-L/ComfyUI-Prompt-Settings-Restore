# ComfyUI Prompt Settings Restore

ComfyUIのワークフロー付きPNGから、`Prompt Library Selector`、`Prompt Combiner`、`Power Lora Loader (Standalone)`の設定を現在のワークフローへまとめて復元するカスタムノードです。

## 必要なカスタムノード

- [ComfyUI Prompt Library](https://github.com/Ayase-L/ComfyUI-Prompt-Library)
- [ComfyUI Prompt Combiner](https://github.com/Ayase-L/ComfyUI-Prompt-Combiner)
- [ComfyUI Power Lora Loader Standalone](https://github.com/Ayase-L/ComfyUI-Power-Lora-Loader-Standalone)

## 使い方

1. `Prompt Tools` → `Prompt Settings Restore`を追加します。
2. 現在のワークフローに、復元先の`Prompt Library Selector`、`Prompt Combiner`、`Power Lora Loader (Standalone)`を1個ずつ配置します。
3. `PNGを選択して復元`を押し、ComfyUIワークフローを含むPNGを選択します。
4. 3ノードの設定がPNG保存時点の内容へ置き換わります。

Power Lora Loaderでは、LoRAの一覧・順序・有効状態・Model/CLIP強度・出力トリガーワード・表示モード・Match・接続レイアウトを復元します。

Prompt Library SelectorからPrompt Combinerへの直接接続も、接続先の入力名に基づいて復元します。Reroute、サブグラフ、その他の外部ノードからの接続は復元対象外です。

誤ったノードへ反映しないよう、画像内または現在のワークフローに対象ノードが複数ある場合は復元を中断します。

## 開発時の確認

```powershell
node tests/test_restore_core.mjs
python -m py_compile __init__.py nodes.py
```

ComfyUI上での動作確認は、ComfyUIを再起動してブラウザを`Ctrl+F5`で更新した後に行ってください。

## License

MIT
