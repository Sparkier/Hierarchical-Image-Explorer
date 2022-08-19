<script lang="ts">
  import { Vega } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let distributionA: { label: string; amount: number }[] = [];
  export let distributionB: { label: string; amount: number }[] = [];
  export let distribution: {
    label: string;
    amount: number;
    selection: string;
  }[];

  let categories: { category: string }[];

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

  $: {
    const categorySet = new Set<string>();
    distributionA.forEach((e) => categorySet.add(e.label));
    distributionB.forEach((e) => categorySet.add(e.label));
    categories = [...categorySet].map((a) => {
      return { category: a };
    });
  }

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    name: 'clusterDist',
    description: 'Cluster content distribution',
    background: null,
    height: 20 * categories.length,
    padding: 5,
    signals: [
      { name: 'chartWidth', value: 125 },
      { name: 'chartPad', value: 40 },
      { name: 'width', update: '2 * chartWidth + chartPad' },
    ],
    data: [
      {
        name: 'distribution',
        values: distribution.sort((a, b) => (a.label < b.label ? 1 : -1)),
      },
      {
        name: 'selectionA',
        source: 'distribution',
        transform: [{ type: 'filter', expr: "datum.selection == 'A'" }],
      },
      {
        name: 'selectionB',
        source: 'distribution',
        transform: [{ type: 'filter', expr: "datum.selection == 'B'" }],
      },
      {
        name: 'categories',
        source: 'distribution',
        transform: [{ type: 'aggregate', groupby: ['label'] }],
      },
    ],
    scales: [
      {
        name: 'y',
        type: 'band',
        range: [{ signal: 'height' }, 0],
        round: true,
        domain: { data: 'categories', field: 'label' },
      },
      {
        name: 'c',
        type: 'ordinal',
        domain: ['A', 'B'],
        range: [
          ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
          ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
        ],
      },
    ],
    marks: [
      {
        type: 'text',
        from: { data: 'categories' },
        encode: {
          enter: {
            x: { signal: 'chartWidth + chartPad /2' },
            y: { scale: 'y', field: 'label', band: 0.5 },
            text: { field: 'label' },
            baseline: { value: 'middle' },
            align: { value: 'center' },
            fill: { value: '#000' },
          },
        },
      },
      {
        type: 'group',

        encode: {
          update: {
            x: { value: 0 },
            height: { signal: 'height' },
          },
        },
        scales: [
          {
            name: 'x',
            type: 'linear',
            range: [{ signal: 'chartWidth' }, 0],
            nice: true,
            zero: true,
            domain: { data: 'distribution', field: 'amount' },
          },
        ],

        axes: [
          {
            orient: 'bottom',
            scale: 'x',
            format: 's',
            title: 'Cluster A',
            tickCount: 5,
          },
        ],

        marks: [
          {
            type: 'rect',
            from: { data: 'selectionA' },
            encode: {
              enter: {
                x: { scale: 'x', field: 'amount' },
                x2: { scale: 'x', value: 0 },
                y: { scale: 'y', field: 'label' },
                height: { scale: 'y', band: 1, offset: -1 },
                fillOpacity: { value: 1 },
                fill: { scale: 'c', field: 'selection' },
                tooltip: {
                  signal:
                    "{'title': 'Selection A','category': datum.label, 'amount': datum.amount}",
                },
              },
            },
          },
        ],
      },
      {
        type: 'group',

        encode: {
          update: {
            x: { signal: 'chartWidth + chartPad' },
            height: { signal: 'height' },
          },
        },
        scales: [
          {
            name: 'x',
            type: 'linear',
            range: [0, { signal: 'chartWidth' }],
            nice: true,
            zero: true,
            domain: { data: 'distribution', field: 'amount' },
          },
        ],

        axes: [
          {
            orient: 'bottom',
            scale: 'x',
            format: 's',
            title: 'Cluster B',
            tickCount: 5,
          },
        ],

        marks: [
          {
            type: 'rect',
            from: { data: 'selectionB' },
            encode: {
              enter: {
                x: { scale: 'x', field: 'amount' },
                x2: { scale: 'x', value: 0 },
                y: { scale: 'y', field: 'label' },
                height: { scale: 'y', band: 1, offset: -1 },
                fillOpacity: { value: 1 },
                fill: { scale: 'c', field: 'selection' },
                tooltip: {
                  signal:
                    "{'title': 'Selection B','category': datum.label, 'amount': datum.amount}",
                },
              },
            },
          },
        ],
      },
    ],
  };
</script>

<Vega {spec} />
