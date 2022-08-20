<script lang="ts">
  import { ColorUtil } from '../../services/colorUtil';

  import { colorQueryMaxima, selectedColorPalette } from '../../stores';

  let colorQueryMaximaLocal: { min: number; max: number };
  let gradientStyle = '';

  colorQueryMaxima.subscribe((v) => (colorQueryMaximaLocal = v));
  selectedColorPalette.subscribe((v) => {
    gradientStyle = 'background: ' + ColorUtil.getCssGradient(v) + ';';
  });
</script>

<div class="flex gap-2 w-full mb-2">
  <div class="grow-0 align-middle">
    {colorQueryMaximaLocal.min.toString().length > 5
      ? colorQueryMaximaLocal.min.toExponential(2)
      : colorQueryMaximaLocal.min}
  </div>
  <div class="grow w-max h-6" style={gradientStyle} />
  <div class="grow-0 align-middle">
    {colorQueryMaximaLocal.max.toString().length > 5
      ? colorQueryMaximaLocal.max.toExponential(2)
      : colorQueryMaximaLocal.max}
  </div>
</div>
