import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createGitHubOAuthLoginUrl } from './github-oath';
import { PUBLIC_GITHUB_CLIENT_ID } from '$env/static/public';

export const load: PageServerLoad = async ({ locals: { surreal } }) => {
	const userId = surreal.getUser();

	if (userId) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	login: async ({ request, locals: { surreal } }) => {
		const formData = await request.formData();

		const { username, password } = Object.fromEntries(formData);

		if (typeof username !== 'string' || typeof password !== 'string') {
			error(500, 'Invalid form data');
		}

		const { error: loginError } = await surreal.login(username, password);

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

	github: async ({ request, url }) => {

		const formData = await request.formData();

		const next = formData.get('next') || '/';

		if (typeof next !== 'string') {
			error(500, 'Invalid form data');
		}

		const redirect_uri = url.origin + '/auth/callback';

		const githubURL = createGitHubOAuthLoginUrl(
			redirect_uri,
			next,
			PUBLIC_GITHUB_CLIENT_ID
		);

		redirect(303, githubURL);
	}
};
