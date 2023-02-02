<script lang="ts">
  import { Vega } from 'svelte-vega';
  import { ColorUtil } from '../../services/colorUtil';

  export let numberOfGroupImages: {
    numberOfImg: number;
    selection: string;
  }[];

  let visValues: { group: string; imgInGroup: number; color: string }[] = [];

  $: {
    if (numberOfGroupImages.length == 2) {
      visValues = [];
      if (numberOfGroupImages[0].numberOfImg > 0) {
        visValues.push({
          group: 'A',
          imgInGroup: numberOfGroupImages[0].numberOfImg,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_A,
        });
      }
      if (numberOfGroupImages[1].numberOfImg > 0) {
        visValues.push({
          group: 'B',
          imgInGroup: numberOfGroupImages[1].numberOfImg,
          color: ColorUtil.SELECTION_HIGHLIGHT_COLOR_B,
        });
      }
    }
  }

  $: spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Comparing the number of images contained in selected groups',
    background: null,
    width: 'container',
    data: {
      values: visValues,
    },
    mark: { type: 'bar' },
    encoding: {
      x: { field: 'imgInGroup', type: 'quantitative', title: '# images' },
      color: {
        field: 'color',
        type: 'nominal',
        scale: null,
        legend: null,
      },
      tooltip: [
        { field: 'group', type: 'nominal' },
        { field: 'imgInGroup', type: 'quantitative' },
      ],
      y: { field: 'group' },
    },
  };
</script>

<Vega {spec} options={{ actions: false }} />
