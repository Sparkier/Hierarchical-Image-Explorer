<script lang="ts">
  import BackendService from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  import FilterSelector from '../FilterSelector.svelte';
  import { onDestroy, onMount } from 'svelte';
  import ImgView from '../minis/ImgView.svelte';
  import ClusterView from '../minis/ClusterView.svelte';
  import { scale } from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import { DEFAULT_SLIDER_VALUE, DEFAULT_SETTINGS } from '../../config';
  import type { DataHexagon, PointData, SettingsObject } from '../../types';
  import Minimap from '../minis/Minimap.svelte';
  import SidebarSettings from '../minis/SidebarSettings.svelte';
  import * as aq from 'arquero';
  import { TableService } from '../../services/tableService';

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
  let sliderValue = DEFAULT_SLIDER_VALUE;
  let selectedDatagons: Set<DataHexagon> = new Set<DataHexagon>();
  let accTopLeftCorner: DOMPoint;
  let accBottomRightCorner: DOMPoint;
  let accSvgWidth: number;
  let accSvgHeight: number;
  let outerDiv: HTMLElement | undefined;
  let settingsObject: SettingsObject = DEFAULT_SETTINGS;
  let tableIsSet = false;

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
    BackendService.getDataArquero().then((r) => {
      TableService.table = aq.fromJSON(r);
      tableIsSet = true;
    });
  });

  onDestroy(() => {
    document.removeEventListener('click', handleOutsideClick, false);
    document.removeEventListener('keyup', handleEscape, false);
  });
</script>

{#if tableIsSet != false}
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
        initialColumns={settingsObject.columns}
        maxHeight={availableAccHeight}
        bind:currentSelectionA={selectedDatagons}
        bind:topleftSVGPoint={accTopLeftCorner}
        bind:bottomrightSVGPoint={accBottomRightCorner}
        bind:initialDataWidth={accSvgWidth}
        bind:initialDataHeight={accSvgHeight}
      />
    </div>
  </div>
{:else}
  <div class="flex justify-center mt-32">
    <svg
      aria-hidden="true"
      class="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-hie-red"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
    <span class="text-2xl ml-2">Loading data...</span>
  </div>
{/if}
