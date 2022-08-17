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

  export let columnName: string;

  $: {
    distribution = [
      ...distributionA.map((e) => {
        return {
          label: e.label,
          amount: e.amount,
          selection: 'A',
        };
      }),
      ...distributionB.map((e) => {
        return {
          label: e.label,
          amount: e.amount,
          selection: 'B',
        };
      }),
    ];
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
      x: {
        field: 'amount',
        type: 'quantitative',
      },
      y: { field: 'label', type: 'nominal', title: columnName },
      color: {
        field: 'selection',
        scale: {
          domain: ['A', 'B'],
          range: [
            ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
            ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
          ],
        },
      },
      tooltip: [
        { field: 'label', type: 'nominal' },
        { field: 'amount', type: 'quantitative' },
      ],
    },
  };
</script>

<VegaLite class="w-full" {data} {spec} />
