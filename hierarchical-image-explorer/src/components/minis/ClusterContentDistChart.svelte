<script lang="ts">
  import { VegaLite } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let distribution: { label: string; amount: number }[] | undefined;

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
    background: null,
    autosize: {
      type: 'pad',
      contains: 'padding',
    },
    data: {
      name: 'table',
    },
    mark: {
      type: 'bar',
    },
    encoding: {
      x: { field: 'amount', type: 'quantitative', axis: { tickMinStep: 1 } },
      y: { field: 'label', type: 'nominal' },
      color: {
        field: 'label',
        scale: { range: colorscheme },
      },
    },
  };
</script>

<VegaLite class="w-full" {data} {spec} />
