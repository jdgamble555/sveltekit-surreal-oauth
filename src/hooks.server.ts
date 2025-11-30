import type { Handle } from '@sveltejs/kit';
import {
	PRIVATE_SURREALDB_URL,
	PRIVATE_SURREALDB_NAMESPACE,
	PRIVATE_SURREALDB_DATABASE,
	PRIVATE_GITHUB_CLIENT_SECRET
} from '$env/static/private';
import { surrealServer } from './lib/surreal/surreal-server';
import { PUBLIC_GITHUB_CLIENT_ID } from '$env/static/public';

const config = {
	url: PRIVATE_SURREALDB_URL,
	namespace: PRIVATE_SURREALDB_NAMESPACE,
	database: PRIVATE_SURREALDB_DATABASE
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.surreal = surrealServer({
		cookies: {
			setCookie: (name, value, options) => event.cookies.set(name, value, options),
			getCookie: (name) => event.cookies.get(name)
		},
		credentials: {
			url: config.url,
			namespace: config.namespace,
			database: config.database
		},
		oauth: {
			github: {
				client_id: PUBLIC_GITHUB_CLIENT_ID,
				secret_id: PRIVATE_GITHUB_CLIENT_SECRET
			}
		},
		callbackURL: event.url.origin + '/auth/callback'
	});

	return resolve(event);
};
