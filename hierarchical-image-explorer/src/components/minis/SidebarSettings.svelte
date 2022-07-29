<script lang="ts">
  import type { SettingsObject } from '../../types';
  export let settingsObject: SettingsObject = { columns: 50 };
  let isExpanded = false;
</script>

<div class="border mt-2 border-gray-200 rounded-md">
  <h2>
    <button
      type="button"
      class="flex items-center justify-between w-full p-5 font-medium text-left text-black hover:bg-gray-100"
      on:click={() => (isExpanded = !isExpanded)}
    >
      <div class="font-bold text-xl text-left">Settings</div>
      <svg
        data-accordion-icon
        class={'w-6 h-6 shrink-0 transition duration-300' +
          (isExpanded ? ' rotate-180 fill-hie-red' : '')}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        /></svg >
    </button>
  </h2>
  <div class={isExpanded ? 'h-16 bg-gray-100 border-l-2 border-hie-orange' : 'max-h-0 overflow-hidden transition-all duration-500'}>
    <div class="flex flex-column pt-4 pl-2 items-center">
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
          <div class="text-lg pr-2 ">Number of columns: </div>
          <input
            class="w-16 rounded-md focus:outline-none focus:border-hie-orange
            focus:ring-hie-orange focus:ring-2 pl-2"
            type="number"
            name="columnsValue"
            id="columnsValue"
            value={settingsObject.columns}
          />
          <input class="pl-2 text-lg hover:text-hie-red" type="submit" value="apply" />
        </div>
      </form>
    </div>
  </div>
</div>
