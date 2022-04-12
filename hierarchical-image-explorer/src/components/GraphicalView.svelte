<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import BackendService, { PointData } from '../services/backendService';
  import { ColorUtils } from '../services/colorUtil';

  export let hexaSide = 4;
  export let padding = 20;

  let svgElement: SVGSVGElement;
  let svgWidth: number;

  var data: PointData[];
  var xExtent: number[] = [];
  var yExtent: number[] = [];
  const colorMap: Map<string, string> = new Map();

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
      colorMap.set(label, color);
      return color;
    }
  }
</script>

<div>
  <h2>2D Dimensionality Reduction Demo</h2>
  <div class="csv-container">
    <div bind:clientWidth={svgWidth}>
      <svg width="100%" height="580px" bind:this={svgElement}>
        {#await setupData()}
          <p>Loading data</p>
        {:then}
          <!-- "svelte for" over the PointData -->
          {#each data as point}
            <Hexagon
              side={hexaSide}
              x={scaleX(point.x)}
              y={scaleY(point.y)}
              color={getColor(point.label)}
            />
          {/each}
        {:catch error}
          <p>{error.message}</p>
        {/await}
      </svg>
    </div>
  </div>
</div>

<style>
  .csv-container {
    padding-left: 150px;
    padding-right: 150px;
  }
</style>
