import crypto from "crypto";

function base64UrlEncode(input) {
    return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeJson(value) {
    return base64UrlEncode(JSON.stringify(value));
}

function base64UrlDecode(input) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf8");
}

export function signJwt(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds,
    };

    const encodedHeader = base64UrlEncodeJson(header);
    const encodedPayload = base64UrlEncodeJson(fullPayload);
    const signature = crypto
        .createHmac("sha256", secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token, secret) {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split(".");

        if (!encodedHeader || !encodedPayload || !signature) {
            return null;
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest("base64")
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        const expectedBuffer = Buffer.from(expectedSignature);
        const signatureBuffer = Buffer.from(signature);

        if (
            expectedBuffer.length !== signatureBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
        ) {
            return null;
        }

        const header = JSON.parse(base64UrlDecode(encodedHeader));
        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        const now = Math.floor(Date.now() / 1000);

        if (header.alg !== "HS256" || header.typ !== "JWT") {
            return null;
        }

        if (typeof payload.exp === "number" && payload.exp <= now) {
            return null;
        }

        if (typeof payload.nbf === "number" && payload.nbf > now) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}