# CareVoice GAS

## Script Properties

- `OPENAI_API_KEY`: OpenAI APIキー
- `SPREADSHEET_ID`: 保存先スプレッドシートID

## 必要なシート

- `StaffMaster`
- `UserMaster`
- `看護介護記録` または `Records`

## 通信方式

GitHub Pagesからの呼び出しでは、CORSプリフライトを避けるため`Content-Type: text/plain;charset=utf-8`でJSON文字列を送信します。GAS側では`e.postData.contents`を`JSON.parse`します。
