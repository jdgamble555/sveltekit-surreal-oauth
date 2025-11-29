<script lang="ts">
	let pending = $state(false);
</script>

<form method="POST" action="/login?/logout" onsubmit={() => (pending = true)}>
	<button type="submit" class="cursor-pointer" disabled={pending}>
		{pending ? 'Logging out…' : 'Logout'}
	</button>
</form>
