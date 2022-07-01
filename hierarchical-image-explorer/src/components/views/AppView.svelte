<script lang="ts">
  import BackendService from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  //import { getExtent } from '../../services/scaleUtilities';
  import { onDestroy, onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import {
    DEFAULT_NUM_OF_ROWS,
    DEFAULT_NUM_OF_COLUMNS,
    DEFAULT_SLIDER_VALUE,
  } from '../../config.ts';
  import type { PointData } from '../../types';
  import Minimap from '../minis/Minimap.svelte';

  const handleOutsideClick = (event) => {
    if (show && !menu.contains(event.target)) {
      show = false;
    }
  };

  const handleEscape = (event) => {
    if (show && event.key === 'Escape') {
      show = false;
    }
  };

  let svgElement: SVGSVGElement;
  let svgWidth: number;
  let xExtent: number[] = [];
  let yExtent: number[] = [];
  let data: PointData[];
  let show = false; // menu state
  let menu = null; // menu wrapper DOM reference
  let numHexagonsColumns = DEFAULT_NUM_OF_COLUMNS;
  let numHexagonsRows = DEFAULT_NUM_OF_ROWS;
  let sliderValue = DEFAULT_SLIDER_VALUE;
  let selectedImageID: string;
  let selectedImageLabel = '';
  let filteredData;

  let accTopLeftCorner: DOMPoint;
  let accBottomRightCorner: DOMPoint;
  let accSvgHeight: number;
  let accSvgWidth: number;

  $: {
    if (selectedImageID != undefined && selectedImageID != '')
      BackendService.getDataAnnotations(selectedImageID).then(
        (r) => (selectedImageLabel = r.label)
      );
  }

  onMount(() => {
    document.addEventListener('click', handleOutsideClick, false);
    document.addEventListener('keyup', handleEscape, false);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleOutsideClick, false);
    document.removeEventListener('keyup', handleEscape, false);
  });

  //async function setupData() {
  //  try {
  //    filteredData = await BackendService.get2DAll();
  //    data = filteredData;
  //    xExtent = getExtent((p: PointData) => p.x, data);
  //    yExtent = getExtent((p: PointData) => p.y, data);
  //  } catch (e) {
  //    console.error(e);
  //    alert(e);
  //  }
  //}

  // function filterData(label: string) {
  //   filteredData = data.filter((d) => d.label == label);
  // }
</script>

<div class="">
  <div class="px-24 flex pt-8">
    <div class="w-1/5 bg-slate-100 rounded-md mr-4 shadow-sm">
      <div class="p-4">
        <Minimap
          topLeftSvgCorner={accTopLeftCorner}
          bottomRightSvgCorner={accBottomRightCorner}
          svgWidth={accSvgWidth}
          svgHeight={accSvgHeight}
        />
      </div>

      <div class="pl-4 font-bold text-xl text-left">Settings</div>
      <div class="pl-4 pt-4 font-medium text-lg text-left">Class filters</div>
      <div class="relative" bind:this={menu}>
        <div>
          <button
            on:click={() => (show = !show)}
            class="menu  rounded-sm ml-4 mt-2 bg-slate-200 focus:outline-none focus:shadow-solid w-32 h-10 font-medium text-lg"
          >
            Filter...
          </button>
          {#if show}
            <div
              in:scale={{ duration: 100, start: 0.95 }}
              out:scale={{ duration: 75, start: 0.95 }}
              class="origin-top-right absolute right-0 w-48 py-2 bg-slate-200
          rounded shadow-md z-10"
            >
              {#if data !== undefined}
                {#each [...new Set(data
                      .map((d) => d.label)
                      .sort())] as labelName}
                  <div
                    class="block px-4 py-2 hover:bg-hie-red hover:text-white"
                    on:click={filterData(labelName)}
                  >
                    {labelName}
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </div>
      <div class="pl-4 pt-4 font-medium text-lg text-left">
        Visible Rows/Columns
      </div>
      <div class="ml-4 font-medium text-left text-lg">
        <input class="rounded-sm w-12" bind:value={numHexagonsColumns} />
        Number of columns
      </div>
      <div class="mt-2 ml-4 font-medium text-left text-lg">
        <input class="rounded-sm w-12" bind:value={numHexagonsRows} />
        Number of rows
      </div>
      <div class="pl-4 pt-4 font-medium text-lg text-left">Image scaling</div>
      <div
        style="--range-range: #d87472; --range-float: #d87472; --range-handle-focus:#d87472;  --range-handle:#f7bca6"
      >
        <RangeSlider
          class=""
          min={0.1}
          max={5}
          step={0.1}
          bind:values={sliderValue}
          range="min"
          float
        />
      </div>
      <div class="pl-4 pt-4 font-bold text-xl text-left">Image Details</div>
      <div class="pl-4 pt-4 font-medium text-lg text-left flex">
        Image ID:
        <div class="pl-2 text-slate-400">
          {selectedImageID}
        </div>
      </div>
      <div class="pl-4 pt-2 font-medium text-lg text-left flex">
        Image Label:
        <div class="pl-2 text-slate-400">
          {selectedImageLabel}
        </div>
      </div>
      <img
        alt="selected"
        class="ml-4 mt-2 mb-2 w-32 h-32"
        src={BackendService.getImageUrl(selectedImageID)}
      />
    </div>
    <div class="w-4/5" bind:clientWidth={svgWidth}>
      <!-- {#await setupData()}
        <p>Loading data</p>
      {:then success} -->
      <Accumulator
        rows={numHexagonsRows}
        columns={numHexagonsColumns}
        bind:selectedImageID
        imageScaling={sliderValue}
        bind:topleftSVGPoint={accTopLeftCorner}
        bind:bottomrightSVGPoint={accBottomRightCorner}
        bind:svgWidthValue={accSvgWidth}
        bind:svgHeightValue={accSvgHeight}
      />
      <!-- Under the data-->
      <!-- {:catch error}
        <p>{error.message}</p>
      {/await} -->
    </div>
  </div>
</div>
