<script lang="ts">
	import { page } from '$app/state';
	import GithubSvg from './github-svg.svelte';

	const next = page.url.searchParams.get('next') || '/';
</script>

<form method="POST" action="/login?/github">
	<input type="hidden" name="next" value="{next}" />
	<button
		type="submit"
		class="rounded bg-gray-800 p-3 font-semibold text-white flex gap-3 items-center cursor-pointer"
	>
		<GithubSvg class="size-5" />
		<span>Signin with GitHub</span>
	</button>
</form>
