
const { WAFV2Client, GetIPSetCommand, UpdateIPSetCommand } = require("@aws-sdk/client-wafv2");

const client = new WAFV2Client({});
const IPSET_ID = process.env.IPSET_ID;
const IPSET_NAME = process.env.IPSET_NAME;
const IPSET_SCOPE = process.env.IPSET_SCOPE; // REGIONAL or CLOUDFRONT

// 超雑な例：WAFログから source IP を抜いて IPSet に追加
// 実運用は「しきい値」「重複排除」「期限切れ解除（TTL）」を入れてね
exports.handler = async (event) => {
    const records = event.awslogs ? [event] : (event.records || []);
    // CloudWatch Logs subscriptionは gzip/base64 なので実運用は decode が必要。
    // ここでは “実装骨格” だけ示す。
    console.log("event keys:", Object.keys(event));

    // TODO: decodeして logs を配列化 → httpRequest.clientIp を抽出
    const suspiciousIps = []; // ["1.2.3.4/32", ...]

    if (suspiciousIps.length === 0) return { ok: true, added: 0 };

    const current = await client.send(new GetIPSetCommand({
        Name: IPSET_NAME, Id: IPSET_ID, Scope: IPSET_SCOPE
    }));

    const addresses = new Set(current.IPSet.Addresses);
    suspiciousIps.forEach(ip => addresses.add(ip));

    await client.send(new UpdateIPSetCommand({
        Name: IPSET_NAME,
        Id: IPSET_ID,
        Scope: IPSET_SCOPE,
        LockToken: current.LockToken,
        Addresses: Array.from(addresses),
    }));

    return { ok: true, added: suspiciousIps.length };
};