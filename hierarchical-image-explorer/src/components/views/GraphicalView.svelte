<script lang="ts">
  import Hexagon from '../minis/Hexagon.svelte';
  import BackendService, { PointData } from '../../services/backendService';
  import { ColorUtil } from '../../services/colorUtil';
  import ColorLegend from '../ColorLegend.svelte';
  import SingleImageDisplay from '../SingleImageDisplay.svelte';
  import { generateScale, getExtent } from '../../services/scaleUtilities';
  import Accumulator from '../Accumulator.svelte';

  export let hexaSide = 4;
  export let padding = 20;

  let svgElement: SVGSVGElement;
  let svgWidth: number;

  var data: PointData[];

  var xExtent: number[] = [];
  var yExtent: number[] = [];

  var imgHoverUrl: string = '';

  $: scaleY = generateScale(
    yExtent,
    svgElement == undefined ? 0 : svgElement.clientHeight,
    padding
  );
  $: scaleX = generateScale(xExtent, svgWidth, padding);

  /**
   * Gets all data points
   */
  async function setupData() {
    try {
      data = await BackendService.getAllDataPoints();
      xExtent = getExtent((p: PointData) => p.x, data);
      yExtent = getExtent((p: PointData) => p.y, data);
    } catch (e) {
      console.log(e);
      alert(e);
    }
  }
</script>

<div class="">
  <div class="text-center text-3xl font-thin">
    2D Dimensionality Reduction Demo
  </div>
  <div class="px-24">
    <div bind:clientWidth={svgWidth}>
      {#await setupData()}
        <p>Loading data</p>
      {:then}
        <!-- "svelte for" over the PointData -->
        <svg class="w-full h-[80vh]" bind:this={svgElement}>
          {#each data as point}
            <Hexagon
              side={hexaSide}
              x={scaleX(point.x)}
              y={scaleY(point.y)}
              color={ColorUtil.getColor(point.label)}
              on:mouseenter={() => {
                imgHoverUrl = BackendService.getImageUrl(point.id.toString());
              }}
              on:mouseleave={() => {
                imgHoverUrl = '';
              }}
            />
          {/each}
        </svg>
        <div class="w-fit absolute top-0">
          <ColorLegend colorMap={ColorUtil.colorMap} />
        </div>
        {#if imgHoverUrl !== ''}
          <div class="absolute bottom-0 left-0">
            <SingleImageDisplay imgUrl={imgHoverUrl} />
          </div>
        {/if}
        <Accumulator {data} />
        <div>Under ACC</div>
      {:catch error}
        <p>{error.message}</p>
      {/await}
    </div>
  </div>
</div>
