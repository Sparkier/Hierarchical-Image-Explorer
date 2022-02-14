<script lang="ts">
    export let clusterID:number
    let clusterSize = -1;
    let clusterLevel = -1;
    $: clusterSize_change = updateClusterSize(clusterID)
    $: clusterLeve_change = updateClusterLevel(clusterID)

    async function updateClusterSize(newClusterID:number){
        const response = await fetch(`${serverAdress}hc/clusterinfo/size/${newClusterID}`)
        clusterSize = await response.json()
        
        return -1
    }

    async function updateClusterLevel(newClusterID:number) {
        const response = await fetch(`${serverAdress}hc/clusterinfo/level/${newClusterID}`)
        clusterLevel = await response.json()
        return -1
    }

    const serverAdress = "http://localhost:25679/"

</script>



<div class = hoverBox>
    <h1>{clusterID}</h1>
    <table class="hoverTable">
        <tr>
          <td>Elements in Cluster</td>
          <td>{clusterSize}</td>
        </tr>
        <tr>
            <td>Hierarchical level</td>
            <td>{clusterLevel}</td>
          </tr>
      </table>
    <hr/>
    <img class="outlierImage" src={`${serverAdress}hc/repimage/distant/${clusterID}/0`} alt="outlier0"/>
    <img class="centroidImage" src={`${serverAdress}hc/repimage/close/${clusterID}/1`} alt="centroid1"/>
    <img class="centroidImage" src={`${serverAdress}hc/repimage/close/${clusterID}/0`} alt="centroid0"/>
    <img class="centroidImage" src={`${serverAdress}hc/repimage/close/${clusterID}/2`} alt="centroid2"/>
    <img class="outlierImage" src={`${serverAdress}hc/repimage/distant/${clusterID}/0`} alt="outlier1"/>
</div>





<style>
    h1{
        text-align: left;
    }

    hr{
        color: transparent;
        height: 10px;
        border-style: none;
    }

    .hoverBox{
        background-color: darkgray;
        color: white;
        width: 550px;
        padding-left: 20px;
        padding-bottom: 10px;
        border-radius: 5px;
    }
    table{
        table-layout: auto;
        text-align: left;
    }
    td{
        padding-right: 20px;
    }

    .centroidImage{
        width: 100px
    }
    .outlierImage{
        width: 70px;
    }
</style>