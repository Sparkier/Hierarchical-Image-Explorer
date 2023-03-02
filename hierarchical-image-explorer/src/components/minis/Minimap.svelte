<script lang="ts">
  import { onMount } from 'svelte';
  import { quantizationRollup } from '../../services/arqueroUtils';
  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';
  import { hexagonPropertiesMap, selectedColorPalette } from '../../stores';
  import type { DerivedHexagon, HexagonPropertiesMap } from '../../types';

  export let svgHeight: number;
  export let svgWidth: number;
  export let topLeftSvgCorner: DOMPoint;
  export let bottomRightSvgCorner: DOMPoint;
  export let columns: number = 20;

  let minimapWidth: number;
  let minimapHeight: number;
  let rows: number = 0;
  let datagons: DerivedHexagon[] = [];

  const svgToMinimapScaleX = (v: number) => (v / svgWidth) * minimapWidth;
  const svgToMinimapScaleY = (v: number) => (v / svgHeight) * minimapHeight;

  $: minimapScaleX = topLeftSvgCorner
    ? svgToMinimapScaleX(topLeftSvgCorner.x)
    : 0;
  $: minimapScaleY = topLeftSvgCorner
    ? svgToMinimapScaleY(topLeftSvgCorner.y)
    : 0;

  $: minimapScaleHeight =
    bottomRightSvgCorner && topLeftSvgCorner
      ? svgToMinimapScaleY(bottomRightSvgCorner.y - topLeftSvgCorner.y)
      : 0;
  $: minimapScaleWidth =
    bottomRightSvgCorner && topLeftSvgCorner
      ? svgToMinimapScaleY(bottomRightSvgCorner.x - topLeftSvgCorner.x)
      : 0;

  $: dotsize = minimapWidth / columns / 4;

  /**
   * retrieves the quantized data used in the minimap
   * @returns quantized list of datagons
   */
  function getQuantizedBlobs(
    propertyMap: HexagonPropertiesMap
  ): DerivedHexagon[] {
    const quantizationResult = TableService.getQuantizationLocal(columns);
    rows = quantizationResult.rows;
    const virtualHexaSide = minimapWidth / (3 * columns);
    minimapHeight = (((rows + 1) * Math.sqrt(3)) / 2) * virtualHexaSide;

    const minimalTable = quantizationRollup(
      quantizationResult.datagons,
      propertyMap
    );

    if (!minimalTable) {
      return [];
    }

    return minimalTable.objects() as DerivedHexagon[];
  }

  $: {
    datagons = getQuantizedBlobs($hexagonPropertiesMap);
  }

  onMount(() => {
    datagons = getQuantizedBlobs($hexagonPropertiesMap);
  });
</script>

<div bind:clientWidth={minimapWidth}>
  {#if !isNaN(minimapWidth)}
    <svg height={minimapHeight} width={minimapWidth}>
      {#each datagons as d}
        <circle
          cx={((d.quantization[0] + (d.quantization[1] % 2 === 0 ? 0 : 0.5)) /
            columns) *
            (minimapWidth - dotsize) +
            dotsize}
          cy={(d.quantization[1] / rows) * (minimapHeight - dotsize) + dotsize}
          r={dotsize}
          fill={ColorUtil.getColor(d.color, $selectedColorPalette)}
        />
        <!-- Color must be adjusted once custom hexagon colorizing is implemented -->
      {/each}
      {#if !isNaN(minimapScaleX) && !isNaN(minimapScaleY)}
        <rect
          x={minimapScaleX}
          y={minimapScaleY}
          width={minimapScaleWidth}
          height={minimapScaleHeight}
          fill="black"
          fill-opacity=".25"
          stroke="red"
          stroke-width="2px"
        />
      {/if}
    </svg>
  {/if}
</div>
