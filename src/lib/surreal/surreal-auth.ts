import { StringRecordId, Surreal, SurrealDbError } from 'surrealdb';

export async function surrealConnect({
	namespace,
	database,
	url
}: {
	namespace: string;
	database: string;
	url: string;
}) {
	const db = new Surreal();

	try {
		await db.connect(url, {
			namespace,
			database
		});
	} catch (e) {
		if (e instanceof SurrealDbError) {
			return {
				data: null,
				error: e
			};
		}

		if (e instanceof Error) {
			return {
				data: null,
				error: e
			};
		}

		return {
			data: null,
			error: new Error('Unknown error during SurrealDB connection')
		};
	}
	return {
		data: db,
		error: null
	};
}

export async function surrealGHLogin({
	db,
	namespace,
	database,
	code,
	github_client_id,
	github_secret_id
}: {
	db: Surreal;
	namespace: string;
	database: string;
	code: string;
	github_client_id: string;
	github_secret_id: string;
}) {
	try {
		const signinData = await db.signin({
			namespace,
			database,
			variables: {
				code,
				github_client_id,
				github_secret_id
			},
			access: 'github'
		});

		return {
			data: signinData,
			error: null
		};
	} catch (e) {
		if (e instanceof SurrealDbError) {
			console.log(e.message);
			return {
				data: null,
				error: e
			};
		}

		if (e instanceof Error) {
			return {
				data: null,
				error: e
			};
		}

		return {
			data: null,
			error: new Error('Unknown error during login')
		};
	}
}


export async function surrealLogin({
	db,
	namespace,
	database,
	email,
	password
}: {
	db: Surreal;
	namespace: string;
	database: string;
	email: string;
	password: string;
}) {
	try {
		const signinData = await db.signin({
			namespace,
			database,
			variables: {
				email,
				password
			},
			access: 'user'
		});

		return {
			data: signinData,
			error: null
		};
	} catch (e) {
		if (e instanceof SurrealDbError) {
			return {
				data: null,
				error: e
			};
		}

		if (e instanceof Error) {
			return {
				data: null,
				error: e
			};
		}

		return {
			data: null,
			error: new Error('Unknown error during login')
		};
	}
}

export async function surrealRegister({
	db,
	namespace,
	database,
	email,
	password
}: {
	db: Surreal;
	namespace: string;
	database: string;
	email: string;
	password: string;
}) {
	try {
		const signupData = await db.signup({
			namespace,
			database,
			variables: {
				email,
				password
			},
			access: 'user'
		});

		return {
			data: signupData,
			error: null
		};
	} catch (e) {
		if (e instanceof SurrealDbError) {
			return {
				data: null,
				error: e
			};
		}

		if (e instanceof Error) {
			return {
				data: null,
				error: e
			};
		}

		return {
			data: null,
			error: new Error('Unknown error during registration')
		};
	}
}

export async function surrealChangePassword({
	db,
	currentPassword,
	newPassword,
	userId
}: {
	db: Surreal;
	currentPassword: string;
	newPassword: string;
	userId: string;
}) {
	try {
		const query = `
            UPDATE $id
            SET password = crypto::argon2::generate($new)
            WHERE crypto::argon2::compare(password, $old)
        `;

		const [result] = await db.query<
			[
				{
					id: string;
					password: string;
					email: string;
				}
			][]
		>(query, {
			id: new StringRecordId(userId),
			old: currentPassword,
			new: newPassword
		});

		if (!result) {
			return {
				data: null,
				error: new Error('Password change failed')
			};
		}

		return {
			data: result[0],
			error: null
		};
	} catch (error) {
		if (error instanceof SurrealDbError) {
			return {
				data: null,
				error
			};
		}

		if (error instanceof Error) {
			return {
				error,
				data: null
			};
		}
		return {
			error: new Error('Unknown query error'),
			data: null
		};
	}
}
