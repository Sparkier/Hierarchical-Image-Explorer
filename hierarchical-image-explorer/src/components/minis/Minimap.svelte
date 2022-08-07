<script lang="ts">
  import { onMount } from 'svelte';

  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';
  import type { DataHexagon } from '../../types';

  export let svgHeight: number;
  export let svgWidth: number;
  export let topLeftSvgCorner: DOMPoint;
  export let bottomRightSvgCorner: DOMPoint;
  export let columns = 20;

  let minimapWidth: number;
  let minimapHeight: number = 0;
  let rows = 0;
  let datagons: DataHexagon[] = [];

  $: svgToMinimapScaleX = (v: number) => (v / svgWidth) * minimapWidth;
  $: svgToMinimapScaleY = (v: number) => (v / svgHeight) * minimapHeight;
  $: dotsize = minimapWidth / columns / 4;

  /**
   * retrieves the quantized data used in the minimap
   * @returns quanzized list of datagons
   */
  function getQuantizedBlobs(): DataHexagon[] {
    const quantizationResult = TableService.getQuantizationLocal(columns);
    rows = quantizationResult.rows;
    const virtualHexaSide = minimapWidth / (3 * columns);
    minimapHeight = (((rows + 1) * Math.sqrt(3)) / 2) * virtualHexaSide;
    return quantizationResult.datagons;
  }

  onMount(() => {
    datagons = getQuantizedBlobs();
  });
</script>

<div bind:clientWidth={minimapWidth}>
  {#if !isNaN(minimapWidth)}
    <svg height={minimapHeight} width={minimapWidth}>
      {#each datagons as d}
        <circle
          cx={((d.hexaX + (d.hexaY % 2 == 0 ? 0 : 0.5)) / columns) *
            (minimapWidth - dotsize) +
            dotsize}
          cy={(d.hexaY / rows) * (minimapHeight - dotsize) + dotsize}
          r={dotsize}
          fill={ColorUtil.getColor(d.dominantLabel)}
        />
      {/each}
      {#if topLeftSvgCorner != undefined}
        <rect
          x={svgToMinimapScaleX(topLeftSvgCorner.x)}
          y={svgToMinimapScaleY(topLeftSvgCorner.y)}
          width={svgToMinimapScaleX(
            bottomRightSvgCorner.x - topLeftSvgCorner.x
          )}
          height={svgToMinimapScaleY(
            bottomRightSvgCorner.y - topLeftSvgCorner.y
          )}
          fill="black"
          fill-opacity=".25"
          stroke="red"
          stroke-width="2px"
        />
      {/if}
    </svg>
  {/if}
</div>
