import { createGitHubOAuthLoginUrl } from '../../routes/login/github-oath';
import { decodeJwt } from './jwt';
import {
	surrealChangePassword,
	surrealConnect,
	surrealGHLogin,
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
	credentials: { url, namespace, database },
	oauth: { github: { client_id: github_client_id, secret_id: github_secret_id } },
	callbackURL
}: {
	cookies: {
		cookieName?: string;
		setCookie: SetCoookieFn;
		getCookie: GetCookieFn;
	};
	oauth: {
		github: {
			client_id: string;
			secret_id: string;
		}
	};
	credentials: {
		url: string;
		namespace: string;
		database: string;
	};
	callbackURL: string
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

	async function debugGithub(code: string) {
		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return {
				db: null,
				error: dbError
			};
		}

		const res = await db.query(
    `
    RETURN fn::github_debug(
      $code,
      $github_client_id,
      $github_secret_id
    );
    `,
			{
				code,
				github_client_id,
				github_secret_id
			}
		);

		console.log(res[0]);
	}

	async function login(email: string, password: string) {
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
			email,
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

	async function register(email: string, password: string) {
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
			email,
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

	async function loginWithCallback(url: URL) {

		logout();

		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');

		if (!code) {
			return {
				data: null,
				error: new Error('Missing authorization code')
			};
		}

		let next = '/';

		try {
			const parsed = state && JSON.parse(state);
			next = parsed?.next ?? '/';
		} catch { /* empty */ }

		const { data: db, error: dbError } = await connect();

		if (dbError) {
			return {
				data: null,
				error: dbError
			};
		}

		const { data: token, error: loginError } = await surrealGHLogin({
			db,
			namespace,
			database,
			code,
			github_client_id,
			github_secret_id
		});

		if (loginError) {
			return {
				data: null,
				error: loginError
			};
		}

		setCookie(tokenName, token, TOKEN_COOKIE_OPTIONS);

		return {
			data: next,
			error: null
		};
	}

	function getGitHubURL(next: string) {
		return createGitHubOAuthLoginUrl(
			callbackURL,
			next,
			github_client_id
		);
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
		changePassword,
		loginWithCallback,
		getGitHubURL,
		debugGithub
	};
}
