<script lang="ts">
  import { VegaLite } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let data: { label: string; amount: number }[] = [];

  $: distribution = [
    ...data.map((e) => {
      return {
        category: e.label,
        amount: e.amount,
      };
    }),
  ];

  $: colorscheme =
    distribution == undefined
      ? []
      : distribution
          .map((d) => d.category)
          .sort()
          .map((e) => ColorUtil.getColor(e, ''));

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Selection distribution',
    background: null,
    data: {
      values: distribution,
    },
    mark: 'bar',
    encoding: {
      y: { field: 'category' },
      x: { field: 'amount', type: 'quantitative', axis: { tickMinStep: 1 } },
      color: {
        field: 'category',
        scale: { range: colorscheme },
      },
    },
  };
</script>

<VegaLite {spec} options={{ actions: false }} />
