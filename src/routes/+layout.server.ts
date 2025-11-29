import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { surreal } }) => {
	const userId = surreal.getUser();

	return {
		userId
	};
};
