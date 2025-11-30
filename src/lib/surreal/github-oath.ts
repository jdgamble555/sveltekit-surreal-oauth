export function createGitHubOAuthLoginUrl(
	redirect_uri: string,
	path: string,
	client_id: string,
	customParameters?: Record<string, string>,
	addScopes?: string[]
) {
	// Build scope string with default scopes and additional ones
	const baseScopes = ['read:user', 'user:email'];
	const scopes = addScopes ? [...baseScopes, ...addScopes] : baseScopes;

	const params: Record<string, string> = {
		client_id,
		redirect_uri,
		scope: scopes.join(' '),
		state: JSON.stringify({
			next: path,
			provider: 'github'
		})
	};

	// Add custom parameters if provided (e.g., 'login', 'allow_signup')
	if (customParameters) {
		Object.assign(params, customParameters);
	}

	return new URL(
		'https://github.com/login/oauth/authorize?' + new URLSearchParams(params).toString()
	).toString();
}
