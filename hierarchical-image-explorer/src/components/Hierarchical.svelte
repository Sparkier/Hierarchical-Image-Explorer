<script lang="ts">
  const serverAdress = "http://localhost:25679/"  
  type HcNode = {
    children:HcNode[],
    nodeID:number
  }

  import Hexagon from './minis/Hexagon.svelte'

  
  export let parentNode:HcNode;
  export let childLeft:HcNode;
  export let childRight:HcNode;
  
  async function getRoot():Promise<HcNode>{
    const response = await fetch(`${serverAdress}hc/root`)
    var root = await response.json()
    return root;
  }
  async function getNode(nodeID:number):Promise<HcNode>{
    const response = await fetch(`${serverAdress}hc/nodes/${nodeID}`)
    var node = await response.json()
    return node;
  }

  async function startUp(){
    const root = await getRoot()
    parentNode = root;
    childRight = root.children[0]
    childLeft = root.children[1]
    console.log("All loaded")
  }
  


  


</script>

<svg id="svg" width="100%" height="580px">
      <Hexagon x=30 y=30 text="{parentNode.nodeID.toString()}"></Hexagon>
</svg>


<style>
  #svg {
    background-color: deeppink;
  }
</style>