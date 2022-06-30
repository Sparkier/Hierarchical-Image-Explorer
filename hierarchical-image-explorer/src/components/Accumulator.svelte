<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
  import BackendService from '../services/backendService';
  import type { DataHexagon, PointData } from '../types';

  export var initial_columns = 20;
  export var selectedImageID = '';
  export var selectedDatagon: null | DataHexagon = null;
  export var topleftSVGPoint: DOMPoint;
  export var bottomrightSVGPoint: DOMPoint;
  export var svgWidthValue: number;
  export var svgHeightValue: number;

  const hexaShortDiag = Math.sqrt(3) / 2;

  let svgWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;
  let rows = 0;
  let zoomLevel: number;
  let transform: [number, number];
  let filteredData: PointData[] = [];
  let currentQuantization: DataHexagon[] = [];
  let currentFilteredQuantization: DataHexagon[] = [];
  let lodLevelProperty = 2;

  var columns = initial_columns;

  $: hexaSide = svgWidth == undefined ? -1 : svgWidth / (3 * columns + 0.5);
  $: imageWidth = hexaSide;
  $: svgHeight = rows * hexaSide * hexaShortDiag + hexaShortDiag * hexaSide; // Hexagon stacking (rows * Apothem (distance from center to edge (not corner)))
  $: svgHeightValue = svgHeight;
  $: svgWidthValue = svgWidth;
  $: lodLevel = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));

  $: {
    getQuantizationData(lodLevel);
  }

  $: scaleQuantisedX = (v: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return hexaShortDiag * hexaSide * v;
  };

  $: {
    if (svg != undefined && transform != undefined && zoomLevel != undefined) {
      updateScreenBoundaryPoints();
    }
  }

  onMount(() => {
    getQuantizationData(1);
  });

  function getQuantizationData(lod: number) {
    BackendService.getQuantization(initial_columns * 2 ** lod).then((r) => {
      currentQuantization = [];
      currentQuantization = r.datagons;
      currentFilteredQuantization = r.datagons;
      rows = r.rows;
      columns = r.columns;
    });
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

  function handleZoomEnd(event: CustomEvent<any>) {
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

  function updateScreenBoundaryPoints() {
    const svgCbr = svgContainer.getBoundingClientRect();
    topleftSVGPoint = svgPoint(svg, svgCbr.x, svgCbr.y, g);
    bottomrightSVGPoint = svgPoint(
      svg,
      svgCbr.x + svgCbr.width,
      svgCbr.y + svgCbr.height,
      g
    );
  }
</script>

<div>
  Filtered image count {filteredData.length} <br />
  Zoom is {zoomLevel} <br />
  Transofrm is {transform} <br />
  Lod Number {lodLevelProperty} new lod: {lodLevel} columns {columns} Rows {rows}
  Hexa amount: {currentFilteredQuantization.length}<br />
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
  style="height: {svgHeight}px;"
  class="overflow-hidden"
>
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
              on:click={() => {
                selectedImageID = '';
                selectedDatagon = datagon;
              }}
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
              on:click={() => {
                selectedImageID = datagon.representantID;
                selectedDatagon = null;
              }}
            />
          {/if}
        {/each}
      </g>
    {/if}
  </ZoomSVG>
  <div />
</div>
