<script lang="ts">
  import type { SettingsObject } from '../../types';
  export let settingsObject: SettingsObject = { columns: 50 };
  import HieNav from "../HieNav.svelte"; HieNav

  export let isSettingsExpanded:boolean;
</script>

  <!-- Menu container -->
<div class={isSettingsExpanded ? 'transform transition ease-in-out duration-500 translate-y-full' : 'hidden transform transition ease-in-out duration-500 translate-y-0'}>
 <div class="overflow-visible absolute right-0 h-auto bg-gray-100 rounded-b-md">
    <div class="flex flex-col">
    <div class="font-bold text-xl text-left pl-4 pt-2">Settings</div>
    <!-- Menu item -->
    <div class="pt-2 pl-2 w-96 h-16 border-l-2 border-hie-orange mb-2">
      <div class="pt-4 pl-2 items-center">
        <form
          class="flex flex-row"
          on:submit|preventDefault={(e) => {
            const formData = new FormData(e.target);
            const data = {};
            for (let field of formData) {
              const [key, value] = field;
              data[key] = value;
            }
            settingsObject.columns = data.columnsValue;
          }}
        >
          <div class="flex justify-between">
            <div class="text-lg pr-2 ">Number of columns:</div>
            <input
              class="w-16 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2"
              type="number"
              name="columnsValue"
              id="columnsValue"
              value={settingsObject.columns}
            />
            <input
              class="pl-2 text-lg hover:text-hie-red"
              type="submit"
              value="apply"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
 </div>
</div>
