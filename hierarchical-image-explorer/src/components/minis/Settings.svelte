<script lang="ts">
  import { DEFAULT_SETTINGS } from '../../config';
  import type { SettingsObject } from '../../types';

  export let settingsObject: SettingsObject = DEFAULT_SETTINGS;
  export let isSettingsExpanded: boolean;

  let numCols = settingsObject.columns;
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
            <div class="text-lg pr-2 ">Hexagon resolution:</div>
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
        </div>
      </div>
    </div>
  </div>
</div>
