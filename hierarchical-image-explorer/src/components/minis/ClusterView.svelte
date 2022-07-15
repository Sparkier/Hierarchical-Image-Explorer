<script lang="ts">
  import BackendService from '../../services/backendService';
  import type { DataHexagon } from '../../types';
  import ClusterBarChart from './ClusterBarChart.svelte';
  export let datagons: DataHexagon[];

  $: rep = getSuperRepresentant(datagons);

  /**
   * Gets the representantID for a selection.
   * @param {DataHexagon[]} datagons
   */
  function getSuperRepresentant(datagons: DataHexagon[]) {
    const avgX = datagons.reduce((v, e) => v + e.hexaX, 0) / datagons.length;
    const avgY = datagons.reduce((v, e) => v + e.hexaY, 0) / datagons.length;
    const distances = datagons.map((e) => {
      return Math.sqrt((avgX - e.hexaX) ** 2 + (avgY - e.hexaY) ** 2);
    });
    return datagons[distances.indexOf(Math.min(...distances))].representantID;
  }

  /**
   * Gets the cluster content distribution by summing up all entries.
   * @param {DataHexagon[]} datagons
   */
  function getLabelDistribution(datagons: DataHexagon[]) {
    const aggregatedDistribution: { label: string; amount: number }[] = [];
    datagons.forEach((d) => {
      d.labelDistribution.forEach((e) => {
        if (aggregatedDistribution.find((f) => f.label === e.label)) {
          const entry = aggregatedDistribution.find((f) => f.label === e.label);
          if (entry == undefined) return;
          entry.amount += e.amount;
        } else {
          aggregatedDistribution.push({ label: e.label, amount: e.amount });
        }
      });
    });
    return aggregatedDistribution;
  }
</script>

<div class="pl-4 pt-4 font-medium text-lg text-left">
  Number of images:
  <div class="pl-2 text-slate-400">
    {datagons.reduce((v, e) => v + e.size, 0)}
  </div>
</div>
<div class="pl-4 pt-4 font-bold text-xl text-left">Representative image</div>
<img
  alt="selected"
  class="ml-4 mt-2 mb-2 w-32 h-32"
  src={BackendService.getImageUrl(rep)}
  style="image-rendering: pixelated;"
/>
<div class="pl-4 mt-4 w-full">
  <ClusterBarChart distribution={getLabelDistribution(datagons)} />
</div>
