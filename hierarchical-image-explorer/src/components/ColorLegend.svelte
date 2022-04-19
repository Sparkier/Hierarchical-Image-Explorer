<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';

  export let colorMap: Map<string, string>;
</script>

<div class="px-3 py-1 bg-neutral-200 rounded-lg">
  {#each Array.from(colorMap) as entry}
    <div class="flex items-center">
      <svg class="w-7 h-7">
        <Hexagon color={entry[1]} side={10} y={8} x={2} />
      </svg>
      <div class="ml-2">{entry[0]}</div>
    </div>
  {/each}
</div>
