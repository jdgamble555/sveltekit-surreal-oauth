import type { Handle } from '@sveltejs/kit';
import {
	PRIVATE_SURREALDB_URL,
	PRIVATE_SURREALDB_NAMESPACE,
	PRIVATE_SURREALDB_DATABASE
} from '$env/static/private';
import { surrealServer } from './lib/surreal/surreal-server';

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
		}
	});

	return resolve(event);
};
