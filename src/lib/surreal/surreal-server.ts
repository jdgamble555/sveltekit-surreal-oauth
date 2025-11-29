import { decodeJwt } from './jwt';
import {
	surrealChangePassword,
	surrealConnect,
	surrealLogin,
	surrealRegister
} from './surreal-auth';
import type { CookieOptions, GetCookieFn, SetCoookieFn } from './surreal-types';

// 30 minutes
const TOKEN_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: 'strict',
	path: '/',
	maxAge: 60 * 30
} as CookieOptions;

export function surrealServer({
	cookies: { cookieName, setCookie, getCookie },
	credentials: { url, namespace, database }
}: {
	cookies: {
		cookieName?: string;
		setCookie: SetCoookieFn;
		getCookie: GetCookieFn;
	};
	credentials: {
		url: string;
		namespace: string;
		database: string;
	};
}) {
	const tokenName = cookieName || 'surreal_token';

	const surrealToken = getCookie(tokenName);

	async function connect() {
		const { data: db, error: connectError } = await surrealConnect({
			namespace,
			database,
			url
		});

		if (connectError) {
			return {
				data: null,
				error: connectError
			};
		}

		if (surrealToken) {
			await db.authenticate(surrealToken);

			return {
				data: db,
				error: null
			};
		}

		// No token, ensure logged out

		logout();

		return {
			data: db,
			error: null
		};
	}

	async function login(username: string, password: string) {
		logout();

		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return {
				db: null,
				error: dbError
			};
		}

		const { data: token, error: loginError } = await surrealLogin({
			db,
			namespace,
			database,
			username,
			password
		});

		if (loginError) {
			return {
				db: null,
				error: loginError
			};
		}

		setCookie(tokenName, token, TOKEN_COOKIE_OPTIONS);

		return {
			db,
			error: null
		};
	}

	async function register(username: string, password: string) {
		logout();

		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return {
				db: null,
				error: dbError
			};
		}

		const { data: token, error: registerError } = await surrealRegister({
			db,
			namespace,
			database,
			username,
			password
		});

		if (registerError) {
			return {
				db: null,
				error: registerError
			};
		}

		setCookie(tokenName, token, TOKEN_COOKIE_OPTIONS);

		return {
			db,
			error: null
		};
	}

	async function changePassword(oldPassword: string, newPassword: string) {
		const userId = getUser();

		if (!userId) {
			return {
				data: null,
				error: new Error('Not authenticated')
			};
		}

		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return {
				data: null,
				error: dbError
			};
		}

		const { data, error: changeError } = await surrealChangePassword({
			db,
			currentPassword: oldPassword,
			newPassword,
			userId
		});

		if (changeError) {
			return {
				data: null,
				error: changeError
			};
		}

		return {
			data,
			error: null
		};
	}

	function logout() {
		const token = getCookie(tokenName);

		if (token) {
			// delete cookie equivalent
			setCookie(tokenName, '', {
				...TOKEN_COOKIE_OPTIONS,
				maxAge: 0
			});
		}
	}

	function getUser() {
		const token = getCookie(tokenName);

		if (!token) {
			return null;
		}

		return decodeJwt(token).ID as string;
	}

	async function getUserInfo() {
		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return null;
		}

		const info = await db.info();

		if (!info?.id) {
			return null;
		}

		return info.id.toString();
	}

	return {
		connect,
		login,
		register,
		logout,
		getUser,
		getUserInfo,
		changePassword
	};
}
