<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<section class="space-y-6">
	<h1 class="text-2xl font-bold">Dashboard</h1>
	<p>This will be your login wall dashboard!</p>
	<p>
		Your user ID is: <span class="font-mono font-bold">{data.userId}</span>
	</p>
	<hr class="my-5" />
	<p class="text-center text-gray-600">
		<a href="/password" class="text-blue-500 underline">Change Password</a>
	</p>
	<hr class="my-5" />
</section>
