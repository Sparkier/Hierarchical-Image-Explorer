<script lang="ts">
  import BackendService from '../../services/backendService';
  import { ColorUtil } from '../../services/colorUtil';

  export let svgHeight: number;
  export let svgWidth: number;
  export let topLeftSvgCorner: DOMPoint;
  export let bottomRightSvgCorner: DOMPoint;
  export let dotsize = 4;

  let minimapWidth: number;

  $: height = (svgHeight / svgWidth) * minimapWidth;
  $: svgToMinimapScaleX = (v: number) => (v / svgWidth) * minimapWidth;
  $: svgToMinimapScaleY = (v: number) => (v / svgHeight) * height;
</script>

<div bind:clientWidth={minimapWidth}>
  <svg {height} width={minimapWidth}>
    {#await BackendService.getQuantization(20)}
      <text>Loading Data</text>
    {:then quant}
      {#each quant.datagons as d}
        <circle
          cx={((d.hexaX + (d.hexaY % 2 == 0 ? 0 : 0.5)) / quant.columns) *
            (minimapWidth - dotsize) +
            dotsize}
          cy={(d.hexaY / quant.rows) * (height - dotsize) + dotsize}
          r={dotsize}
          fill={ColorUtil.getColor(d.dominantLabel)}
        />
      {/each}
    {/await}
    {#if topLeftSvgCorner != undefined}
      <rect
        x={svgToMinimapScaleX(topLeftSvgCorner.x)}
        y={svgToMinimapScaleY(topLeftSvgCorner.y)}
        width={svgToMinimapScaleX(bottomRightSvgCorner.x - topLeftSvgCorner.x)}
        height={svgToMinimapScaleY(bottomRightSvgCorner.y - topLeftSvgCorner.y)}
        fill="black"
        fill-opacity=".25"
        stroke="red"
        stroke-width="2px"
      />
    {/if}
  </svg>
</div>