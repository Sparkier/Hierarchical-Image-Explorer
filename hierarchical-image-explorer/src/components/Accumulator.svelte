<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
  import BackendService from '../services/backendService';
  import type { DataHexagon, PointData } from '../types';
  import { DEFAULT_NUM_COLUMNS } from '../config';
  import LassoSelectIcon from './icons/LassoSelectIcon.svelte';

  export let initialColumns = DEFAULT_NUM_COLUMNS;
  export let topleftSVGPoint: DOMPoint;
  export let bottomrightSVGPoint: DOMPoint;
  export let currentSelectionA: Set<DataHexagon> = new Set<DataHexagon>();
  export let currentSelectionB: Set<DataHexagon> = new Set<DataHexagon>();
  export let maxHeight: number;
  export let initialDataHeight: number = 0;
  export let initialDataWidth: number = 0;

  const hexaShortDiag = Math.sqrt(3) / 2;

  let maxWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;
  let rows = 0;
  let zoomLevel: number;
  let transform: [number, number];
  let currentQuantization: DataHexagon[] = [];
  let currentFilteredQuantization: DataHexagon[] = [];
  let toolbarHeight: number;
  let selectionModeOn = false;
  let hexaSide: number = 0;
  let columns = initialColumns;
  let isASelectionActive = true;

  $: svgAvailHeight = maxHeight - (isNaN(toolbarHeight) ? 0 : toolbarHeight);
  $: imageWidth = hexaSide;
  $: levelOfDetail = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));

  $: {
    getQuantizationData(levelOfDetail, initialColumns);
  }

  $: scaleQuantisedX = (v: number, row: number) => {
    return maxWidth == undefined
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
    getQuantizationData(0, initialColumns, true);
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      currentSelectionA = new Set<DataHexagon>();
      currentSelectionB = new Set<DataHexagon>();
    }
    if (event.key === 'x') {
      isASelectionActive = !isASelectionActive;
    }
    if (event.key === 'Shift') {
      selectionModeOn = true;
    }
  }

  function getQuantizationData(lod: number, initialColumns:number, initliaCall = false) {
    BackendService.getDataQuantized(initialColumns * 2 ** lod).then((r) => {
      currentQuantization = [];
      currentQuantization = r.datagons;
      rows = r.rows;
      columns = r.columns;
      currentSelectionA = new Set<DataHexagon>();
      currentSelectionB = new Set<DataHexagon>();

      const widthToHeightDataRatio = (2 * columns * Math.sqrt(3)) / (1 + rows); // formula derived from width and height with "virtual" hexaside = 1 and then simplify
      if (widthToHeightDataRatio * maxHeight > svgAvailHeight) {
        // image is height limited
        hexaSide = svgAvailHeight / ((rows + 1) * hexaShortDiag);
        if (initialDataHeight == 0) initialDataHeight = maxHeight;
        if (initialDataWidth == 0)
          initialDataWidth = widthToHeightDataRatio * maxHeight;
      } else {
        // image is width limited
        hexaSide = maxWidth / (3 * columns + 0.5);
        if (initialDataHeight == 0)
          initialDataHeight = widthToHeightDataRatio * maxHeight;
        if (initialDataWidth == 0) initialDataWidth = maxWidth;
      }
      if (initliaCall) {
        currentFilteredQuantization = currentQuantization;
      } else applyCulling();
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

  function applyCulling() {
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
    newlySelectedHexagons.forEach((e) => handleDatagonSelection(e));
    selectionModeOn = false;
  }

  function handleDatagonSelection(datagon: DataHexagon) {
    if (isASelectionActive) {
      if (currentSelectionA.has(datagon)) {
        currentSelectionA.delete(datagon);
        currentSelectionA = currentSelectionA;
        return;
      }
      if (currentSelectionB.has(datagon)) {
        currentSelectionB.delete(datagon);
        currentSelectionB = currentSelectionB;
      }
      currentSelectionA = currentSelectionA.add(datagon);
    } else {
      // Selection B is active
      if (currentSelectionB.has(datagon)) {
        currentSelectionB.delete(datagon);
        currentSelectionB = currentSelectionB;
        return;
      }
      if (currentSelectionA.has(datagon)) {
        currentSelectionA.delete(datagon);
        currentSelectionA = currentSelectionA;
      }
      currentSelectionB = currentSelectionB.add(datagon);
    }
  }

  function getSelectionInfo(
    datagon: DataHexagon,
    selA: Set<DataHexagon>,
    selB: Set<DataHexagon>
  ): {
    color: string;
    isSelected: boolean;
  } {
    if (selA.has(datagon)) {
      return { color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_A, isSelected: true };
    }
    if (selB.has(datagon)) {
      return { color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_B, isSelected: true };
    }
    return {
      color: ColorUtil.getColor(datagon.dominantLabel),
      isSelected: false,
    };
  }
</script>

<svelte:window on:keyup={handleKeyDown} />

<div class="flex gap-2 px-2" bind:clientHeight={toolbarHeight}>
  <div
    class={`cursor-pointer ${
      selectionModeOn
        ? isASelectionActive
          ? 'bg-selection-yellow'
          : 'bg-selection-pink'
        : 'bg-slate-400'
    } rounded-lg w-12 p-2 mt-1`}
    on:click={() => {
      selectionModeOn = !selectionModeOn;
    }}
  >
    <LassoSelectIcon />
  </div>
  <div
    class={`rounded-lg w-14 p-2 mt-1 text-center cursor-pointer select-none ${
      isASelectionActive
        ? `bg-selection-yellow text-black`
        : `bg-selection-pink text-white`
    }`}
    on:click={() => {
      isASelectionActive = !isASelectionActive;
    }}
  >
    A | B
  </div>
</div>
<div
  bind:clientWidth={maxWidth}
  bind:this={svgContainer}
  style="height: {svgAvailHeight}px;"
  class="overflow-hidden"
>
  <ZoomSVG
    viewBox="0 0 {maxWidth} {svgAvailHeight}"
    bind:zoomLevel
    bind:transform
    bind:svg
    bind:g
    {selectionModeOn}
    on:zoomEnd={() => applyCulling()}
    on:lassoSelectionEnd={() => handleLassoSelection()}
  >
    {#if hexaSide != 0 && currentQuantization.length != 0}
      <g>
        {#each currentFilteredQuantization as datagon}
          <g
            style={currentSelectionA.size + currentSelectionB.size > 0 &&
            !getSelectionInfo(datagon, currentSelectionA, currentSelectionB)
              .isSelected
              ? 'filter: opacity(60%)'
              : ''}
          >
            {#if datagon.size > 1}
              <Hexagon
                side={hexaSide}
                x={scaleQuantisedX(datagon.hexaX, datagon.hexaY)}
                y={scaleQuantisedY(datagon.hexaY)}
                stroke={getSelectionInfo(
                  datagon,
                  currentSelectionA,
                  currentSelectionB
                ).color}
                strokeWidth={hexaSide / 5}
                image={BackendService.getImageUrl(datagon.representantID)}
                on:click={() => handleDatagonSelection(datagon)}
              />
            {:else}
              {#if getSelectionInfo(datagon, currentSelectionA, currentSelectionB).isSelected}
                <rect
                  x={scaleQuantisedX(datagon.hexaX, datagon.hexaY) +
                    (2 * hexaSide - imageWidth) / 2 -
                    hexaSide / 10}
                  y={scaleQuantisedY(datagon.hexaY) +
                    (2 * hexaShortDiag * hexaSide - imageWidth) / 2 -
                    hexaSide / 10}
                  width={imageWidth + 2 * (hexaSide / 10)}
                  height={imageWidth + 2 * (hexaSide / 10)}
                  stroke="none"
                  fill={getSelectionInfo(
                    datagon,
                    currentSelectionA,
                    currentSelectionB
                  ).color}
                />
              {/if}
              <image
                width={imageWidth}
                height={imageWidth}
                x={scaleQuantisedX(datagon.hexaX, datagon.hexaY) +
                  (2 * hexaSide - imageWidth) / 2}
                y={scaleQuantisedY(datagon.hexaY) +
                  (2 * hexaShortDiag * hexaSide - imageWidth) / 2}
                href={BackendService.getImageUrl(datagon.representantID)}
                style={'image-rendering: pixelated;'}
                on:click={() => handleDatagonSelection(datagon)}
              />
            {/if}
          </g>
        {/each}
      </g>
    {/if}
  </ZoomSVG>
  <div />
</div>
