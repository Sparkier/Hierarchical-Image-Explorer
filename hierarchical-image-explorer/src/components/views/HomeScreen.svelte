<script lang="ts">
	import ArrowUp from '../icons/ArrowUp.svelte';

	export let currentView;
</script>

<!-- Background and Headline-->
<div class="bg-hie-orange w-full h-full">
	<div class="bg-hie-background bg-no-repeat h-full">
		<div class="pt-20 text-center flex justify-center text-white">
			<div class="font-thin text-5xl">Hierarchical Image</div>
			<div class="font-bold text-5xl">&nbsp;Explorer</div>
		</div>
		<div class="grid place-items-center h-screen">
			<button class="text-3xl text-hie-red hover:text-white underline" on:click={() => (currentView = 'appview')}>
				Let's explore some data!
			</button>
		</div>
		<!--Back to top Button-->
		<button
			type="button"
			data-mdb-ripple="true"
			data-mdb-ripple-color="light"
			class="ml-auto mr-8 p-3 flex items-center bg-hie-red w-10 rounded-full hover:bg-hie-orange hover:outline hover:-outline-offset-2 hover:outline-4 hover:outline-hie-red transition duration-50 ease-in-out"
			on:click={() => window.scrollTo(0, 0)}
		>
			<ArrowUp/>
		</button>
		<div class="text-hie-red text-center pb-20">
			A project by Niklas Gund, Daniel Stucke and Niklas Weidl
		</div>
	</div>
</div>