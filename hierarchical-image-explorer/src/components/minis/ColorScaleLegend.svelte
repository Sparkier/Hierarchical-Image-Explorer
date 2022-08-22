<script lang="ts">
  import { get } from 'svelte/store';

  import { ColorUtil } from '../../services/colorUtil';

  import { colorQueryMaxima, selectedColorPalette } from '../../stores';

  $: gradientStyle =
    'background: ' + ColorUtil.getCssGradient($selectedColorPalette) + ';';
</script>

<div class="flex gap-2 w-full mb-2">
  <div class="grow-0 align-middle">
    {$colorQueryMaxima.min.toString().length > 5
      ? $colorQueryMaxima.min.toExponential(2)
      : $colorQueryMaxima.min}
  </div>
  <div class="grow w-max h-6" style={gradientStyle} />
  <div class="grow-0 align-middle">
    {$colorQueryMaxima.max.toString().length > 5
      ? $colorQueryMaxima.max.toExponential(2)
      : $colorQueryMaxima.max}
  </div>
</div>
