# ComfyUI Prompt Settings Restore

ComfyUIのワークフロー付きPNGから、`Prompt Library Selector`と`Prompt Combiner`の設定を現在のワークフローへまとめて復元するカスタムノードです。

## 必要なカスタムノード

- [ComfyUI Prompt Library](https://github.com/Ayase-L/ComfyUI-Prompt-Library)
- [ComfyUI Prompt Combiner](https://github.com/Ayase-L/ComfyUI-Prompt-Combiner)

## 使い方

1. `Prompt Tools` → `Prompt Settings Restore`を追加します。
2. 現在のワークフローに、復元先の`Prompt Library Selector`と`Prompt Combiner`を1個ずつ配置します。
3. `PNGを選択して復元`を押し、ComfyUIワークフローを含むPNGを選択します。
4. 両ノードの設定がPNG保存時点の内容へ置き換わります。

誤ったノードへ反映しないよう、画像内または現在のワークフローに対象ノードが複数ある場合は復元を中断します。外部リンクや外部入力値は復元しません。

## 開発時の確認

```powershell
node tests/test_restore_core.mjs
python -m py_compile __init__.py nodes.py
```

ComfyUI上での動作確認は、ComfyUIを再起動してブラウザを`Ctrl+F5`で更新した後に行ってください。

## License

MIT
