<script lang="ts">
  import BackendService, { PointData } from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  import { getExtent } from '../../services/scaleUtilities';
  import {onDestroy, onMount} from 'svelte';
  import ImgView from "../minis/ImgView.svelte";
  import ClusterView from "../minis/ClusterView.svelte";
  import {scale} from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import {DEFAULT_SLIDER_VALUE} from "../../config";
  import type {DataHexagon, PointData} from "../../types";
  import BackendService from "../../services/backendService";

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

 const selectedDatagon: { labelDistribution: {label:string, amount:number}[], size: number; representantID: string; hexaY: number; hexaX: number; dominantLabel: string } = { // for demo only will be replaced with actual selection
   hexaX: 2,
   hexaY: 3,
   size: 12,
   dominantLabel: "0",
   representantID: "mnist-10",
   labelDistribution: [{label: "0", amount: 5}, {label: "8", amount: 3}, {label: "6", amount: 2}, {label: "9", amount: 2}, {label: "2", amount: 5}, {label: "1", amount: 3}, {label: "3", amount: 2}, {label: "8", amount: 2}]
 }
  //let selectedDatagon: DataHexagon|null = null

  let svgElement: SVGSVGElement;
  let svgWidth: number;
  let svgHeight: number;
  let xExtent: number[] = [];
  let yExtent: number[] = [];
  let data: PointData[];
  let show = false; // menu state
  let menu = null; // menu wrapper DOM reference
  let numHexagonsColumns;
  let numHexagonsRows;
  let sliderValue = DEFAULT_SLIDER_VALUE;
  let selectedImageID;
  let selectedImageLabel;
  let filteredData;
  let clusterView = false;

  $: {
    if (selectedImageID != undefined && selectedImageID != '')
      BackendService.getSWGInfo(selectedImageID).then(
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

  async function setupData() {
    try {
      filteredData = await BackendService.getAllDataPoints();
      data = filteredData;
      xExtent = getExtent((p: PointData) => p.x, data);
      yExtent = getExtent((p: PointData) => p.y, data);
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }

  function filterData(label: string) {
    filteredData = data.filter((d) => d.label == label);
  }

</script>

<div class="flex items-stretch">
  <!-- Leftbar -->
  <div class="w-1/5 left-0 border-r-2 border-y-2 border-slate-200 bg-slate-50">
    {#if clusterView}
    <div class="pl-4 font-bold text-xl text-left">Settings</div>
    <div class="pl-4 pt-4 font-medium text-lg text-left">Class filters</div>
    <div class="relative" bind:this={menu}>
      <div>
        <button
            on:click={() => (show = !show)}
            class="menu rounded-sm ml-4 mt-2 bg-slate-200 focus:outline-none focus:shadow-solid w-1/2 h-10 font-medium text-lg"
        >
          Filter...
        </button>
        {#if show}
          <div
              in:scale={{ duration: 100, start: 0.95 }}
              out:scale={{ duration: 75, start: 0.95 }}
              class="origin-top-right absolute w-1/2 py-2 bg-slate-200 ml-4
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
    <ImgView imageID={selectedImageID} imageLabel={selectedImageLabel} bind:numHexagonsColumns bind:numHexagonsRows/>
    <div class="pl-4 pt-4 font-medium text-lg text-left">Image scaling</div>
    <div class="max-w-xs"
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
      <div class="pl-4 font-bold text-xl text-left">Cluster info</div>
      <ClusterView datagon={selectedDatagon}/>
    {/if}
  </div>
  <!-- Image explorer -->
  <div class="w-4/5 border-y-2 border-slate-200" bind:clientWidth={svgWidth} bind:clientHeight={svgHeight}>
    {#await setupData()}
      <p>Loading data</p>
    {:then success}
      <Accumulator
          data={filteredData}
          rows={numHexagonsRows}
          columns={numHexagonsColumns}
          bind:selectedImageID
          imageScaling={sliderValue}
      />
    {:catch error}
      <p>{error.message}</p>
    {/await}
  </div>
</div>
