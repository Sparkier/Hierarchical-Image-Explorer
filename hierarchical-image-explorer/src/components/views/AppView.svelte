<script lang="ts">
  import BackendService from '../../services/backendService';
  import Accumulator from '../Accumulator.svelte';
  import { getExtent } from '../../services/scaleUtilities';
  import { onDestroy, onMount } from 'svelte';
  import ImgView from '../minis/ImgView.svelte';
  import ClusterView from '../minis/ClusterView.svelte';
  import { scale } from 'svelte/transition';
  import RangeSlider from 'svelte-range-slider-pips';
  import { DEFAULT_SLIDER_VALUE } from '../../config.ts';
  import type { DataHexagon, PointData } from '../../types';
  import Minimap from '../minis/Minimap.svelte';
  import { DEFAULT_NUM_OF_ROWS, DEFAULT_NUM_OF_COLUMNS } from '../../config.ts';

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
  let menu = null; // menu wrapper DOM reference
  let numHexagonsColumns = DEFAULT_NUM_OF_COLUMNS;
  let numHexagonsRows = DEFAULT_NUM_OF_ROWS;
  let sliderValue = DEFAULT_SLIDER_VALUE;
  let selectedImageID;
  let selectedDatagon: null | DataHexagon;
  let selectedImageLabel;
  let filteredData;
  let accTopLeftCorner: DOMPoint;
  let accBottomRightCorner: DOMPoint;
  let accSvgHeight: number;
  let accSvgWidth: number;

  let outerDiv: HTMLElement | undefined;

  $: availableAccHeight =
    outerDiv == undefined
      ? 0
      : window.innerHeight - outerDiv.getBoundingClientRect().y; // this will be used to limit the height of the accumulator to the screen

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

<div class="flex items-stretch" bind:this={outerDiv}>
	<!-- Leftbar -->
	<div class="w-1/5 left-0 border-r-2 border-y-2 border-slate-200 bg-slate-50">
		<div class="p-4">
			<Minimap
				topLeftSvgCorner={accTopLeftCorner}
				bottomRightSvgCorner={accBottomRightCorner}
				svgWidth={accSvgWidth}
				svgHeight={accSvgHeight}
			/>
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
			{#if selectedDatagon == null}
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
				<ClusterView datagon={selectedDatagon} />
			{/if}
		</div>
	</div>
	<!-- Image explorer -->
	<div class="w-4/5 border-y-2 border-slate-200">
		{#await setupData()}
			<p>Loading data</p>
		{:then success}
			<Accumulator
				data={filteredData}
				rows={numHexagonsRows}
				columns={numHexagonsColumns}
				bind:selectedImageID
				imageScaling={sliderValue}
				bind:selectedDatagon
				bind:topleftSVGPoint={accTopLeftCorner}
				bind:bottomrightSVGPoint={accBottomRightCorner}
				bind:svgWidthValue={accSvgWidth}
				bind:svgHeightValue={accSvgHeight}
			/>
		{:catch error}
			<p>{error.message}</p>
		{/await}
	</div>
</div>
