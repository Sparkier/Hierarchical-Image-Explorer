<script lang="ts">
  import { VegaLite } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let distributionA: { label: string; amount: number }[] = [];
  export let distributionB: { label: string; amount: number }[] = [];
  export let distribution: {
    label: string;
    amount: number;
    selection: string;
  }[] = [];

  const colorscheme = [
    ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
    ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
  ];

  $: {
    distribution = [
      ...distributionA.map((e) => {
        return { label: e.label, amount: e.amount, selection: 'A' };
      }),
      ...distributionB.map((e) => {
        return { label: e.label, amount: e.amount, selection: 'B' };
      }),
    ];
    distribution.sort();
  }

  $: data = {
    table: distribution,
  };

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
        field: 'selection',
        scale: { range: colorscheme },
      },
    },
  };
</script>

<VegaLite class="w-full" {data} {spec} />
