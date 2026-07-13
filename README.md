# CareVoice

CareVoiceは、デイサービス職員がスマートフォンで音声入力した内容を、OpenAI APIとGoogle Apps Scriptで介護・看護記録へ整形し、Googleスプレッドシートへ保存するMVPです。

## MVPの流れ

1. アプリ起動時に職員マスタから看護記録者を選択する。
2. スマートフォンで複数利用者の記録を録音する。
3. Google Apps Scriptへ音声を送信する。
4. OpenAI APIで音声文字起こしを行う。
5. GAS側の利用者マスタと照合しながら、利用者ごとの`records`配列を生成する。
6. 確認画面で各カードを修正し、保存対象を選ぶ。
7. 確定した記録を1利用者1行でGoogleスプレッドシートへ保存する。

## セットアップ

```bash
npm install
npm run dev
```

`src/config.ts`の`GAS_WEB_APP_URL`に、デプロイ済みGoogle Apps Script Web AppのURLを設定してください。

## GitHub PagesからGASを呼ぶ通信方式

GitHub PagesからGoogle Apps Script Web Appへ`application/json`でPOSTすると、CORSプリフライトが発生して失敗しやすくなります。

CareVoiceではGASで実際に利用しやすい方式として、JSON文字列を`text/plain;charset=utf-8`でPOSTします。

```txt
method: POST
Content-Type: text/plain;charset=utf-8
body: JSON.stringify(payload)
```

GAS側では`e.postData.contents`を`JSON.parse`します。

## ビルド

```bash
npm run build
```

## GAS Script Properties

Google Apps Script側で以下を設定します。

- `OPENAI_API_KEY`
- `SPREADSHEET_ID`

これらの値はブラウザ側やリポジトリには保存しません。
