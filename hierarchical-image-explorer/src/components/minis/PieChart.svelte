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
    background: 'transparent',
    data: {
      values: distribution,
    },
    mark: { type: 'arc', tooltip: true },
    encoding: {
      theta: { field: 'amount', type: 'quantitative', stack: 'normalize' },
      color: {
        field: 'category',
        scale: { range: colorscheme },
      },
    },
  };
</script>

<VegaLite {spec} />
