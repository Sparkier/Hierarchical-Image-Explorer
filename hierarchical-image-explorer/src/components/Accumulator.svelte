<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
  import BackendService from '../services/backendService';
  import type { DataHexagon, PointData } from '../types';
  import LassoSelectIcon from './icons/LassoSelectIcon.svelte';

  export let initial_columns = 20;
  export let selectedImageID = '';
  export let selectedDatagon: null | DataHexagon = null;
  export let topleftSVGPoint: DOMPoint;
  export let bottomrightSVGPoint: DOMPoint;
  export let svgWidthValue: number;
  export let svgHeightValue: number;

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
  let currentSelection: DataHexagon[] = [];
  let lodLevelProperty = 2;
  let selectionModeOn = false;

  var columns = initial_columns;

  $: hexaSide = svgWidth == undefined ? -1 : svgWidth / (3 * columns + 0.5);
  $: imageWidth = hexaSide;
  $: svgHeight = rows * hexaSide * hexaShortDiag + hexaShortDiag * hexaSide; // Hexagon stacking (rows * Apothem (distance from center to edge (not corner)))
  $: svgHeightValue = svgHeight;
  $: svgWidthValue = svgWidth;
  $: levelOfDetail = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));

  $: {
    getQuantizationData(levelOfDetail);
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
    getQuantizationData(0);
  });

  function getQuantizationData(lod: number) {
    BackendService.getDataQuantized(initial_columns * 2 ** lod).then((r) => {
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
   * @param screenX coordinate
   * @param screenY coordinate
   * @param group SVGSVGElement of which to use the transform property
   */
  function screenToSvg(
    element: SVGSVGElement,
    screenX: number,
    screenY: number,
    group: SVGSVGElement
  ) {
    const pt = element.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    const matrix = group.getScreenCTM()?.inverse();
    if (matrix == undefined) throw new Error('Transformation Matrix undefined');
    return pt.matrixTransform(matrix);
  }

  /**
   * Takes in a point in svg space and converts it to dom (page relative)
   * @param element svg element
   * @param svgX coordinate
   * @param svgY coordinate
   * @param group SVGSVGElement of which to use the transform property
   */
  function svgToScreen(
    element: SVGSVGElement,
    svgX: number,
    svgY: number,
    group: SVGSVGElement
  ) {
    const pt = svg.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const matrix = group.getScreenCTM();
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
    topleftSVGPoint = screenToSvg(svg, svgCbr.x, svgCbr.y, g);
    bottomrightSVGPoint = screenToSvg(
      svg,
      svgCbr.x + svgCbr.width,
      svgCbr.y + svgCbr.height,
      g
    );
  }

  /**
   * Goes through all hexagons and checks for intersection with the lasso polygon
   * When intersection is detected the hexagon will be added to the selected list
   */
  function handleLassoSelection() {
    const newlySelectedHexagons = currentFilteredQuantization.filter((d) => {
      const svgX = scaleQuantisedX(d.hexaX, d.hexaY);
      const svgY = scaleQuantisedY(d.hexaY);
      const svgXCenter = svgX + hexaSide;
      const svgYCenter = svgY + hexaShortDiag * hexaSide;
      const domPoint = svgToScreen(svg, svgXCenter, svgYCenter, g);
      const hitlist = document.elementFromPoint(domPoint.x, domPoint.y);
      if (hitlist == null) return false;
      if (hitlist.id == 'lassoPolygon') return true;
      return false;
    });
    currentSelection = [...currentSelection, ...newlySelectedHexagons];
    selectionModeOn = false;
  }
</script>

<div class="flex gap-2">
  <div
    class={`${
      selectionModeOn ? 'bg-lime-400' : 'bg-slate-400'
    } rounded-lg w-12 p-2 mt-1`}
    on:click={() => {
      selectionModeOn = !selectionModeOn;
    }}
  >
    <LassoSelectIcon />
  </div>
  <div
    class="bg-slate-400 rounded-lg w-40 p-2 mt-1"
    on:click={() => {
      currentSelection = [];
    }}
  >
    Reset selection
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
    {selectionModeOn}
    on:zoomEnd={(e) => handleZoomEnd(e)}
    on:lassoSelectionEnd={() => handleLassoSelection()}
  >
    {#if hexaSide != 0 && currentQuantization.length != 0}
      <g>
        {#each currentFilteredQuantization as datagon}
          {#if datagon.size > 1}
            <Hexagon
              side={hexaSide}
              x={scaleQuantisedX(datagon.hexaX, datagon.hexaY)}
              y={scaleQuantisedY(datagon.hexaY)}
              stroke={currentSelection.includes(datagon)
                ? ColorUtil.SELECTION_HIGHLIGHT_COLOR
                : ColorUtil.getColor(datagon.dominantLabel)}
              strokeWidth={hexaSide / 5}
              image={BackendService.getImageUrl(datagon.representantID)}
              on:click={() => {
                selectedImageID = '';
                currentSelection = [...currentSelection, datagon];
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
