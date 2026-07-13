# API仕様

GASの`doPost(e)`でJSON文字列を受け取り、`action`で処理を分岐します。

## GitHub PagesからGASを呼ぶ通信方式

GitHub Pagesなど別オリジンのブラウザからGoogle Apps Script Web Appを呼ぶ場合、`Content-Type: application/json`のPOSTはCORSプリフライト（OPTIONS）を発生させ、GAS Web Appでは失敗しやすい構成になります。

そのためCareVoiceでは、フロントエンドからGASへ送るリクエストを次の方式に統一します。

```txt
method: POST
Content-Type: text/plain;charset=utf-8
body: JSON.stringify(payload)
```

`text/plain`はCORSのsimple requestとして扱われるため、プリフライトを避けられます。GAS側では`e.postData.contents`を`JSON.parse`して処理します。

## getMasters

職員マスタと利用者マスタをGAS側のスプレッドシートから取得します。

## processAudio

音声データを受け取り、OpenAI APIで文字起こしした後、GAS側で取得した利用者マスタと照合しながら複数利用者の記録を`records`配列で返します。ブラウザから渡された利用者マスタ情報は正式な情報として信用しません。

## saveRecords

確認済みの複数記録をGoogleスプレッドシートに保存します。ブラウザから送られた利用者名・職員名は保存に使わず、`userId`と`staffId`を使ってGAS側のマスタから正式名称を再取得します。未登録または無効なIDは保存できません。
