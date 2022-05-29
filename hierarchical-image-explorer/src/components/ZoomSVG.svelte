<script>
  import { onMount } from 'svelte';
  import { zoom } from 'd3-zoom';
  import { select } from 'd3-selection';

  export let viewBox = '0 0 300 150';
  export let transform;
  export let zoomLevel;
  export let g;
  export let svg;

  onMount(() => {
    if (svg && g) {
      select(svg).call(
        zoom()
          .on('zoom', ({ transform: transformNew }) => {
            const { k, x, y } = transformNew;
            zoomLevel = k;
            transform = [x, y];
            select(g).attr('transform', `translate(${x}, ${y}) scale(${k})`);
          })
          .scaleExtent([1, 200])
      );
    }
  });
</script>

<svg {viewBox} bind:this={svg} id="jens-joachim">
  <g bind:this={g}>
    <slot />
  </g>
</svg>
