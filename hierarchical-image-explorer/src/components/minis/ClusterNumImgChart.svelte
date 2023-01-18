<script lang="ts">
  import { Vega } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let numberOfClusterImages: {
    numberOfImg: number;
    selection: string;
  }[];

  let visValues: { cluster: string; imgInCluster: number; color: string }[] =
    [];

  $: {
    if (numberOfClusterImages.length == 2) {
      visValues = [];
      if (numberOfClusterImages[0].numberOfImg > 0) {
        visValues.push({
          cluster: 'A',
          imgInCluster: numberOfClusterImages[0].numberOfImg,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
        });
      }
      if (numberOfClusterImages[1].numberOfImg > 0) {
        visValues.push({
          cluster: 'B',
          imgInCluster: numberOfClusterImages[1].numberOfImg,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
        });
      }
    }
  }

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description:
      'Comparing the number of images contained in selected clusters',
    background: null,
    width: 'container',
    data: {
      values: visValues,
    },
    mark: { type: 'bar' },
    encoding: {
      x: { field: 'imgInCluster', type: 'quantitative', title: '# images' },
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
      y: { field: 'cluster' },
    },
  };
</script>

<Vega {spec} />
