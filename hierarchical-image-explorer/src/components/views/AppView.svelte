<script lang="ts">
  import BackendService from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  import FilterSelector from '../FilterSelector.svelte';
  import { onDestroy, onMount } from 'svelte';
  import ImgView from '../minis/ImgView.svelte';
  import ClusterView from '../minis/ClusterView.svelte';
  import { scale } from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import { DEFAULT_SLIDER_VALUE } from '../../config.ts';
  import type { DataHexagon, PointData, SettingsObject } from '../../types';
  import Minimap from '../minis/Minimap.svelte';
  import { DEFAULT_NUM_OF_ROWS, DEFAULT_NUM_OF_COLUMNS } from '../../config.ts';
  import SidebarSettings from '../minis/SidebarSettings.svelte';

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
  let filteredData;
  let selectedDatagons: Set<DataHexagon> = new Set<DataHexagon>();
  let accTopLeftCorner: DOMPoint;
  let accBottomRightCorner: DOMPoint;
  let accSvgWidth: number;
  let accSvgHeight: number;
  let outerDiv: HTMLElement | undefined;
  let settingsObject: SettingsObject = { columns: 20 };

  const borderWidth = 2;

  $: availableAccHeight =
    outerDiv == undefined
      ? 0
      : window.innerHeight -
        outerDiv.getBoundingClientRect().y -
        2 * borderWidth; // this will be used to limit the height of the accumulator to the screen
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
  <div class="w-96 border-r-2 border-y-2 border-slate-200 bg-slate-50">
    <div class={'p-4 overflow-auto'} style="height: {availableAccHeight}px;">
      <div class="w-56">
        <Minimap
          topLeftSvgCorner={accTopLeftCorner}
          bottomRightSvgCorner={accBottomRightCorner}
          svgWidth={accSvgWidth}
          svgHeight={availableAccHeight}
        />
      </div>
      <SidebarSettings bind:settingsObject />
      {#if selectedDatagons.size == 1 && Array.from(selectedDatagons)[0].size == 1}
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
          imageID={[...selectedDatagons][0].representantID}
          imageLabel={[...selectedDatagons][0].dominantLabel}
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
      {:else if selectedDatagons.size > 0}
        <div class="font-bold text-xl text-left">Cluster info</div>
        <ClusterView datagons={[...selectedDatagons]} />
      {/if}
      <FilterSelector />
    </div>
  </div>
  <!-- Image explorer -->
  <div class="w-4/5 border-y-2 border-slate-200">
    <Accumulator
      initial_columns={settingsObject.columns}
      maxHeight={availableAccHeight}
      bind:currentSelectionA={selectedDatagons}
      bind:topleftSVGPoint={accTopLeftCorner}
      bind:bottomrightSVGPoint={accBottomRightCorner}
      bind:initialDataWidth={accSvgWidth}
      bind:initialDataHeight={accSvgHeight}
    />
  </div>
</div>
