
const zlib = require("zlib");
const { WAFV2Client, GetIPSetCommand, UpdateIPSetCommand } = require("@aws-sdk/client-wafv2");

const client = new WAFV2Client({});
const IPSET_ID = process.env.IPSET_ID;
const IPSET_NAME = process.env.IPSET_NAME;
const IPSET_SCOPE = process.env.IPSET_SCOPE; // REGIONAL or CLOUDFRONT

function extractIpsFromWafLogs(payload) {
    const ips = new Set();

    // payload.logEvents[].message は文字列。WAFログはJSON文字列になってることが多い
    for (const e of payload.logEvents || []) {
        const msg = e.message;
        try {
            const wafLog = JSON.parse(msg);
            const ip = wafLog?.httpRequest?.clientIp;
            if (ip) ips.add(`${ip}/32`);
        } catch {
            // messageがJSONじゃない場合は無視
        }
    }
    return [...ips];
}

// 超雑な例：WAFログから source IP を抜いて IPSet に追加
// 実運用は「しきい値」「重複排除」「期限切れ解除（TTL）」を入れてね
exports.handler = async (event) => {
    const payload = Buffer.from(event.awslogs.data, "base64");
    const decompressed = zlib.gunzipSync(payload).toString("utf8");
    const data = JSON.parse(decompressed);

    // CloudWatch Logs subscriptionは gzip/base64 なので実運用は decode が必要。
    // ここでは “実装骨格” だけ示す。
    const suspiciousIps = new Set();
    console.log("extracted ips:", suspiciousIps);

    for (const le of data.logEvents || []) {
        try {
            const msg = JSON.parse(le.message);
            const ip = msg?.httpRequest?.clientIp;
            if (ip) suspiciousIps.add(`${ip}/32`);
        } catch (_) { }
    }

    if (suspiciousIps.length === 0) return { ok: true, added: 0 };

    const current = await client.send(new GetIPSetCommand({
        Name: IPSET_NAME, Id: IPSET_ID, Scope: IPSET_SCOPE
    }));

    const addresses = new Set(current.IPSet.Addresses);

    for (const ip of suspiciousIps) addresses.add(ip);

    await client.send(new UpdateIPSetCommand({
        Name: IPSET_NAME,
        Id: IPSET_ID,
        Scope: IPSET_SCOPE,
        LockToken: current.LockToken,
        Addresses: Array.from(addresses),
    }));

    return { ok: true, added: suspiciousIps.length };
};