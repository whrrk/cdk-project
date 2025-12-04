目的

認証（Cognito）

講師/受講者の分岐（UserType）

メッセージのスレッド化

単一テーブル（DynamoDB）構造
を １日で決め切る。

1. Cognitoの構造を決める

User Pool（email + password）

Group または User Attribute で役割を付与
→ custom:role = teacher | student

※ Cognito Groups のほうが管理しやすい。

2. Enrollment（受講登録）の構造

Enrollment は：

PK = COURSE#<courseId>
SK = ENROLL#<userId>
role = teacher | student


講師/生徒はここで分岐できる（Enrollmentに役割を持たせる）。

3. メッセージのスレッド化

メッセージが Thread（親）→ Reply（子） という構造を持つ。

単一テーブルの例：

PK = COURSE#<courseId>

SK = THREAD#<threadId>
     content, userId, createdAt

SK = THREAD#<threadId>#REPLY#<replyId>
     content, userId, parentThreadId

→ Query PK だけで
コースのスレッド＋全返信を時系列で取得できる。

4. API一覧を確定
認証

POST /auth/signup

POST /auth/login（Cognito Hosted UI でもOK）

GET /me（ユーザー情報）

Course

GET /courses

POST /courses（講師のみ）

POST /courses/{id}/enroll（講師 or 生徒）

GET /my/courses

Thread（スレッド）

GET /courses/{id}/threads

POST /courses/{id}/threads

Reply（返信）

POST /courses/{id}/threads/{threadId}/replies

これで「教育 × 掲示板(スレッド) × 認証」がすべて揃う。

5. CDK構造再確認

LambdaStack

ApiStack

DatabaseStack

AuthStack（Cognito）← 新規追加

FrontendStack（S3+CloudFront）

順番としては Auth → DB → Lambda → API → Frontend。