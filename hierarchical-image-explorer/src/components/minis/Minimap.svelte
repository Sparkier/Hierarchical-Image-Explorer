<script lang="ts">
  import { onMount } from 'svelte';
  import { quantizationRollup } from '../../services/arqueroUtils';

  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';
  import { hexagonPropertiesMap } from '../../stores';
  import type {
    DataHexagon,
    DerivedHexagon,
    HexagonPropertiesMap,
  } from '../../types';

  export let svgHeight: number;
  export let svgWidth: number;
  export let topLeftSvgCorner: DOMPoint;
  export let bottomRightSvgCorner: DOMPoint;
  export let columns = 20;

  let minimapWidth: number;
  let minimapHeight: number = 0;
  let rows = 0;
  let datagons: DerivedHexagon[] = [];
  let hexagonPropertiesMapLocal: HexagonPropertiesMap;

  $: svgToMinimapScaleX = (v: number) => (v / svgWidth) * minimapWidth;
  $: svgToMinimapScaleY = (v: number) => (v / svgHeight) * minimapHeight;
  $: dotsize = minimapWidth / columns / 4;

  hexagonPropertiesMap.subscribe((v) => (hexagonPropertiesMapLocal = v));

  /**
   * retrieves the quantized data used in the minimap
   * @returns quanzized list of datagons
   */
  function getQuantizedBlobs(): DerivedHexagon[] {
    const quantizationResult = TableService.getQuantizationLocal(columns);
    rows = quantizationResult.rows;
    const virtualHexaSide = minimapWidth / (3 * columns);
    minimapHeight = (((rows + 1) * Math.sqrt(3)) / 2) * virtualHexaSide;

    const minimalTable = quantizationRollup(
      quantizationResult.datagons,
      hexagonPropertiesMapLocal
    );
    const minimalTalbeObjects = minimalTable.objects() as DerivedHexagon[];
    return minimalTalbeObjects;
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
          cx={((d.quantization[0] + (d.quantization[1] % 2 == 0 ? 0 : 0.5)) /
            columns) *
            (minimapWidth - dotsize) +
            dotsize}
          cy={(d.quantization[1] / rows) * (minimapHeight - dotsize) + dotsize}
          r={dotsize}
          fill={ColorUtil.getColor(d.color)}
        />
        <!-- Color must be adjusted once custom hexagon colorizing is implemented -->
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
