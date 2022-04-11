<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import BackendService, { PointData } from '../services/backendService';

  let data: PointData[];
  const colors = [
    '#DF2935',
    '#7D5BA6',
    '#55D6BE',
    '#F19A3E',
    '#F8E16C',
    '#5DA9E9',
  ]; //! expand later
  export let hexaSide = 4;
  const padding = 20;
  let xExtent: number[] = [];
  let yExtent: number[] = [];

  /**
   * Gets all data points
   */
  async function setupData() {
    const response = await BackendService.getAllDataPoints();
    data = response;
    xExtent = getExtent((p: PointData) => p.x, data);
    yExtent = getExtent((p: PointData) => p.y, data);
    console.log(xExtent);
  }

  /**
   * Returns SVG width
   */
  function getSVG() {
    const svgElement = document.getElementById('svg');
    if (svgElement == undefined) throw new Error("No Element with id 'svg'");
    return svgElement;
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
      const value = parseFloat(accessor(p).toString());
      if (value > max) max = value;
      if (value < min) min = value;
    });

    return [min, max];
  }

  /**
   * Scales a given value to svg x-domain
   * @param v value to scale
   * @returns svg x coordinate
   */
  function scaleX(v: number) {
    const svgWidth = getSVG().clientWidth;
    const xExtentAbsMax =
      Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1])) * 2;

    return (v / xExtentAbsMax + 0.5) * (svgWidth - 2 * padding) + padding;
  }

  /**
   * Scales a given value to svg y-domain
   * @param v value to scale
   * @returns svg y coordinate
   */
  function scaleY(v: number) {
    const svgHeight = getSVG().clientHeight;
    const yExtentAbsMax =
      Math.max(Math.abs(yExtent[0]), Math.abs(yExtent[1])) * 2;
    return (v / yExtentAbsMax + 0.5) * (svgHeight - 2 * padding) + padding;
  }

  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  const colorMap: Map<string, string> = new Map();
  function getColor(label: string) {
    if (colorMap.has(label)) return colorMap.get(label);
    else {
      colorMap.set(label, colors[colorMap.size]);
      return colors[colorMap.size];
    }
  }
</script>

<div>
  <h2>2D Dimensionality Reduction Demo</h2>
  <div style="padding-left: 150px; padding-right:150px;">
    <svg id="svg" width="100%" height="580px">
      {#await setupData()}
        <p>Loading data</p>
      {:then}
        <!-- "svelte for" over the PointData -->
        {#each data as point}
          <Hexagon
            side={hexaSide}
            x={scaleX(parseFloat(point.x.toString()))}
            y={scaleY(parseFloat(point.y.toString()))}
            image=""
            color={getColor(point.label)}
          />
        {/each}
      {:catch error}
        <p>{error.message}</p>
      {/await}
    </svg>
  </div>
</div>

<style>
  #svg {
    background-color: transparent;
  }
</style>
