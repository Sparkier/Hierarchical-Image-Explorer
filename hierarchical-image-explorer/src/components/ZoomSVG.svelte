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
  export let selectionModeOn = false;

  let lassoStart;
  let lassoActive = false;
  let lassoPoints = '';

  const dispatch = createEventDispatcher();

  $: {
    if (selectionModeOn == false) {
      lassoPoints = '';
      lassoStart = undefined;
    }
  }

  function dispatchZoomEndEvent() {
    dispatch('zoomEnd', {
      transform: transform,
      zoomLevel: zoomLevel,
    });
  }

  onMount(() => {
    if (svg && g) {
      setupZoom();
    }
  });

  function setupZoom() {
    select(svg).call(
      zoom()
        .on('zoom', ({ transform: transformNew }) => {
          if (!selectionModeOn) {
            const { k, x, y } = transformNew;
            zoomLevel = k;
            transform = [x, y];
            select(g).attr('transform', `translate(${x}, ${y}) scale(${k})`);
          }
        })
        .on('end', () => {
          if (!selectionModeOn) dispatchZoomEndEvent();
        })
        .scaleExtent([1, 200])
    );
  }

  function startLasso(e) {
    if (!selectionModeOn) return;
    if (!lassoActive) {
      lassoStart = { x: e.layerX, y: e.layerY };
      lassoPoints = `${e.layerX},${e.layerY} `;
      lassoActive = true;
    } else lassoEnd(e);
  }

  function lassoMove(e) {
    if (!lassoActive) return;
    lassoPoints += `${e.layerX},${e.layerY} `;
  }

  function lassoEnd(e) {
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
>
  <g bind:this={g}>
    <slot />
  </g>
  <g>
    {#if lassoStart != undefined && selectionModeOn}
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
