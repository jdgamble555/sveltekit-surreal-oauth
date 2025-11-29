import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as v from 'valibot';

const registerSchema = v.object({
	username: v.pipe(v.string(), v.minLength(3, 'Username must be at least 3 characters long')),
	password: v.pipe(v.string(), v.minLength(3, 'Password must be at least 3 characters long'))
});

export const load: PageServerLoad = async ({ locals: { surreal } }) => {
	const userId = surreal.getUser();

	if (userId) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	register: async ({ request, locals: { surreal } }) => {
		const formData = await request.formData();

		const data = Object.fromEntries(formData);

		const result = v.safeParse(registerSchema, data);

		if (!result.success) {
			error(400, result.issues[0].message);
		}

		const { username, password } = result.output;

		const { error: registerError } = await surreal.register(username, password);

		if (registerError) {
			error(500, registerError.message);
		}

		redirect(303, '/');
	}
};
