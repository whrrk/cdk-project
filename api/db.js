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
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
  docClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  GetCommand,
};
