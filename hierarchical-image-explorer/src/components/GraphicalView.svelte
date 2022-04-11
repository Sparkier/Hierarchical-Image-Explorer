<script lang="ts">
    import Hexagon from './minis/Hexagon.svelte';
    import BackendService, { PointData } from '../services/backendService';
  
    
    let data: PointData[];
  
    export let hexaSide = 3;
    const padding = 80;
  
    /**
     * Gets all data points
     */
    async function setupData() {
      const response = await BackendService.getAllDataPoints();
      data = response
      data.push({id:"jens-joachim", x:0.3,y:0.3,label:"jens"})
      console.log(data)

    } 
  
    /**
     * Returns SVG width
     */
    function getSVG() {
      const svgElement = document.getElementById('svg')
      if( svgElement == undefined) throw new Error("No Element with id 'svg'")
      return svgElement
    }

    function scaleX(v:number){
      return ((v+100)/200)*(getSVG().clientWidth-2*padding) + padding
    }
    function scaleY(v:number){
      return ((v+100)/200)*(getSVG().clientHeight-2*padding) + padding
    }
  </script>

  <div>
    <h2>2d Dimensionality Reduction demo</h2>
    <svg id="svg" width="100%" height="580px">
      {#await setupData()}
        <p>Loading data</p>
      {:then}
        <!-- "svelte for" over the PointData -->
        {#each data as point}
          <Hexagon
            side={hexaSide}
            x={scaleX(parseFloat(point.x.toString()))}
            y={scaleY(parseFloat(point.y.toString()))}
            
            color="lightblue"
          />
        {/each}
      {:catch error}
        <p>{error.message}</p>
      {/await}
    </svg>
  </div>
  <style>
    #svg {
      background-color: transparent
    }
  </style>