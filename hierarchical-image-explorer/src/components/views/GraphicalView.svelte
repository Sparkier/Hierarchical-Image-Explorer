<script lang="ts">
  import Hexagon from '../minis/Hexagon.svelte';
  import BackendService, { PointData } from '../../services/backendService';
  import { ColorUtils } from '../../services/colorUtil';
  import ColorLegend from '../ColorLegend.svelte';
  import SingleImageDisplay from '../SingleImageDisplay.svelte';

  export let hexaSide = 4;
  export let padding = 20;

  let svgElement: SVGSVGElement;
  let svgWidth: number;

  var data: PointData[];
  var xExtent: number[] = [];
  var yExtent: number[] = [];
  var colorMap: Map<string, string> = new Map();
  var imgHoverUrl: string = '';

  $: scaleY = generateScale(
    yExtent,
    svgElement == undefined ? 0 : svgElement.clientHeight
  );
  $: scaleX = generateScale(xExtent, svgWidth);

  /**
   * Gets all data points
   */
  async function setupData() {
    try {
      const response = await BackendService.getAllDataPoints();
      data = response;
      xExtent = getExtent((p: PointData) => p.x, data);
      yExtent = getExtent((p: PointData) => p.y, data);
    } catch (e) {
      console.log(e);
      alert(e);
    }
  }

  /**
   * @param accessor accesor function for parameters of elements of pointsList
   * @param poinstList list of 2dPoint
   */
  function getExtent(
    accessor: (el: PointData) => number,
    pointsList: PointData[]
  ): [number, number] {
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;

    pointsList.forEach((p) => {
      const value = accessor(p);
      if (value > max) max = value;
      if (value < min) min = value;
    });

    return [min, max];
  }

  /**
   * Generates a scale that maps input points of a given extent to the svg size.
   * In this scale 0 is always in the middle the values are scaled to fit
   * @param extent extent of scale
   * @param domain available height/width to display scale
   * @returns a scale function
   */
  function generateScale(extent: number[], domain: number) {
    return (v: number) => {
      // maximum distance from zero *2
      const extentAbsMax =
        Math.max(Math.abs(extent[0]), Math.abs(extent[1])) * 2;
      // normalize to [0,1] and then scale with available space
      return (v / extentAbsMax + 0.5) * (domain - 2 * padding) + padding;
    };
  }

  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  function getColor(label: string) {
    if (colorMap.has(label)) return colorMap.get(label);
    else {
      const color = ColorUtils.colors[colorMap.size];
      colorMap = colorMap.set(label, color);
      return color;
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
              color={getColor(point.label)}
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
          <ColorLegend {colorMap} />
        </div>
        {#if imgHoverUrl !== ''}
          <div class="absolute bottom-0 left-0">
            <SingleImageDisplay imgUrl={imgHoverUrl} />
          </div>
        {/if}
      {:catch error}
        <p>{error.message}</p>
      {/await}
    </div>
  </div>
</div>
