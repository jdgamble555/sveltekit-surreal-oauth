import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { surreal } }) => {
	const userId = surreal.getUser();

	if (!userId) {
		redirect(303, '/login');
	}
};
