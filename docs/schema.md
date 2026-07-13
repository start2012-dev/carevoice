# JSONスキーマ

## ProcessAudioResponse

```json
{
  "transcript": "音声全体の文字起こし",
  "records": [
    {
      "userId": "U001 または null",
      "userName": "確定した氏名または聞き取った呼び方",
      "userCandidates": [{ "userId": "U001", "userName": "山田 花子" }],
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
