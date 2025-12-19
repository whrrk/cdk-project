// api/db.js

/**
 * アクセスDynamoDB用モジュール
 * DynamoDBクライアントの初期化とエクスポート
 */
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

// --- 환경 분기 -------------------------------------------------------
// IS_LOCAL=true ＝＞DynamoDB Local
const isLocal = process.env.IS_LOCAL === "true";

let client;

if (isLocal) {
  const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;

  // DynamoDB Local 접속 (Docker에서 8000 포트)
  // console.log("DynamoDB Local → http://localhost:8000");

  client = new DynamoDBClient({
    region: "ap-northeast-1",
    endpoint: DYNAMO_ENDPOINT,
  });

} else {
  // AWS DynamoDB 接続 (基本設定, CDKが IAM 権限 提供)
  // console.log("AWS DynamoDB 稼働中");

  client = new DynamoDBClient({});
}


// --- Document Client 생성 --------------------------------------------
const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
  docClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
};
