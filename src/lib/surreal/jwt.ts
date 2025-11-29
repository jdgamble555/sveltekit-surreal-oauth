export interface JwtPayload {
	iss?: string;
	sub?: string;
	aud?: string | string[];
	exp?: number;
	nbf?: number;
	iat?: number;
	jti?: string;
	[key: string]: unknown;
}

export function decodeJwt(token: string) {
	try {
		const [, payloadB64] = token.split('.');
		return JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as JwtPayload;
	} catch {
		return {};
	}
}

export function isExpired(token: string) {
	const payload = decodeJwt(token);
	if (!payload.exp) {
		return true;
	}
	const now = Math.floor(Date.now() / 1000);
	return payload.exp < now;
}

export function getId(token: string) {
	const payload = decodeJwt(token);
	return payload.ID as string | undefined;
}
