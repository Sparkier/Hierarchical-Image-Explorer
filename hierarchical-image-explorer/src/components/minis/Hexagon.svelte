<script lang="ts">

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let side:number = 100;
	export let color:string = "green";
	export let image:string = "";
	export let scale:number = 1;
	export let x:number = 0;
	export let y:number = 0;
	export let text:string = "";
	//export let textSize:string = "20";
	
	const t = 120 * Math.PI /180;
	const a = (side*Math.sqrt(3))/2;

	const P1 ={x: 0,y: a}
	const P2 ={x:P1.x-(side*Math.cos(t)),y:P1.y+(side*Math.sin(t))}
	const P3 ={x:P2.x,y:0}
	const P4 ={x:P2.x+side,y:P2.y}
	const P5 ={x:side*2,y:a}
	const P6 ={x:P2.x+side,y:0}
	
	let p1 = P1.x + "," + P1.y
	let p2 = P2.x + "," + P2.y
	let p3 = P3.x + "," + P3.y
	let p4 = P4.x + "," + P4.y
	let p5 = P5.x + "," + P5.y
	let p6 = P6.x + "," + P6.y
	
	$: fill = `url(#image-bg_${image})`
	if(image == ""){
		fill = color;
	}

	function handleClick(){
		dispatch('message', {
			text: 'Hello!'
		});
	}
</script>

<style>
	.hex{
		stroke: black;
  		stroke-width: 1;
	}
</style>

<defs>
	<pattern id={`image-bg_${image}`} height="{side*2}" width="{side*2}" patternUnits="userSpaceOnUse">
		<image width="{side*2}" height="{side*2}" xlink:href={image}/>
	</pattern>
</defs>
<!-- Polygons are weird -->
<g transform="scale({scale}) translate({x}, {y})" on:click={handleClick}> 
	<polygon class="hex" points="{p5} {p4} {p2} {p1} {p3} {p6}" fill="{fill}"/>
	<text transform="translate({side},{side})" 
			font-family="Verdana" 
			font-size="30"
			text-anchor="middle"
			fill="red">
    	{text}
    </text>
</g>
