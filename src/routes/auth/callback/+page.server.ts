import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

/**
 * Load function for the OAuth callback page.
 * This is called on initial GET to /auth/callback
 */
export const load = (async (event) => {
    // Example: read query params like ?code=...&state=...
    const url = new URL(event.request.url);
    const code = url.searchParams.get('code');
    //const state = url.searchParams.get('state');

    // TODO: validate state, exchange code for tokens, load/create user in SurrealDB, etc.

    if (!code) {
        throw error(400, 'Missing authorization code');
    }

    // After successful auth, you likely want to set cookies / session and redirect:
    // event.cookies.set('session', 'token-value', { path: '/', httpOnly: true, sameSite: 'lax' });

    throw redirect(303, '/');
}) satisfies PageServerLoad;