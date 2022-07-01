<script lang="ts">
    import BackendService from '../../services/backendService';
    import ClusterBarChart from "./ClusterBarChart.svelte";
    export let datagon: { labelDistribution: {label:string, amount:number}[], size: number; representantID: string; hexaY: number; hexaX: number; dominantLabel: string }

    $: console.log("Datagon: ", datagon)

</script>
<div class="pl-4 pt-4 font-medium text-lg text-left">
	Number of images:
	<div class="pl-2 text-slate-400">
		{datagon.size}
	</div>
</div>
<div class="pl-4 pt-4 font-bold text-xl text-left">Representative image</div>
<img
		alt="selected"
		class="ml-4 mt-2 mb-2 w-32 h-32"
		src={BackendService.getImageUrl(datagon.representantID)}
/>
<div class="pl-4 mt-4 w-full" >
<ClusterBarChart distribution={datagon.labelDistribution} />
</div>