<script lang="ts">
<<<<<<< HEAD
  import type { PointData } from '../services/backendService';
  import BackendService from '../services/backendService';
=======
  import type { DataHexagon, PointData } from '../services/backendService';
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
<<<<<<< HEAD
  import { LinearScale } from '../services/scaleUtilities';

  export let data: PointData[];
  export let columns = 50;
  export let rows = 80;
  export let imageScaling = 1;

  export const selectedImageID = 'mnist-10';

  const hexaShortDiag = Math.sqrt(3) / 2;
  const lodBreakpoint = 10;
=======
  import { generateScale, LinearScale } from '../services/scaleUtilities';
  import BackendService from '../services/backendService';
  import { init } from 'svelte/internal';

  export let data: PointData[];
  export var initial_columns = 25;

  var columns = initial_columns;
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)

  let svgWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;
<<<<<<< HEAD
  let quantizedData: PointData[][][] = [];
  $: hexaSide = svgWidth == undefined ? -1 : svgWidth / (3 * columns);
=======

  $: hexaSide = svgWidth == undefined ? -1 : svgWidth / (3 * columns + 0.5);
>>>>>>> 00ec86f (feat: further work on hexaggregation)
  const hexaShortDiag = Math.sqrt(3) / 2;
  let rows = 0;
  let zoomLevel: number;
  let transform: [number, number];
  let filteredData: PointData[] = [];
  let currentQuantization: DataHexagon[] = [];
  let currentFilteredQuantization: DataHexagon[] = [];

  let xDomain: [number, number] = [0, 0];
  let yDomain: [number, number] = [0, 0];

  $: imageWidth = hexaSide;
  $: svgHeight = rows * hexaSide * hexaShortDiag + hexaShortDiag * hexaSide; // Hexagon stacking (rows * Apothem (distance from center to edge (not corner)))
  $: lodLevel = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));
  $: {
    getQuantizationData(lodLevel);
  }
  let lodLevelProperty = 2;

  $: scaleQuantisedX = (v: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return hexaShortDiag * hexaSide * v;
  };

  onMount(() => {
    getQuantizationData(1);
  });

  function getQuantizationData(lod: number) {
    BackendService.getQuantization(
      initial_columns * 2 ** lod,
      -100,
      -100,
      100,
      100
    ).then((r) => {
      currentQuantization = [];
      currentQuantization = r.datagons;
      currentFilteredQuantization = r.datagons;
      xDomain = r.xDomain;
      yDomain = r.yDomain;
      rows = r.rows;
      columns = r.columns;
    });
  }

  $: scaleY = new LinearScale(xDomain, svgHeight, 0);
  $: scaleX = new LinearScale(yDomain, svgWidth, 0);

  /**
   * Takes a point in dom coordinate space and maps it to a svg coordinate point
   * @param element svg element
   * @param x coordinate
   * @param y coordinate
   * @param group SVGSVGElement of which to use the transform property
   */
  function svgPoint(
    element: SVGSVGElement,
    x: number,
    y: number,
    group: SVGSVGElement
  ) {
    const pt = element.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const matrix = group.getScreenCTM()?.inverse();
    if (matrix == undefined) throw new Error('Transformation Matrix undefined');
    return pt.matrixTransform(matrix);
  }

  function handleZoomEnd(event: CustomEvent<any>) {
    const svgCbr = svgContainer.getBoundingClientRect();
    const topleftSVGPoint = svgPoint(svg, svgCbr.x, svgCbr.y, g);
    const bottomrightSVGPoint = svgPoint(
      svg,
      svgCbr.x + svgCbr.width,
      svgCbr.y + svgCbr.height,
      g
    );
    // overestimate the inverse of scaleQuantized with a simple grid
    const x1_quantized = Math.floor(topleftSVGPoint.x / (3 * hexaSide)) - 1;
    const y1_quantized =
      Math.floor(topleftSVGPoint.y / (2 * hexaShortDiag * hexaSide)) * 2 - 1;
    const x2_quantized = Math.ceil(bottomrightSVGPoint.x / (3 * hexaSide)) + 1;
    const y2_quantized =
      Math.ceil(bottomrightSVGPoint.y / (2 * hexaShortDiag * hexaSide)) * 2 + 1;
    currentFilteredQuantization = currentQuantization.filter((e) => {
      return (
        e.hexaX >= x1_quantized &&
        e.hexaY >= y1_quantized &&
        e.hexaX <= x2_quantized &&
        e.hexaY <= y2_quantized
      );
    });
  }
</script>

<div>
  Filtered image count {filteredData.length} <br />
  Zoom is {zoomLevel} <br />
  Transofrm is {transform} <br />
  Lod Number {lodLevelProperty} new lod: {lodLevel} columns {columns} Rows {rows}
  Hexa amount: {currentFilteredQuantization.length}<br />
  <div
    class="bg-slate-400 rounded-lg w-32 p-2"
    on:click={() => (lodLevelProperty = lodLevelProperty ** 2)}
  >
    Increase lod
  </div>
  <div
    class="bg-slate-400 rounded-lg w-32 p-2 mt-1"
    on:click={() => (lodLevelProperty = Math.sqrt(lodLevelProperty))}
  >
    Decrease lod
  </div>
  <div
    class="bg-slate-400 rounded-lg w-32 p-2 mt-1"
    on:click={() => {
      const tmp = currentFilteredQuantization;
      currentFilteredQuantization = [];
      setTimeout(() => {
        currentFilteredQuantization = tmp;
      }, 1);
    }}
  >
    redraw
  </div>
</div>
<div
  bind:clientWidth={svgWidth}
  bind:this={svgContainer}
  style="height: {svgHeight}px; background: green"
  class="overflow-hidden"
>
  <div>
    Filtered image count {filteredData.length} <br />
    Zoom is {zoomLevel} <br />
    Lod Number {lodLevel}
  </div>
  <ZoomSVG
    viewBox="0 0 {svgWidth} {svgHeight}"
    bind:zoomLevel
    bind:transform
    bind:svg
    bind:g
    on:zoomEnd={(e) => handleZoomEnd(e)}
  >
    {#if hexaSide != 0 && currentQuantization.length != 0}
      <g>
        {#each currentFilteredQuantization as datagon}
          {#if datagon.containedIDs.length > 1}
            <Hexagon
              side={hexaSide}
              x={scaleQuantisedX(datagon.hexaX, datagon.hexaY)}
              y={scaleQuantisedY(datagon.hexaY)}
              stroke={ColorUtil.getColor(datagon.dominantLabel)}
              strokeWidth={hexaSide / 5}
              image={BackendService.getImageUrl(datagon.representantID)}
            />
          {:else}
            <image
              width={imageWidth}
              height={imageWidth}
              x={scaleQuantisedX(datagon.hexaX, datagon.hexaY) +
                (2 * hexaSide - imageWidth) / 2}
              y={scaleQuantisedY(datagon.hexaY) +
                (2 * hexaShortDiag * hexaSide - imageWidth) / 2}
              href={BackendService.getImageUrl(datagon.representantID)}
              style="image-rendering: pixelated;"
            />
          {/if}
        {/each}
      </g>
    {/if}
  </ZoomSVG>
  <div />
</div>
