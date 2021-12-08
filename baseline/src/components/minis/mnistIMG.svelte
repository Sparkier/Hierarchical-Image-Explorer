<canvas id={"canvas_" + ID}></canvas>

<script lang="ts">
import { onMount } from "svelte";


    export let imgData;
    export let ID;
    
    onMount(()=> renderImage())

    function renderImage(){
                
        var canvas:HTMLCanvasElement = document.getElementById('canvas_' + ID) as HTMLCanvasElement
        // set canvas width so that canvas pixel == css pixel
        canvas.width = 28;
        canvas.height = 28;
        canvas.style.width = "28px"
        canvas.style.height = "28px"

        var ctx = canvas.getContext("2d")

        // convert b/w byte-array to srgb array
        var arr = new Uint8ClampedArray(imgData.length*4)
        for (let i = 0; i < arr.length/4; i++){
            arr[4*i+0] = imgData[i] // R
            arr[4*i+1] = imgData[i] // G
            arr[4*i+2] = imgData[i] // B
            arr[4*i+3] = 255 // A
        }

        var compatibleImageData = new ImageData(arr,28)
        ctx.putImageData(compatibleImageData, 0,0)
    }
</script>
