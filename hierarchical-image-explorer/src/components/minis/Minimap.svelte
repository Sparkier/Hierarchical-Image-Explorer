<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_SHAPE_TYPE } from '../../config';
  import { quantizationRollup } from '../../services/arqueroUtils';
  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';
  import { hexagonPropertiesMap, selectedColorPalette } from '../../stores';
  import { DerivedHexagon, HexagonPropertiesMap, ShapeType } from '../../types';

  export let svgHeight: number;
  export let svgWidth: number;
  export let topLeftSvgCorner: DOMPoint;
  export let bottomRightSvgCorner: DOMPoint;
  export let columns: number = 20;
  export let shapeType = DEFAULT_SHAPE_TYPE;

  let minimapWidth: number;
  let minimapHeight: number;
  let datagons: DerivedHexagon[] = [];
  let rows: number = 0;

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

  $: dotsize =
    shapeType === ShapeType.Square
      ? minimapWidth / columns
      : minimapWidth / columns / 4;

  $: console.log(shapeType);

  /**
   * retrieves the quantized data used in the minimap
   * @returns quantized list of datagons
   */
  function getQuantizedBlobs(
    propertyMap: HexagonPropertiesMap,
    shape: ShapeType
  ): DerivedHexagon[] {
    const quantizationResult = TableService.getQuantizationLocal(
      columns,
      shape
    );

    if (shapeType === ShapeType.Square) {
      minimapHeight = minimapWidth;
    } else {
      rows = quantizationResult.rows;
      const virtualHexaSide = minimapWidth / (3 * columns);
      minimapHeight = (((rows + 1) * Math.sqrt(3)) / 2) * virtualHexaSide;
    }

    console.log(minimapHeight);

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
    datagons = getQuantizedBlobs($hexagonPropertiesMap, shapeType);
  }

  onMount(() => {
    datagons = getQuantizedBlobs($hexagonPropertiesMap, shapeType);
  });
</script>

<div bind:clientWidth={minimapWidth}>
  {#if !isNaN(minimapWidth) && !isNaN(dotsize)}
    <svg height={minimapHeight} width={minimapWidth}>
      {#each datagons as d}
        {#if shapeType === ShapeType.Square}
          <rect
            x={d.quantization[0] * dotsize}
            y={d.quantization[1] * dotsize}
            width={dotsize}
            height={dotsize}
            fill={ColorUtil.getColor(d.color, $selectedColorPalette)}
          />
        {:else}
          <circle
            cx={((d.quantization[0] + (d.quantization[1] % 2 === 0 ? 0 : 0.5)) /
              columns) *
              (minimapWidth - dotsize) +
              dotsize}
            cy={(d.quantization[1] / rows) * (minimapHeight - dotsize) +
              dotsize}
            r={dotsize}
            fill={ColorUtil.getColor(d.color, $selectedColorPalette)}
          />
        {/if}

        <!-- Color must be adjusted once custom hexagon colorizing is implemented -->
      {/each}
      {#if !isNaN(minimapScaleX) && !isNaN(minimapScaleY) && !isNaN(minimapScaleWidth) && !isNaN(minimapScaleHeight)}
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
