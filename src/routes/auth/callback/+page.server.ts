import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';


export const load = (async ({ url, locals: { surreal } }) => {

    const {
        data: next,
        error: loginError
    } = await surreal.loginWithCallback(url);

    if (loginError) {
        error(400, loginError.message);
    }

    redirect(303, next);

}) satisfies PageServerLoad;