<script lang="ts">
  import type { PointData } from '../services/backendService';
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';
  import ZoomSVG from './ZoomSVG.svelte';
  import { generateScale, LinearScale } from '../services/scaleUtilities';
  import BackendService from '../services/backendService';

  export let data: PointData[];
  export let columns = 50;
  export let rows = 80;

  let svgWidth: number;
  let svg: SVGSVGElement;
  let g: SVGSVGElement;
  let svgContainer: HTMLElement;

  let quantisedData: PointData[][][] = [];
  let hexaSide = -1;
  const hexaShortDiag = Math.sqrt(3) / 2;
  let extent: number;
  let transform: [number, number];
  let filteredData: PointData[] = [];
  const lodBreakpoint = 10;
  $: imageWidth = hexaSide / 6;
  $: svgHeight = rows * hexaSide * hexaShortDiag;

  $: scaleQuantisedX = (v: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return hexaShortDiag * hexaSide * v;
  };

  onMount(() => {
    quantisedData = calculateQuantisation(data);
  });

  $: scaleY = new LinearScale(
    [-100, 100],
    svgWidth == undefined ? 0 : svgHeight,
    0
  );
  $: scaleX = new LinearScale([-100, 100], svgWidth, 0);

  $: filteredData =
    extent > lodBreakpoint && transform != undefined
      ? filterPointsBoundingRect()
      : [];

  /**
   * Calculate a quantisation of our values, to combine multiple points
   * @param input PointData array containing data points
   * @returns quantised PointData with x and y coordinates and an array of included data points
   */
  function calculateQuantisation(input: PointData[]): PointData[][][] {
    const possiblePoints: {
      xCoord: number;
      xQuantised: number;
      yCoord: number;
      yQuantised: number;
    }[] = [];

    // calculate possible hexagon center points:
    hexaSide = svgWidth / (3 * columns);
    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const topleftX = scaleQuantisedX(x, y);
        const topleftY = scaleQuantisedY(y);
        const centerX = topleftX + hexaSide;
        const centerY = topleftY + hexaSide * hexaShortDiag;
        possiblePoints.push({
          xCoord: centerX,
          xQuantised: x,
          yCoord: centerY,
          yQuantised: y,
        });
      }
    }

    // initialize empty 3d Array
    const quantised: PointData[][][] = [];
    for (let x = 0; x < columns; x++) {
      quantised.push([]);
      for (let y = 0; y < rows; y++) {
        quantised[x].push([]);
      }
    }

    // check which possible point is closest to datum (modeling hexagons as circles)
    input.forEach((e) => {
      const scaledX = ((e.x + 100) / 200) * svgWidth;
      const scaledY = ((e.y + 100) / 200) * rows * hexaSide * hexaShortDiag;

      const distances = possiblePoints.map((p) =>
        Math.sqrt((p.xCoord - scaledX) ** 2 + (p.yCoord - scaledY) ** 2)
      );
      const smallestDistanceIndex = distances.indexOf(Math.min(...distances));
      const nearestPoint = possiblePoints[smallestDistanceIndex];

      quantised[nearestPoint.xQuantised][nearestPoint.yQuantised].push(e);
    });
    return quantised;
  }

  function filterPointsBoundingRect(): PointData[] {
    console.log('Started filtering');
    const rect = svgContainer.getBoundingClientRect();
    const x1_dom = rect.x;
    const x2_dom = rect.x + rect.width;
    const y1_dom = rect.y;
    const y2_dom = rect.y + rect.height;

    const topLeft = svgPoint(svg, x1_dom, y1_dom, g);
    const bottomRight = svgPoint(svg, x2_dom, y2_dom, g);

    const x_1_inv = scaleX.invert(topLeft.x);
    const x_2_inv = scaleX.invert(bottomRight.x);
    const y_1_inv = scaleY.invert(topLeft.y);
    const y_2_inv = scaleY.invert(bottomRight.y);

    const filtered = data.filter(
      (p) => p.x > x_1_inv && p.x < x_2_inv && p.y > y_1_inv && p.y < y_2_inv
    );
    console.log('Filtered ' + filtered.length);
    console.log('Stopped filtering');
    return filtered;
  }

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
    console.log(matrix);
    return pt.matrixTransform(matrix);
  }
</script>

<div
  bind:clientWidth={svgWidth}
  bind:this={svgContainer}
  style="height: {svgHeight}px"
  class="overflow-hidden"
>
  <button on:click={() => (filteredData = filterPointsBoundingRect())}
    >Click for recalculation</button
  >
  <div>
    Ich bringe frohe Kunde: die Anzahl an gefilterten Bildern ist: {filteredData.length}
    Zoom ist {extent}
  </div>
  <ZoomSVG
    viewBox="0 0 {svgWidth} {svgHeight}"
    bind:extent
    bind:transform
    bind:svg
    bind:g
  >
    {#if hexaSide != 0}
      {#each quantisedData as columnsList, x}
        {#each columnsList as cell, y}
          <g />
          {#if cell.length > 0}
            <!-- Agrregated hexagons -->
            <Hexagon
              side={hexaSide}
              x={scaleQuantisedX(x, y)}
              y={scaleQuantisedY(y)}
              color={ColorUtil.getCellColor(quantisedData[x][y])}
              strokeWidth={extent > lodBreakpoint ? 0.2 : 1}
              stroke={extent > lodBreakpoint
                ? ColorUtil.getCellColor(quantisedData[x][y])
                : 'black'}
            />
          {/if}
        {/each}
      {/each}

      {#if extent > lodBreakpoint}
        <!--insert detail hexagons-->
        {#each filteredData as point}
          <image
            width={imageWidth}
            height={imageWidth}
            x={scaleX.scale(point.x) - imageWidth / 2}
            y={scaleY.scale(point.y) - imageWidth / 2}
            href={BackendService.getImageUrl(point.id)}
            preserveAspectRatio="true"
            style="image-rendering: pixelated;"
          />
        {/each}
      {/if}
    {/if}
  </ZoomSVG>
  <div />
</div>
