<script lang="ts">
  import BackendService from '../services/backendService';

  export let clusterID: number;

  $: fetchClusterSize = (async () => {
    return BackendService.getClusterSize(clusterID);
  })();

  $: fetchClusterLevel = (async () => {
    return BackendService.getClusterLevel(clusterID);
  })();
</script>

<div class="bg-gray-400 rounded-lg p-5" style="width:550px">
  <h1>{clusterID}</h1>
  <table class="hoverTable">
    <tr>
      <td>Elements in Cluster</td>
      <td>
        {#await fetchClusterSize}
          Fetching cluster size.
        {:then clusterSize}
          {clusterSize}
        {/await}
      </td>
    </tr>
    <tr>
      <td>Hierarchical level</td>
      <td>
        {#await fetchClusterLevel}
          Fetching cluster level.
        {:then clusterLevel}
          {clusterLevel}
        {/await}
      </td>
    </tr>
  </table>
  <div class="grid grid-cols-5 gap-2 mt-4">
    <img
      class=""
      src={BackendService.getOutlierImageUrl(clusterID, 1)}
      alt="outlier0"
    />
    <img
      class="centroidImage"
      src={BackendService.getCentroidImageUrl(clusterID, 1)}
      alt="centroid1"
    />
    <img
      class="centroidImage"
      src={BackendService.getCentroidImageUrl(clusterID, 0)}
      alt="centroid0"
    />
    <img
      class="centroidImage"
      src={BackendService.getCentroidImageUrl(clusterID, 2)}
      alt="centroid2"
    />
    <img
      class="outlierImage"
      src={BackendService.getOutlierImageUrl(clusterID, 1)}
      alt="outlier1"
    />
  </div>
</div>

<style>
</style>
