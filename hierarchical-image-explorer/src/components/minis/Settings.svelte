<script lang="ts">
  import { DEFAULT_SETTINGS } from '../../config';
  import type { SettingsObject } from '../../types';
  import { ShapeType } from '../../types';
  import { fade } from 'svelte/transition';

  export let settingsObject: SettingsObject = DEFAULT_SETTINGS;
  export let isSettingsExpanded: boolean;

  let numCols = settingsObject.columns;
  let shapeType = settingsObject.shapeType;
</script>

<!-- Menu container -->
{#if isSettingsExpanded}
  <div
    class="overflow-visible absolute right-0 h-auto bg-gray-100 rounded-b-md z-50"
    transition:fade
  >
    <div class="flex flex-col">
      <div class="font-bold text-xl text-left pl-4 pt-2">Settings</div>
      <!-- Menu item -->
      <div class="pt-2 pl-2 w-96 border-l-2 border-hie-orange mb-2">
        <div class="gap-4 pl-2 items-center pr-2">
          <form
            class="flex flex-row justify-between"
            style="flex-flow: column"
            on:submit|preventDefault={() => {
              settingsObject.columns = numCols;
              settingsObject.shapeType = shapeType;
            }}
          >
            <div class="">
              <div class="text-lg">Hexagon resolution:</div>
              <input
                class="w-16 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2 ml-auto"
                type="number"
                name="columnsValue"
                id="columnsValue"
                bind:value={numCols}
              />
            </div>

            <div class="">
              <div class="text-lg">Shape Type:</div>

              {#each Object.keys(ShapeType).filter(x => !(parseInt(x) >= 0)) as shape, index}
                <label>
                  <input type=radio bind:group={shapeType} name="shape-types" value={index} /> {shape}
                </label>
              {/each}
            </div>

            <input
              class="pl-2 text-lg hover:text-hie-red"
              type="submit"
              value="apply"
            />
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
