<script lang="ts">
  import { VegaLite } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';
  import { selectedColorPalette } from '../../stores';

  export let data: { label: string; amount: number }[] = [];
  let colorPalette: string;

  $: distribution = [
    ...data.map((e) => {
      return {
        category: e.label,
        amount: e.amount,
      };
    }),
  ];

  selectedColorPalette.subscribe((v) => {
    colorPalette = v;
  });

  $: colorscheme =
    distribution == undefined
      ? []
      : distribution
          .map((d) => d.category)
          .sort()
          .map((e) => ColorUtil.getColor(e, colorPalette));

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
        type: 'nominal',
        scale: { range: colorscheme },
      },
    },
  };
</script>

<VegaLite {spec} />
