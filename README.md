# ComfyUI Prompt Settings Restore

ComfyUIのワークフロー付きPNGから、`Prompt Library Selector`、`Prompt Combiner`、`Power Lora Loader (Standalone)`、`KSampler`の設定を現在のワークフローへまとめて復元するカスタムノードです。

## 必要なカスタムノード

- [ComfyUI Prompt Library](https://github.com/Ayase-L/ComfyUI-Prompt-Library)
- [ComfyUI Prompt Combiner](https://github.com/Ayase-L/ComfyUI-Prompt-Combiner)
- [ComfyUI Power Lora Loader Standalone](https://github.com/Ayase-L/ComfyUI-Power-Lora-Loader-Standalone)

## 使い方

1. `Prompt Tools` → `Prompt Settings Restore`を追加します。
2. 現在のワークフローに、復元先の`Prompt Library Selector`、`Prompt Combiner`、`Power Lora Loader (Standalone)`、`KSampler`を1個ずつ配置します。
3. `PNGを選択して復元`を押し、ComfyUIワークフローを含むPNGを選択します。
4. 各ノードの設定がPNG保存時点の内容へ置き換わります。

Power Lora Loaderでは、画像側でONになっているLoRAだけを設定値の復元・追加対象にします。現在のノードに同名LoRAがあればModel/CLIP強度や出力トリガーワードなどを更新し、なければ末尾へ追加します。画像側でOFFのLoRAと、画像側に存在しない現在のLoRAは、一覧から削除せずOFFにします。画像側でOFFかつ現在側に存在しないLoRAは追加しません。表示モード・Match・接続レイアウトも復元します。

KSamplerでは画像に保存されたseed値を復元し、次回実行時に値が変わらないよう`control_after_generate`を`fixed`へ設定します。複数のKSamplerがある場合は、画像側と現在側でノードIDが一致するKSamplerをそれぞれ復元します。

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
