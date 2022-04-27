<script lang="ts">
  import type { PointData } from '../services/backendService';
  import Hexagon from './minis/Hexagon.svelte';
  import { ColorUtil } from '../services/colorUtil';
  import { onMount } from 'svelte';

  export let data: PointData[];
  export let columns = 50;
  export let rows = 80;

  var svgWidth: number;
  var quantisedData: PointData[][][] = [];
  var hexaSide = -1;

  $: scaleQuantisedX = (v: number, row: number) => {
    return svgWidth == undefined
      ? 0
      : v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
  };

  $: scaleQuantisedY = (v: number) => {
    return (Math.sqrt(3) / 2) * hexaSide * v;
  };

  onMount(() => {
    quantisedData = calculateQuantisation(data);
  });

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
    for (var x = 0; x < columns; x++) {
      for (var y = 0; y < rows; y++) {
        const topleftX = scaleQuantisedX(x, y);
        const topleftY = scaleQuantisedY(y);
        const centerX = topleftX + hexaSide;
        const centerY = topleftY + hexaSide * (Math.sqrt(3) / 2);
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
    for (var x = 0; x < columns; x++) {
      quantised.push([]);
      for (var y = 0; y < rows; y++) {
        quantised[x].push([]);
      }
    }

    // check which possible point is closest to datum (modeling hexagons as circles)
    input.forEach((e) => {
      const scaledX = ((e.x + 100) / 200) * svgWidth;
      const scaledY =
        ((e.y + 100) / 200) * rows * hexaSide * (Math.sqrt(3) / 2);

      const distances = possiblePoints.map((p) =>
        Math.sqrt((p.xCoord - scaledX) ** 2 + (p.yCoord - scaledY) ** 2)
      );
      const smallestDistanceIndex = distances.indexOf(Math.min(...distances));
      const nearestPoint = possiblePoints[smallestDistanceIndex];

      quantised[nearestPoint.xQuantised][nearestPoint.yQuantised].push(e);
    });
    return quantised;
  }
</script>

<div bind:clientWidth={svgWidth}>
  <svg class="w-full h-[80vh] mt-10">
    {#if hexaSide != 0}
      {#each quantisedData as columnsList, x}
        {#each columnsList as cell, y}
          {#if cell.length > 0}
            <Hexagon
              side={hexaSide}
              x={scaleQuantisedX(x, y)}
              y={scaleQuantisedY(y)}
              color={ColorUtil.getCellColor(quantisedData[x][y])}
            />
          {/if}
        {/each}
      {/each}
    {/if}
  </svg>
</div>
