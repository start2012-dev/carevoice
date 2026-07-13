# CareVoice アーキテクチャ

```txt
スマートフォン
  ↓ 録音
GitHub Pages / Vite + TypeScript + CSS
  ↓ processAudio
Google Apps Script
  ↓ 音声文字起こし
OpenAI API
  ↓ transcript
Google Apps Script
  ↓ 介護記録JSON生成
OpenAI API
  ↓ records配列
スマートフォン確認画面
  ↓ saveRecords
Google Apps Script
  ↓ 1利用者1行
Googleスプレッドシート
```

OpenAI APIキーとスプレッドシートIDはブラウザに置かず、Google Apps ScriptのScript Propertiesで管理します。
