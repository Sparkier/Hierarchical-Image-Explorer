<script lang="ts">
  import BackendService from '../../services/backendService';
  import {DEFAULT_NUM_OF_ROWS, DEFAULT_NUM_OF_COLUMNS} from '../../config.ts';

  export let numHexagonsColumns = DEFAULT_NUM_OF_COLUMNS;
  export let numHexagonsRows = DEFAULT_NUM_OF_ROWS;
  export let imageID;
  export let imageLabel;

</script>
	<div class="font-bold text-xl text-left">Image Details</div>
	<div class="font-medium text-lg text-left flex">
		Image ID:
		<div class="pl-2 text-slate-400">
			{imageID}
		</div>
	</div>
	<div class="font-medium text-lg text-left flex">
		Image Label:
		<div class="pl-2 text-slate-400">
			{imageLabel}
		</div>
	</div>
<div class="pt-2 pb-2 flex justify-center">
	<img
			alt="select image first"
			class="w-32 h-32"
			src={BackendService.getImageUrl(imageID)}
	/>
</div>