<script lang="ts">
  import { DEFAULT_SETTINGS } from '../../config';
  import { ColorUtil } from '../../services/colorUtil';
  import { TableService } from '../../services/tableService';
  import {
    colorPropertyType,
    hexagonPropertiesMap,
    selectedColorPalette,
  } from '../../stores';

  import type { SettingsObject } from '../../types';
  export let settingsObject: SettingsObject = DEFAULT_SETTINGS;

  export let isSettingsExpanded: boolean;

  let numCols = settingsObject.columns;
  let colorQuery = '';
  let colorPropertyTypeLocal = '';
  let selectedGradient = 'Cinema';

  $: selectedColorPalette.set(selectedGradient);

  hexagonPropertiesMap.subscribe((v) => {
    if (colorQuery == '') colorQuery = v.color;
  });
  colorPropertyType.subscribe((v) => (colorPropertyTypeLocal = v));

  /**
   * Updates the color query and sets the queries type and
   * if necessary calculates the extent of the data
   */
  function updateColorProperty() {
    hexagonPropertiesMap.update((e) => {
      e.color = colorQuery;
      return e;
    });
    // update the type
    const dataType = TableService.getType(colorQuery);
    colorPropertyType.set(dataType);
    if (dataType == 'number') {
      ColorUtil.dataRange = TableService.getQueryExtentQuantized(colorQuery);
    }
  }
</script>

<!-- Menu container -->
<div
  class={isSettingsExpanded
    ? 'transition duration-2000 opacity-100'
    : 'transition duration-2000 opacity-0'}
>
  <div
    class="overflow-visible absolute right-0 h-auto bg-gray-100 rounded-b-md z-50"
  >
    <div class="flex flex-col">
      <div class="font-bold text-xl text-left pl-4 pt-2">Settings</div>
      <!-- Menu item -->
      <div class="pt-2 pl-2 w-96 border-l-2 border-hie-orange mb-2">
        <div class="gap-4 pl-2 items-center pr-2">
          <form
            class="flex flex-row justify-between"
            on:submit|preventDefault={() => {
              settingsObject.columns = numCols;
            }}
          >
            <div class="text-lg pr-2 ">Number of columns:</div>
            <input
              class="w-16 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2 ml-auto"
              type="number"
              name="columnsValue"
              id="columnsValue"
              bind:value={numCols}
            />
            <input
              class="pl-2 text-lg hover:text-hie-red"
              type="submit"
              value="apply"
            />
          </form>
          <form
            class="flex flex-row justify-between mt-4"
            on:submit|preventDefault={() => {
              updateColorProperty();
            }}
          >
            <div class="text-lg pr-2 ">Color query:</div>
            <input
              class="w-48 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2"
              type="text"
              name="colorQuery"
              id="colorQuery"
              bind:value={colorQuery}
            />
            <input
              class="pl-2 text-lg hover:text-hie-red"
              type="submit"
              value="apply"
            />
          </form>
          {#if colorPropertyTypeLocal === 'number'}
            <div class="flex mt-2">
              <div class="mr-4">Color scheme</div>
              <select bind:value={selectedGradient}>
                {#each ColorUtil.gradients as gradient}
                  <option value={gradient.name}>{gradient.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
