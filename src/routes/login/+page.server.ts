import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as v from 'valibot';

const loginSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	password: v.pipe(v.string(), v.minLength(3, 'Password must be at least 3 characters long'))
});


export const load: PageServerLoad = async ({ locals: { surreal } }) => {
	const userId = surreal.getUser();

	if (userId) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	login: async ({ request, locals: { surreal } }) => {
		
		const formData = await request.formData();

		const data = Object.fromEntries(formData);

		const result = v.safeParse(loginSchema, data);

		if (!result.success) {
			error(400, result.issues[0].message);
		}

		const { email, password } = result.output;

		const { error: loginError } = await surreal.login(email, password);

		if (loginError) {
			return {
				error: loginError.message
			};
		}

		redirect(303, '/');
	},

	logout: async ({ locals: { surreal } }) => {
		surreal.logout();
		redirect(303, '/');
	},

	github: async ({ request, locals: { surreal } }) => {

		const formData = await request.formData();

		const next = formData.get('next') || '/';

		if (typeof next !== 'string') {
			error(500, 'Invalid form data');
		}

		const githubURL = surreal.getGitHubURL(next);

		redirect(303, githubURL);
	}
};
