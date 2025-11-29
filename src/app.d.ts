// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { surrealServer } from '$lib/surreal/surreal-server';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			surreal: ReturnType<typeof surrealServer>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
