<script>
  import { onMount } from 'svelte';
  import { zoom } from 'd3-zoom';
  import { select } from 'd3-selection';
  import { createEventDispatcher } from 'svelte';

  export let viewBox = '0 0 300 150'; // default svg height and width
  export let transform;
  export let zoomLevel;
  export let g;
  export let svg;

  const dispatch = createEventDispatcher();

  function dispatchZoomEndEvent() {
    dispatch('zoomEnd', {
      transform: transform,
      zoomLevel: zoomLevel,
    });
  }

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
          .on('end', () => dispatchZoomEndEvent())
          .scaleExtent([1, 200])
      );
    }
  });
</script>

<svg {viewBox} bind:this={svg}>
  <g bind:this={g}>
    <slot />
  </g>
</svg>
