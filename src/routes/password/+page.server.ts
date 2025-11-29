import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { surreal } }) => {
	const userId = await surreal.getUserInfo();

	if (!userId) {
		redirect(303, '/login');
	}
};

export const actions: Actions = {
	changePassword: async ({ request, locals: { surreal } }) => {
		const formData = await request.formData();

		const { oldPassword, newPassword } = Object.fromEntries(formData);

		if (
			typeof oldPassword !== 'string' ||
			typeof newPassword !== 'string' ||
			newPassword.length < 3
		) {
			error(500, 'Invalid password data');
		}

		const { data: passwordChangeData, error: passwordChangeError } = await surreal.changePassword(
			oldPassword,
			newPassword
		);

		if (passwordChangeError) {
			return {
				error: passwordChangeError.message
			};
		}

		if (passwordChangeData?.password) {
			return {
				success: true
			};
		}

		return {
			success: true
		};
	}
};
