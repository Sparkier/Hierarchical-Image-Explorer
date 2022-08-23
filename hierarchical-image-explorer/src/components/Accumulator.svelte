<script lang="ts">
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
  import BackendService from '../services/backendService';
  import type {
    DerivedHexagon,
    HexagonPropertiesMap,
    QuantizationResults,
  } from '../types';
  import { DEFAULT_NUM_COLUMNS } from '../config';
  import LassoSelectIcon from './icons/LassoSelectIcon.svelte';
  import { TableService } from '../services/tableService';
  import {
    currentQuantization,
    hexagonPropertiesMap,
    selectedColorPalette,
  } from '../stores';
  import type ColumnTable from 'arquero/dist/types/table/column-table';
  import * as aq from 'arquero';
  import { quantizationRollup } from '../services/arqueroUtils';
  import { ArraySet } from '../ArraySet';
  import type { TableExpr } from 'arquero/dist/types/table/transformable';

  export let initialColumns = DEFAULT_NUM_COLUMNS;
  export let topleftSVGPoint: DOMPoint;
  export let bottomrightSVGPoint: DOMPoint;
  export let currentSelectionA: ArraySet<[number, number]> = new ArraySet<
    [number, number]
  >();
  export let currentSelectionB: ArraySet<[number, number]> = new ArraySet<
    [number, number]
  >();
  export let maxHeight: number;
  export let initialDataHeight: number = 0;
  export let initialDataWidth: number = 0;
  export const updateQuantizationDataExportFunction: () => void = () => {
    requantizeData(levelOfDetail, initialColumns);
  };

  const hexaShortDiag = Math.sqrt(3) / 2;
  const afterInitializationQueue: Function[] = [];

  let maxWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;
  let rows: number = 0;
  let zoomLevel: number = 1;
  let transform: [number, number] = [0, 0];
  let currentQuantizationLocal: ColumnTable;
  let currentCulledQuantization: ColumnTable;
  let toolbarHeight: number;
  let selectionModeOn: boolean = false;
  let hexaSide: number = 0;
  let columns: number = initialColumns;
  let isASelectionActive: boolean = true;
  let isMounted: boolean = false;
  let hexagonPropertiesMapLocal: HexagonPropertiesMap;
  let culledQuantizationObject: DerivedHexagon[] = [];
  let currentDatagonHover: DerivedHexagon | undefined = undefined;
  let selectedColorPaletteLocal: string = '';

  $: svgAvailHeight = maxHeight - (isNaN(toolbarHeight) ? 0 : toolbarHeight);
  $: levelOfDetail = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));
  $: scaleQuantisedX = (v: number, row: number) => {
    return maxWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
    // every other hexagon (3*hexaside) is moved over by half a hexagon (1.5*hexaside) to create the grid
  };
  $: scaleQuantisedY = (v: number) => {
    return hexaShortDiag * hexaSide * v;
  };

  currentQuantization.subscribe((v) => {
    if (v == null) return;
    else {
      onQuantizationChange(v);
    }
  });

  hexagonPropertiesMap.subscribe((v) => {
    hexagonPropertiesMapLocal = v;
    aggregate();
  });

  selectedColorPalette.subscribe((v) => {
    selectedColorPaletteLocal = v;
    aggregate();
  });

  $: {
    if (isMounted) requantizeData(levelOfDetail, initialColumns);
  }
  $: {
    // runs a set of functions once everything is set up (svg is created)
    if (
      afterInitializationQueue.length != 0 &&
      svg != undefined &&
      svgAvailHeight != 0
    ) {
      afterInitializationQueue.forEach((e) => e());
    }
  }
  $: {
    if (svg != undefined && transform != undefined && zoomLevel != undefined) {
      updateScreenBoundaryPoints();
    }
  }

  onMount(() => {
    const getInitialHexagons = () => {
      requantizeData(0, initialColumns);
      isMounted = true;
    };
    afterInitializationQueue.push(getInitialHexagons);
    afterInitializationQueue.push(updateScreenBoundaryPoints);
  });

  /**
   * handles key presses for selection tools
   */
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      currentSelectionA = new ArraySet<[number, number]>();
      currentSelectionB = new ArraySet<[number, number]>();
    }
    if (event.key === 'x') {
      isASelectionActive = !isASelectionActive;
    }
    if (event.key === 'Alt') {
      selectionModeOn = true;
    }
  }

  /**
   * requests a new quantization with rows as an argument
   * @param lod level of detail (whole number)
   * @param initialColumns column amount for lod = 0
   */
  function requantizeData(lod: number, initialColumns: number) {
    TableService.updateQuantizationGlobalFiltered(initialColumns * 2 ** lod);
  }

  /**
   * handles re rendering of newly quantized data
   * @param quantizationResult quantization result
   */
  function onQuantizationChange(quantizationResult: QuantizationResults) {
    currentQuantizationLocal = quantizationResult.datagons;
    rows = quantizationResult.rows;
    columns = quantizationResult.columns;
    currentSelectionA = new ArraySet<[number, number]>();
    currentSelectionB = new ArraySet<[number, number]>();

    const widthToHeightDataRatio = (2 * columns * Math.sqrt(3)) / (1 + rows); // formula derived from width and height with "virtual" hexaside = 1 and then simplify

    if (widthToHeightDataRatio * maxWidth > svgAvailHeight) {
      // image is height limited
      hexaSide = svgAvailHeight / ((rows + 1) * hexaShortDiag);
      if (initialDataHeight == 0) initialDataHeight = maxHeight;
      if (initialDataWidth == 0) {
        initialDataWidth = widthToHeightDataRatio * maxHeight;
      }
    } else {
      // image is width limited
      hexaSide = maxWidth / (3 * columns + 0.5);
      if (initialDataHeight == 0)
        initialDataHeight = widthToHeightDataRatio * maxHeight;
      if (initialDataWidth == 0) initialDataWidth = maxWidth;
    }

    currentCulledQuantization = currentQuantizationLocal;
    applyCulling();
    aggregate();
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

  /**
   * applies culling so only hexagons that are on screen are rendered in the svg
   */
  function applyCulling() {
    // overestimate the inverse of scaleQuantized with a simple grid
    if (topleftSVGPoint != undefined) {
      updateScreenBoundaryPoints();
      const x1_quantized = Math.floor(topleftSVGPoint.x / (3 * hexaSide)) - 1;
      const y1_quantized =
        Math.floor(topleftSVGPoint.y / (2 * hexaShortDiag * hexaSide)) * 2 - 1;
      const x2_quantized =
        Math.ceil(bottomrightSVGPoint.x / (3 * hexaSide)) + 1;
      const y2_quantized =
        Math.ceil(bottomrightSVGPoint.y / (2 * hexaShortDiag * hexaSide)) * 2 +
        1;
      currentCulledQuantization = currentQuantizationLocal.filter(
        <TableExpr>aq.escape((e: { quantization: [number, number] }) => {
          return (
            e.quantization[0] >= x1_quantized &&
            e.quantization[1] >= y1_quantized &&
            e.quantization[0] <= x2_quantized &&
            e.quantization[1] <= y2_quantized
          );
        })
      );
    } else {
      currentCulledQuantization = currentQuantizationLocal;
    }
  }

  /**
   * (re) aggregates the information in the hexagons
   */
  function aggregate() {
    culledQuantizationObject =
      currentCulledQuantization == undefined
        ? []
        : (quantizationRollup(
            currentCulledQuantization,
            hexagonPropertiesMapLocal
          ).objects() as DerivedHexagon[]);
  }

  /**
   *  updates the svg coordinates that mark the viewport
   */
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
    const newlySelectedHexagons = culledQuantizationObject.filter((d) => {
      const svgX = scaleQuantisedX(d.quantization[0], d.quantization[1]);
      const svgY = scaleQuantisedY(d.quantization[1]);
      const svgXCenter = svgX + hexaSide;
      const svgYCenter = svgY + hexaShortDiag * hexaSide;
      const domPoint = svgToScreen(svg, svgXCenter, svgYCenter, g);
      const hitlist = document.elementFromPoint(domPoint.x, domPoint.y);
      if (hitlist == null) return false;
      return hitlist.id == 'lassoPolygon';
    });
    newlySelectedHexagons.forEach((e) =>
      handleDatagonSelection(e.quantization)
    );
    selectionModeOn = false;
  }

  /**
   * handles selection action of a datagon if not selected datagon is selected if selected it is deselected
   * @param datagonCoords array containing coordinates of selected datagon
   */
  function handleDatagonSelection(datagonCoords: [number, number]) {
    if (isASelectionActive) {
      if (currentSelectionA.has(datagonCoords)) {
        currentSelectionA.delete(datagonCoords);
        currentSelectionA = currentSelectionA;
        return;
      }
      if (currentSelectionB.has(datagonCoords)) {
        currentSelectionB.delete(datagonCoords);
        currentSelectionB = currentSelectionB;
      }
      currentSelectionA = currentSelectionA.add(datagonCoords);
    } else {
      // Selection B is active
      if (currentSelectionB.has(datagonCoords)) {
        currentSelectionB.delete(datagonCoords);
        currentSelectionB = currentSelectionB;
        return;
      }
      if (currentSelectionA.has(datagonCoords)) {
        currentSelectionA.delete(datagonCoords);
        currentSelectionA = currentSelectionA;
      }
      currentSelectionB = currentSelectionB.add(datagonCoords);
    }
  }

  /**
   * Helper function for hexagon rendering returns hexagon color and selection status
   * @param datagon datagon in question
   * @param selA set containing coordinates of hexagons in A selection
   * @param selB set containing coordinates of hexagons in B selection
   */
  function getSelectionInfo(
    datagon: DerivedHexagon,
    selA: ArraySet<[number, number]>,
    selB: ArraySet<[number, number]>
  ): {
    color: string;
    isSelected: boolean;
  } {
    if (selA.has(datagon.quantization)) {
      return { color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_A, isSelected: true };
    }
    if (selB.has(datagon.quantization)) {
      return { color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_B, isSelected: true };
    }
    return {
      color: ColorUtil.getColor(datagon.color, selectedColorPaletteLocal),
      isSelected: false,
    };
  }
</script>

<svelte:window on:keyup={handleKeyDown} />
<!-- Toolbar -->
<div class="flex gap-2 px-2" bind:clientHeight={toolbarHeight}>
  <div
    class={`cursor-pointer ${
      selectionModeOn
        ? isASelectionActive
          ? 'bg-selectionA'
          : 'bg-selectionB'
        : 'bg-slate-400'
    } rounded-lg w-12 p-2 mt-1 ml-auto`}
    on:click={() => {
      selectionModeOn = !selectionModeOn;
    }}
  >
    <LassoSelectIcon />
  </div>
  <div
    class={`rounded-lg w-14 p-2 mt-1 text-center cursor-pointer select-none mr-auto ${
      isASelectionActive
        ? `bg-selectionA text-black`
        : `bg-selectionB text-white`
    }`}
    on:click={() => {
      isASelectionActive = !isASelectionActive;
    }}
  >
    A | B
  </div>
</div>
<!-- SVG Space -->
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
    on:zoomEnd={() => {
      applyCulling();
      aggregate();
    }}
    on:lassoSelectionEnd={() => handleLassoSelection()}
  >
    {#if hexaSide !== 0 && culledQuantizationObject.length !== 0}
      <g>
        {#each culledQuantizationObject as datagon}
          <g
            style={currentSelectionA.size() + currentSelectionB.size() > 0 &&
            !getSelectionInfo(datagon, currentSelectionA, currentSelectionB)
              .isSelected
              ? 'filter: opacity(60%)'
              : ''}
          >
            {#if datagon.count > 1}
              <!-- svelte-ignore a11y-mouse-events-have-key-events -->
              <g on:mouseover={() => (currentDatagonHover = datagon)}>
                <Hexagon
                  side={hexaSide}
                  x={scaleQuantisedX(
                    datagon.quantization[0],
                    datagon.quantization[1]
                  )}
                  y={scaleQuantisedY(datagon.quantization[1])}
                  stroke={getSelectionInfo(
                    datagon,
                    currentSelectionA,
                    currentSelectionB
                  ).color}
                  strokeWidth={hexaSide / 5}
                  image={BackendService.getImageUrl(datagon.representantID)}
                  on:click={() => handleDatagonSelection(datagon.quantization)}
                />
              </g>
            {:else}
              {#if getSelectionInfo(datagon, currentSelectionA, currentSelectionB).isSelected}
                <rect
                  x={scaleQuantisedX(
                    datagon.quantization[0],
                    datagon.quantization[1]
                  ) +
                    hexaSide / 2 -
                    hexaSide / 10}
                  y={scaleQuantisedY(datagon.quantization[1]) +
                    (2 * hexaShortDiag * hexaSide - hexaSide) / 2 -
                    hexaSide / 10}
                  width={hexaSide + 2 * (hexaSide / 10)}
                  height={hexaSide + 2 * (hexaSide / 10)}
                  stroke="none"
                  fill={getSelectionInfo(
                    datagon,
                    currentSelectionA,
                    currentSelectionB
                  ).color}
                />
              {/if}
              <image
                width={hexaSide}
                height={hexaSide}
                x={scaleQuantisedX(
                  datagon.quantization[0],
                  datagon.quantization[1]
                ) +
                  (2 * hexaSide - hexaSide) / 2}
                y={scaleQuantisedY(datagon.quantization[1]) +
                  (2 * hexaShortDiag * hexaSide - hexaSide) / 2}
                href={BackendService.getImageUrl(datagon.representantID)}
                style={'image-rendering: pixelated;'}
                on:click={() => handleDatagonSelection(datagon.quantization)}
              />
            {/if}
          </g>
        {/each}
        {#if !selectionModeOn && currentDatagonHover !== undefined}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <g
            on:click={() => {
              if (currentDatagonHover === undefined) return;
              handleDatagonSelection(currentDatagonHover.quantization);
            }}
            on:mouseout={() => {
              currentDatagonHover = undefined;
            }}
          >
            <Hexagon
              side={hexaSide * 2}
              x={scaleQuantisedX(
                currentDatagonHover.quantization[0],
                currentDatagonHover.quantization[1]
              ) - hexaSide}
              y={scaleQuantisedY(currentDatagonHover.quantization[1]) -
                hexaSide}
              stroke={getSelectionInfo(
                currentDatagonHover,
                currentSelectionA,
                currentSelectionB
              ).color}
              strokeWidth={hexaSide / 5}
              image={BackendService.getImageUrl(
                currentDatagonHover.representantID
              )}
            />
          </g>
        {/if}
      </g>
    {/if}
  </ZoomSVG>
</div>
