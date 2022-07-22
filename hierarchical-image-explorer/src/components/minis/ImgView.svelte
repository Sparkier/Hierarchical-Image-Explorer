<script lang="ts">
  import BackendService from '../../services/backendService';

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
    alt="select hexagon first"
    class="max-w-max max-h-max"
    src={BackendService.getImageUrl(imageID)}
  />
</div>
