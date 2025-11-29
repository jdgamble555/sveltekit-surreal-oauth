<script lang="ts">
	import { page } from '$app/state';
</script>

<section>
	<h1 class="text-2xl font-bold">Change Password</h1>

	<form
		method="POST"
		action="?/changePassword"
		class="mt-10 flex flex-col items-center justify-center space-y-6"
	>
		<input
			class="rounded-lg border p-3"
			type="password"
			name="oldPassword"
			placeholder="Current Password"
			autocomplete="off"
		/>
		<input
			class="rounded-lg border p-3"
			type="password"
			name="newPassword"
			placeholder="New Password"
			autocomplete="off"
		/>
		<button class="rounded-lg border bg-green-600 p-3 text-white">Change Password</button>
	</form>
	<hr class="my-5" />
</section>
{#if page.form?.error}
	<p class="mt-4 text-center text-red-500">{page.form.error}</p>
{/if}
{#if page.form?.success}
	<p class="mt-4 text-center text-green-500">Your password has been changed successfully.</p>
{/if}
