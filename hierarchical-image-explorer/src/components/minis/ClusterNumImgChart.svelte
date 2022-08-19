<script lang="ts">
  import { Vega } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let numberOfClusterImages: {
    numberOfImg: number;
    selection: string;
  }[];

  let imgInClusterA: number = 0;
  let imgInClusterB: number = 0;

  $: {
    if (numberOfClusterImages.length == 2) {
      imgInClusterA = numberOfClusterImages[0].numberOfImg;
      imgInClusterB = numberOfClusterImages[1].numberOfImg;
    }
  }

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description:
      'Comparing the number of images contained in selected clusters',
    autosize: {
      type: 'pad',
      contains: 'padding',
    },
    background: null,
    data: {
      values: [
        {
          cluster: 'A',
          imgInCluster: imgInClusterA,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
        },
        {
          cluster: 'B',
          imgInCluster: imgInClusterB,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
        },
      ],
    },
    encoding: {
      theta: { field: 'imgInCluster', type: 'quantitative', stack: true },
      color: {
        field: 'color',
        type: 'nominal',
        scale: null,
        legend: null,
      },
      tooltip: [
        { field: 'cluster', type: 'nominal' },
        { field: 'imgInCluster', type: 'quantitative' },
      ],
    },
    layer: [
      {
        mark: {
          type: 'arc',
        },
      },
      {
        mark: {
          type: 'text',
          outerRadius: '115',
          fill: '#202630',
          fontWeight: 'bold',
          fontSize: 16,
        },
        encoding: {
          text: { field: 'cluster', type: 'nominal' },
        },
      },
      {
        mark: {
          type: 'text',
          outerRadius: '50',
          fill: '#ffffff',
          fontSize: 14,
        },
        encoding: {
          text: { field: 'imgInCluster', type: 'quantitative' },
        },
      },
    ],
    view: { stroke: null },
  };
</script>

<Vega {spec} />
