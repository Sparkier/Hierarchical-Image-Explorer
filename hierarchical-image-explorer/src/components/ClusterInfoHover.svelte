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

<div class="hoverBox">
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
  <hr />
  <img
    class="outlierImage"
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

<style>
  h1 {
    text-align: left;
  }

  hr {
    color: transparent;
    height: 10px;
    border-style: none;
  }

  .hoverBox {
    background-color: darkgray;
    color: white;
    width: 550px;
    padding-left: 20px;
    padding-bottom: 10px;
    border-radius: 5px;
  }

  table {
    table-layout: auto;
    text-align: left;
  }

  td {
    padding-right: 20px;
  }

  .centroidImage {
    width: 100px;
  }

  .outlierImage {
    width: 70px;
  }
</style>
