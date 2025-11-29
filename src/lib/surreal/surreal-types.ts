export type CookieOptions = {
	path: string;
	domain?: string;
	expires?: Date;
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
};

export type SetCoookieFn = (name: string, value: string, options: CookieOptions) => void;
export type GetCookieFn = (name: string) => string | undefined;
