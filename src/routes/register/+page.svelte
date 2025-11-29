<script lang="ts">
	import { page } from '$app/state';
</script>

<section>
	<h1 class="text-2xl font-bold">Register</h1>

	<form
		method="POST"
		action="?/register"
		class="mt-10 flex flex-col items-center justify-center space-y-6"
	>
		<input
			class="rounded-lg border p-3"
			type="text"
			name="username"
			placeholder="Username"
			autocomplete="off"
		/>
		<input
			class="rounded-lg border p-3"
			type="password"
			name="password"
			placeholder="Password"
			autocomplete="off"
		/>
		<button class="rounded-lg border bg-green-600 p-3 text-white">Register</button>
	</form>
	<hr class="my-5" />
	<p class="text-center text-gray-600">
		<a href="/login" class="text-blue-500 underline">Already registered?</a>
	</p>
	<hr class="my-5" />
</section>
{#if page.form?.error}
	<p class="mt-4 text-center text-red-500">{page.form.error}</p>
{/if}
