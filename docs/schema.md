# JSONスキーマ

## ProcessAudioResponse

```json
{
  "transcript": "音声全体の文字起こし",
  "records": [
    {
      "userId": "U001 または null",
      "userName": "確定した氏名または聞き取った呼び方",
      "userCandidates": [{ "userId": "U001", "userName": "利用者A" }],
      "bloodPressureSystolic": 120,
      "bloodPressureDiastolic": 70,
      "pulse": 72,
      "categories": ["食事"],
      "careRecord": "施設の文体に整えた記録",
      "needsReview": false,
      "reviewReasons": []
    }
  ]
}
```

## 検証ルール

- `records`は配列であること。
- `userId`はGAS側の有効な利用者マスタに存在する場合のみ確定扱いにすること。
- 利用者未確定、本文空、血圧片方のみの場合は`needsReview: true`にすること。
- 血圧、脈拍は範囲チェックを行い、不正な数値は`null`にすること。
- 記録本文は最大1000文字に制限すること。
