<script lang="ts"> 
  type HcNode = {
    children:HcNode[],
    nodeID:number
  }

  import Hexagon from './minis/Hexagon.svelte'
  import ClusterInfoHover from './ClusterInfoHover.svelte'
import BackendService from '../services/backendService';

  let parentNode:HcNode;
  let children:HcNode[];
  var showHover = false;
  var hoverClusterID:number;
  let hoverPosX:number = 0;
  let hoverPosY:number = 0;

  export let hexaSide = 100;
  export let childPadding = 400;
  const svgElem:HTMLElement = document.getElementById("svg")!
  
  /**
   * Gets the root of the tree and assigns it to the variables
  */
  async function setupTree():Promise<HcNode>{
    var root = await BackendService.getRootCluster()
    parentNode = root;
    children = root.children;
    return root;
  }

  /**
   * Updates the nodes of the tree
   * @param newRootID new parent node
   */
  async function updateTree(newRootID:number):Promise<HcNode>{
    var node = await BackendService.getCluster(newRootID)
    parentNode = node;
    children = node.children;
    return node;
  }

  /**
   * Calls updateTree with the parent of the current parent
   * For going up in the tree structure an additional call to the backend is needed to get the parent node of the current parent
  */
  async function updateParent():Promise<void>{
    const parent = await BackendService.getClusterParent(parentNode.nodeID)
    updateTree(parent.nodeID)
  }

  /**
   * Returns the index of a node from children based on its nodeID
   * @param nodeID
   */
  function getIndexOfNodeID(nodeID:number):number{
    const elem = children.filter((e) => e.nodeID == nodeID)[0]
    return children.indexOf(elem)
  }
  
  /**
   * Returns SVG width
   */
  function getSVGwidth(){
    return document.getElementById("svg")!.clientWidth
  }

  /**
   * Returns X position for child positioning
   * @param childIndex
  */
  function getChildPosition(childIndex:number):number{
    return childPadding + (getSVGwidth()-2*childPadding)*(childIndex/(children.length-1)) -hexaSide
  }

  function showClusterInfoHover(x:number, y:number ,nodeID:number){
    hoverClusterID = nodeID
    hoverPosX = x
    hoverPosY = y
    showHover = true;
  }
  
</script>

<div> 
  <svg id="svg" width="100%" height="580px">
    {#await setupTree()}
      <p>Loading data</p>
    {:then}
      <!-- parent creation -->
        <Hexagon side={hexaSide} x="{getSVGwidth()/2 - hexaSide }" 
          y={30}  text="{parentNode.nodeID.toString()}" color="limegreen"
          on:click={async () => updateParent()}
          on:mouseenter={(e) => showClusterInfoHover(e.clientX, e.clientY, parentNode.nodeID)}
          on:mouseleave={() => showHover = false}
          image={BackendService.getCentroidImageUrl(parentNode.nodeID)}>
        </Hexagon>
    <!-- "svelte for" over the children -->  
    {#each children as child (child.nodeID)}
        <Hexagon side={hexaSide} x="{getChildPosition(getIndexOfNodeID(child.nodeID))}"
          y={300} text="{child.nodeID.toString()}" color="lightblue"
            on:click={async () => updateTree(child.nodeID)}
            on:mouseenter={(e) => showClusterInfoHover(e.clientX, e.clientY, child.nodeID)}
            on:mouseleave={() => showHover = false}
            image={BackendService.getCentroidImageUrl(child.nodeID)}>
        </Hexagon>
      <!-- line connections between parent and children -->
      <line x1="{getSVGwidth()/2}" y1= {4+hexaSide*2} 
        x2="{getChildPosition(getIndexOfNodeID(child.nodeID))+ hexaSide}" 
        y2="300" style="stroke: black; stroke-width:2;">
      </line>
    {/each}
    {:catch error}
      <p>{error.message}</p>
    {/await}
  </svg>

  <!-- Cluster Info Hover -->
  {#if parentNode != undefined && showHover}
  <div class="hoverInfoContainer" style="left:{hoverPosX-(550/2)}px;top:{hoverPosY+20}px">
    <ClusterInfoHover clusterID = {hoverClusterID}></ClusterInfoHover>
  </div>
  {/if}
</div>

<style>
  #svg {
    background-color: transparent;
  }

  .hoverInfoContainer{
    position: absolute;
  }
</style>
