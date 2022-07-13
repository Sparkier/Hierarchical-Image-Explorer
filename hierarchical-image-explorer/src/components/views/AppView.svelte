<script lang="ts">
  import BackendService from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  import { onDestroy, onMount } from 'svelte';
  import ImgView from '../minis/ImgView.svelte';
  import ClusterView from '../minis/ClusterView.svelte';
  import { scale } from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import { DEFAULT_SLIDER_VALUE } from '../../config.ts';
  import type { DataHexagon, PointData } from '../../types';
  import Minimap from '../minis/Minimap.svelte';
  import { DEFAULT_NUM_OF_ROWS, DEFAULT_NUM_OF_COLUMNS } from '../../config.ts';
  import { SIZE } from 'vega-lite/build/src/channel';

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

  let xExtent: number[] = [];
  let yExtent: number[] = [];
  let data: PointData[];
  let show = false; // menu state
  let menu: HTMLDivElement | null = null; // menu wrapper DOM reference
  let numHexagonsColumns = DEFAULT_NUM_OF_COLUMNS;
  let numHexagonsRows = DEFAULT_NUM_OF_ROWS;
  let sliderValue = DEFAULT_SLIDER_VALUE;
  let selectedImageID: string;
  let selectedDatagon: null | DataHexagon;
  let selectedImageLabel: string;
  let filteredData;
  let selectedDatagons: DataHexagon[] = [];
  let accTopLeftCorner: DOMPoint;
  let accBottomRightCorner: DOMPoint;
  let accSvgWidth: number;
  let accSvgHeight: number;
  let outerDiv: HTMLElement | undefined;

  const borderWidth = 2;

  $: availableAccHeight =
    outerDiv == undefined
      ? 0
      : window.innerHeight -
        outerDiv.getBoundingClientRect().y -
        2 * borderWidth; // this will be used to limit the height of the accumulator to the screen

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
</script>

<div class="flex items-stretch" bind:this={outerDiv}>
  <!-- Leftbar -->
  <div class="w-1/5 border-r-2 border-y-2 border-slate-200 bg-slate-50">
    <div class={'p-4 overflow-auto'} style="height: {availableAccHeight}px;">
      <div class="w-56">
        <Minimap
          topLeftSvgCorner={accTopLeftCorner}
          bottomRightSvgCorner={accBottomRightCorner}
          svgWidth={accSvgWidth}
          svgHeight={availableAccHeight}
        />
      </div>

      <div class="font-bold text-xl text-left">Settings</div>
      <div class="font-medium text-lg text-left">Visible Rows/Columns</div>
      <div class="font-medium text-left text-lg">
        <input class="rounded-sm w-12" bind:value={numHexagonsColumns} />
        Number of columns
      </div>
      <div class="mt-2 font-medium text-left text-lg">
        <input class="rounded-sm w-12" bind:value={numHexagonsRows} />
        Number of rows
      </div>
      {#if selectedDatagons.reduce((a, b) => a + b.size, 0) <= 1}
        <div class="pt-2 font-medium text-lg text-left">Class filters</div>
        <div class="relative" bind:this={menu}>
          <div>
            <button
              on:click={() => (show = !show)}
              class="menu rounded-sm mt-2 bg-slate-200 focus:outline-none focus:shadow-solid w-1/2 h-10 font-medium text-lg"
            >
              Filter...
            </button>
            {#if show}
              <div
                in:scale={{ duration: 100, start: 0.95 }}
                out:scale={{ duration: 75, start: 0.95 }}
                class="origin-top-right absolute w-1/2 py-2 bg-slate-200
                rounded shadow-md z-10"
              >
                {#if data !== undefined}
                  {#each [...new Set(data
                        .map((d) => d.label)
                        .sort())] as labelName}
                    <div
                      class="block px-4 py-2 hover:bg-hie-red hover:text-white"
                    >
                      {labelName}
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>
        </div>
        <ImgView
          imageID={selectedImageID}
          imageLabel={selectedImageLabel}
          bind:numHexagonsColumns
          bind:numHexagonsRows
        />
        <div class="font-medium text-lg text-left">Image scaling</div>
        <div
          class="max-w-xs"
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
      {:else}
        <div class="font-bold text-xl text-left">Cluster info</div>
        <ClusterView datagons={selectedDatagons} />
      {/if}
    </div>
  </div>
  <!-- Image explorer -->
  <div class="w-4/5 border-y-2 border-slate-200">
    <Accumulator
      data={filteredData}
      rows={numHexagonsRows}
      columns={numHexagonsColumns}
      bind:selectedImageID
      imageScaling={sliderValue}
      maxHeight={availableAccHeight}
      bind:currentSelectionA={selectedDatagons}
      bind:topleftSVGPoint={accTopLeftCorner}
      bind:bottomrightSVGPoint={accBottomRightCorner}
      bind:initialDataWidth={accSvgWidth}
      bind:initialDataHeight={accSvgHeight}
    />
  </div>
</div>
