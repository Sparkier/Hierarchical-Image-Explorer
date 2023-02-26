<script>
  import { onMount } from 'svelte';
  import { zoom } from 'd3-zoom';
  import { select } from 'd3-selection';
  import { createEventDispatcher } from 'svelte';

  export let viewBox = '0 0 300 150'; // default svg height and width
  export let zoomLevel = 1;
  export let g = undefined;
  export let svg = undefined;
  export let selectionModeOn = false;

  let transform = [0, 0];
  let lassoStart;
  let lassoActive = false;
  let lassoPoints = '';

  const dispatch = createEventDispatcher();

  $: {
    if (selectionModeOn === false) {
      lassoPoints = '';
      lassoStart = undefined;
    }
  }

  onMount(() => {
    if (svg && g) {
      select(svg).call(
        zoom()
          .on('zoom', ({ transform: transformNew }) => {
            if (!selectionModeOn) {
              const { k, x, y } = transformNew;
              zoomLevel = k;
              transform = [x, y];
              select(g).attr('transform', `translate(${x}, ${y}) scale(${k})`);
              dispatch('zoomEnd', {});
            }
          })
          .scaleExtent([1, Number.POSITIVE_INFINITY])
      );
    }
  });

  /**
   * Starts the lasso selection process
   * @param e selection event
   */
  function startLasso(e) {
    if (!selectionModeOn) return;
    if (!lassoActive) {
      lassoStart = { x: e.layerX, y: e.layerY };
      lassoPoints = `${e.layerX},${e.layerY} `;
      lassoActive = true;
    } else lassoEnd();
  }

  /**
   * updates the lasso points with current event position
   * @param e selection event
   */
  function lassoMove(e) {
    if (!lassoActive) return;
    lassoPoints += `${e.layerX},${e.layerY} `;
  }

  /**
   * Ends the lasso selection process
   */
  function lassoEnd() {
    if (!selectionModeOn) return;
    lassoActive = false;
    dispatch('lassoSelectionEnd');
  }
</script>

<svg
  on:mousedown={startLasso}
  on:mousemove={lassoMove}
  {viewBox}
  bind:this={svg}
  class={selectionModeOn ? 'cursor-crosshair' : ''}
  style="transform-box: fill-box;"
>
  <g bind:this={g}>
    <slot />
  </g>
  <g>
    {#if lassoStart !== undefined && selectionModeOn}
      <circle cx={lassoStart.x} cy={lassoStart.y} r="5" fill="red" />
      <polygon
        id="lassoPolygon"
        points={lassoPoints}
        stroke="red"
        stroke-dasharray="10,10"
        fill="red"
        fill-opacity="0.25"
      />
    {/if}
  </g>
</svg>
