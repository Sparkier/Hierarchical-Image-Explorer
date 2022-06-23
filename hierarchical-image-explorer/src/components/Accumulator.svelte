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
  export var initial_columns = 50;

  var columns = initial_columns;
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)

  let svgWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;
  let quantizedData: PointData[][][] = [];
  $: hexaSide = svgWidth == undefined ? -1 : svgWidth / (3 * columns);
  const hexaShortDiag = Math.sqrt(3) / 2;
  $: rows = Math.ceil(columns * hexaShortDiag * 4);
  let zoomLevel: number;
  let transform: [number, number];
  let filteredData: PointData[] = [];
  const lodBreakpoint = 10;
  let currentQuantization: DataHexagon[] = [];
  let lowerLevelQuantization: DataHexagon[] = [];
  let higherLevelQuantization: DataHexagon[] = [];

  $: imageWidth = hexaSide;
  $: svgHeight = rows * hexaSide * hexaShortDiag; // Hexagon stacking (rows * Apothem (distance from center to edge (not corner)))
  //$: lodLevel = Math.ceil(zoomLevel ** (1 / 3));
  let lodLevelProperty = 2;
  let currentlod: number;
  let lodIncreasing: boolean = true;
  $: {
    lodIncreasing = lodLevelProperty > currentlod;
    currentlod = lodLevelProperty;
  }
  $: {
    lodLevelProperty;
    loadNextLevel();
    columns = initial_columns * lodLevelProperty;
  }

  $: scaleQuantisedX = (v: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return hexaShortDiag * hexaSide * v;
  };

  onMount(() => {
    BackendService.getQuantization(columns, -100, -100, 100, 100).then((r) => {
      currentQuantization = [];
      currentQuantization = r;
      console.log(r);
    });
    BackendService.getQuantization(columns * 2, -100, -100, 100, 100).then(
      (r) => {
        lowerLevelQuantization = [];
        lowerLevelQuantization = r;
        console.log(r);
      }
    );
    BackendService.getQuantization(columns * 2, -100, -100, 100, 100).then(
      (r) => {
        higherLevelQuantization = [];
        higherLevelQuantization = r;
        console.log(r);
      }
    );
  });

  $: scaleY = new LinearScale([-10, 10], svgHeight, 0);
  $: scaleX = new LinearScale([-10, 10], svgWidth, 0);

  function loadNextLevel() {
    const newQuantPromise = BackendService.getQuantization(
      lodLevelProperty * initial_columns,
      -100,
      -100,
      100,
      100
    );
    if (lodIncreasing) {
      higherLevelQuantization = currentQuantization;
      currentQuantization = [];
      setTimeout(() => {
        currentQuantization = lowerLevelQuantization;
      }, 0);
      newQuantPromise.then((r) => (lowerLevelQuantization = r));
    } else {
      lowerLevelQuantization = currentQuantization;
      currentQuantization = [];
      setTimeout(() => {
        currentQuantization = higherLevelQuantization;
      }, 0);
      newQuantPromise.then((r) => (higherLevelQuantization = r));
    }
  }

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
</script>

<div>
  Filtered image count {filteredData.length} <br />
  Zoom is {zoomLevel} <br />
  Transofrm is {transform} <br />
  Lod Number {lodLevelProperty} columns {columns} Rows {rows} Hexa amount: {currentQuantization.length}<br
  />
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
      const tmp = currentQuantization;
      currentQuantization = [];
      setTimeout(() => {
        currentQuantization = tmp;
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
<<<<<<< HEAD
  <div>
    Filtered image count {filteredData.length} <br />
    Zoom is {zoomLevel} <br />
    Lod Number {lodLevel}
  </div>
=======
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)
  <ZoomSVG
    viewBox="0 0 {svgWidth} {svgHeight}"
    bind:zoomLevel
    bind:transform
    bind:svg
    bind:g
    on:zoomEnd={(event) => console.log(event)}
  >
<<<<<<< HEAD
    {#if hexaSide !== 0}
      <g>
        {#each quantizedData as columnsList, x}
          {#each columnsList as cell, y}
            {#if cell.length > 0}
              <!-- Agrregated hexagons -->
              <Hexagon
                side={hexaSide}
                x={scaleQuantisedX(x, y)}
                y={scaleQuantisedY(y)}
                image={BackendService.getImageUrl(
                  getRepresentantImage(
                    quantizedData[x][y],
                    scaleQuantisedX(x, y),
                    scaleQuantisedY(y)
                  ).id
                )}
                strokeWidth={zoomLevel > lodBreakpoint ? 0.2 : 1}
                stroke={zoomLevel > lodBreakpoint
                  ? ColorUtil.getCellColor(quantizedData[x][y])
                  : 'black'}
              />
            {/if}
          {/each}
        {/each}
      </g>
      {#if zoomLevel > lodBreakpoint}
        <!--insert image details-->
        <g>
          {#each filteredData as point}
=======
    {#if hexaSide != 0 && currentQuantization.length != 0}
      <g>
        {#each currentQuantization as datagon}
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
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)
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
