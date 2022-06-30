<script lang="ts">
    import { VegaLite } from "svelte-vega";

    export let distribution: {label:string, amount:number}[]

    let selected = "default text"

    $: data = {
        table: distribution,
    };

    const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: "Cluster content distribution",
		    background: null,
		    height: 450,
        autosize: "pad",
        data: {
            name: "table",
        },
		    params:[{
            name: "select",
				    select: {type: "point", encodings: ["x"]}
        }],
        mark: {
            type: "bar",
		        cursor: "pointer",
		        color: "#D87472"
        },
        encoding: {
            x: { field: "label", type: "nominal" },
            y: { field: "amount", type: "quantitative" },
		        fillOpacity: {condition: {param: "select", value: 1}, value: 0.3}
        }
    }

    function handleSelection(...args: any){
		if(args[1].label !== undefined){
				const amount = distribution.filter(e => e.label == args[1].label)[0].amount
				selected = `Number of pictures in selected category: ${amount}`
		}
        else {
            selected= "";
		}
    }
</script>

<VegaLite {data} {spec} signalListeners={{ select: handleSelection }}/>
<div>{selected}</div>
