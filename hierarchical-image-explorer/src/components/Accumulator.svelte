<script lang="ts">
  import { ArraySet } from '../ArraySet';
  import { DEFAULT_NUM_COLUMNS } from '../config';
  import { quantizationRollup } from '../services/arqueroUtils';
  import BackendService from '../services/backendService';
  import { ColorUtil } from '../services/colorUtil';
  import { TableService } from '../services/tableService';
  import {
    currentQuantization,
    hexagonPropertiesMap,
    selectedColorPalette,
  } from '../stores';
  import type { DerivedHexagon } from '../types';
  import LassoSelectIcon from './icons/LassoSelectIcon.svelte';
  import Hexagon from './minis/Hexagon.svelte';
  import ZoomSVG from './ZoomSVG.svelte';

  export let initialColumns = DEFAULT_NUM_COLUMNS;

  // these two are here to that we can propagate them outside to AppView and pass them down into the minimap.
  export let topleftSVGPoint: DOMPoint;
  export let bottomrightSVGPoint: DOMPoint; // bottom right is actually top right

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
    TableService.updateQuantizationGlobalFiltered(
      initialColumns * 2 ** levelOfDetail
    );
  };

  const hexaShortDiag = Math.sqrt(3) / 2;

  let maxWidth: number = 0;
  let svg: SVGSVGElement;
  let g: SVGSVGElement; // the g tag within the zoomsvg svg
  let svgContainer: HTMLElement; // container div around the svg

  let zoomLevel: number = 1; // level that is updated while you are zooming in
  let hexaSide: number = 0; // not sure whats this is for...

  let svgAvailHeight: number = 0;

  let lodDatagons: DerivedHexagon[] = []; // datagons for for the current LOD
  let culledLodDatagons: DerivedHexagon[] = []; // datagons for the current LOD, but culled away the ones that are not shown

  let toolbarHeight: number; // height of the toolbar. used to compute the svg height/ available space
  let selectionModeOn: boolean = false; // used to track that we are currelty selecting something
  let isASelectionActive: boolean = true;

  let currentDatagonHover: DerivedHexagon | undefined = undefined;

  // recompute lod depending on the zoom level
  $: levelOfDetail = isNaN(zoomLevel) ? 0 : Math.floor(Math.log2(zoomLevel));
  // if the lod level changes -> requantizise
  $: {
    TableService.updateQuantizationGlobalFiltered(
      initialColumns * 2 ** levelOfDetail
    );
  }

  // points used for culling
  $: topleftSVGPoint = svgContainer
    ? screenToSvg(
        svg,
        svgContainer.getBoundingClientRect().x,
        svgContainer.getBoundingClientRect().y,
        g
      )
    : new DOMPoint();

  $: bottomrightSVGPoint = svgContainer
    ? screenToSvg(
        svg,
        svgContainer.getBoundingClientRect().x + maxWidth,
        svgContainer.getBoundingClientRect().y + svgAvailHeight,
        g
      )
    : new DOMPoint();

  // compute culling bounding box (hexagon-space! these are not screen or svg X/Y, but hexagon rows/cols)
  $: cullingBox =
    topleftSVGPoint && bottomrightSVGPoint && hexaSide
      ? {
          top: {
            x: Math.floor(topleftSVGPoint.x / (3 * hexaSide)) - 1,
            y:
              Math.floor(topleftSVGPoint.y / (2 * hexaShortDiag * hexaSide)) *
                2 -
              1,
          },
          bot: {
            x: Math.ceil(bottomrightSVGPoint.x / (3 * hexaSide)) + 1,
            y:
              Math.ceil(
                bottomrightSVGPoint.y / (2 * hexaShortDiag * hexaSide)
              ) *
                2 +
              1,
          },
        }
      : null;

  // cull the datagons, based on the current culling box
  $: culledLodDatagons = lodDatagons.filter(
    (datagon: DerivedHexagon) =>
      datagon.quantization[0] >= cullingBox?.top?.x! &&
      datagon.quantization[1] >= cullingBox?.top?.y! &&
      datagon.quantization[0] <= cullingBox?.bot?.x! &&
      datagon.quantization[1] <= cullingBox?.bot?.y!
  );

  $: scaleQuantisedX = (v: number, row: number): number => {
    if (isNaN(v) || isNaN(row) || maxWidth === undefined) {
      return 0;
    }

    // every other hexagon (3*hexaside) is moved over by half a hexagon (1.5*hexaside) to create the grid
    return v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number): number => {
    if (!v) {
      return 0;
    }
    return hexaShortDiag * hexaSide * v;
  };

  // This is called, once recomputation, based on the current LOD, of datagons (quantization ) is done
  $: if ($currentQuantization) {
    // reset selection
    currentSelectionA = new ArraySet<[number, number]>();
    currentSelectionB = new ArraySet<[number, number]>();

    const lodQuantization = $currentQuantization.datagons;

    const rollup = quantizationRollup(lodQuantization, $hexagonPropertiesMap);
    lodDatagons =
      rollup === undefined ? [] : (rollup.objects() as DerivedHexagon[]);
  }

  $: if ($currentQuantization) {
    const rows = $currentQuantization.rows;
    const columns = $currentQuantization.columns;

    // formula derived from width and height with "virtual" hexaside = 1 and then simplify
    const widthToHeightDataRatio = (2 * columns * Math.sqrt(3)) / (1 + rows);

    if (widthToHeightDataRatio * maxWidth > svgAvailHeight) {
      // image is height limited
      hexaSide = svgAvailHeight / ((rows + 1) * hexaShortDiag);
      initialDataHeight = maxHeight;
      initialDataWidth = widthToHeightDataRatio * maxHeight;

    } else {
      // image is width limited
      hexaSide = maxWidth / (3 * columns + 0.5);
      initialDataHeight = widthToHeightDataRatio * maxHeight;
      initialDataWidth = maxWidth;
    }
  }

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
   * Takes a point in dom coordinate space and maps it to a svg coordinate point
   *
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
   * Goes through all hexagons and checks for intersection with the lasso polygon
   * When intersection is detected the hexagon will be added to the selected list
   */
  function handleLassoSelection() {
    const newlySelectedHexagons = culledLodDatagons.filter((d) => {
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
      color: ColorUtil.getColor(datagon.color, $selectedColorPalette),
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
  bind:clientHeight={svgAvailHeight}
  class="overflow-hidden grow"
>
  <ZoomSVG
    viewBox="0 0 {maxWidth} {svgAvailHeight}"
    bind:zoomLevel
    bind:svg
    bind:g
    {selectionModeOn}
    on:lassoSelectionEnd={() => handleLassoSelection()}
    on:zoomEnd={() => {
      svg = svg; // force to recompute topleft and bottomright
    }}
  >
    {#if culledLodDatagons}
      {#each culledLodDatagons as datagon}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          on:mouseover={() => {
            if (datagon.count > 1) currentDatagonHover = datagon;
          }}
          style={currentSelectionA.size() + currentSelectionB.size() > 0 &&
          !getSelectionInfo(datagon, currentSelectionA, currentSelectionB)
            .isSelected
            ? 'filter: opacity(60%)'
            : ''}
          on:click={() => handleDatagonSelection(datagon.quantization)}
        >
          {#if datagon.count > 1}
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
              strokeWidth={hexaSide / 8}
              image={BackendService.getImageUrl(datagon.representantID)}
            />
          {:else}
            <!-- datagon only contains a single image -> draw that image -->
            <rect
              x={scaleQuantisedX(
                datagon.quantization[0],
                datagon.quantization[1]
              ) +
                hexaSide / 2 -
                hexaSide / 15}
              y={scaleQuantisedY(datagon.quantization[1]) +
                (2 * hexaShortDiag * hexaSide - hexaSide) / 2 -
                hexaSide / 15}
              width={hexaSide + 2 * (hexaSide / 15)}
              height={hexaSide + 2 * (hexaSide / 15)}
              fill="none"
              stroke-width={hexaSide / 15}
              stroke={getSelectionInfo(
                datagon,
                currentSelectionA,
                currentSelectionB
              ).color}
            />
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
            />
          {/if}
        </g>
      {/each}
      <!--Draw a larger hexagon on hover.-->
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
            y={scaleQuantisedY(currentDatagonHover.quantization[1]) - hexaSide}
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
    {/if}
  </ZoomSVG>
</div>
