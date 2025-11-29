<script lang="ts">
	import GithubSvg from './github-svg.svelte';
</script>

<form method="POST" action="/login?/github">
	<button
		type="submit"
		class="rounded bg-gray-800 p-3 font-semibold text-white flex gap-3 items-center"
	>
		<GithubSvg class="size-5" />
		<span>Signin with GitHub</span>
	</button>
</form>
