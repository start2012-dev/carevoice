# API仕様

GASの`doPost(e)`でJSONを受け取り、`action`で処理を分岐します。

## getMasters

職員マスタと利用者マスタを取得します。

## processAudio

音声データを受け取り、OpenAI APIで文字起こしした後、利用者マスタと照合しながら複数利用者の記録を`records`配列で返します。

## saveRecords

確認済みの複数記録をGoogleスプレッドシートに保存します。`userId`が未確定の記録は保存できません。
