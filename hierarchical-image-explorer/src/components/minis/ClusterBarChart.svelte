<script lang="ts">
  import { VegaLite } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let distribution: { label: string; amount: number }[] | undefined;

  let selected = 'Select a bar to show the distribution of pictures';

  $: data = {
    table: distribution,
  };

  $: colorscheme =
    distribution == undefined
      ? []
      : distribution
          .map((d) => d.label)
          .sort()
          .map((e) => ColorUtil.getColor(e));

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    name: 'clusterDist',
    description: 'Cluster content distribution',
    title: 'Cluster content distribution',
    background: null,
    height: 450,
    autosize: 'fit-x',
    data: {
      name: 'table',
    },
    params: [
      {
        name: 'select',
        select: { type: 'point', encodings: ['x'] },
      },
    ],
    mark: {
      type: 'bar',
      cursor: 'pointer',
    },
    encoding: {
      x: { field: 'label', type: 'nominal' },
      y: { field: 'amount', type: 'quantitative', axis: { tickMinStep: 1 } },
      fillOpacity: { condition: { param: 'select', value: 1 }, value: 0.3 },
      color: {
        field: 'label',
        scale: { range: colorscheme },
      },
    },
  };

  function handleSelection(...args: any) {
    if (distribution == undefined) return;
    if (args[1].label !== undefined) {
      const amount = distribution.filter((e) => e.label == args[1].label)[0]
        .amount;
      selected = `Number of pictures in selected category: ${amount}`;
    } else {
      selected = '';
    }
  }
</script>

<VegaLite
  class="w-full"
  {data}
  {spec}
  signalListeners={{ select: handleSelection }}
/>
<div>{selected}</div>
