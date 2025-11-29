<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import Logout from './login/logout.svelte';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main class="mt-10 flex flex-col items-center justify-center space-y-6">
	{@render children?.()}
	<nav class="flex space-x-6">
		<a href="/">Home</a>
		{#if data.userId}
			<Logout />
		{:else}
			<a href="/login">Login</a>
		{/if}
		<a href="/dashboard">Dashboard</a>
	</nav>
</main>
