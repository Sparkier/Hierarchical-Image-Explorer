<script lang="ts">
  import Borders from './Borders.svelte';

  export let side: number = 100;
  export let color: string = 'green';
  export let image: string = '';
  export let scale: number = 1;
  export let x: number = 0;
  export let y: number = 0;
  export let text: string = '';
  export let stroke: string = 'black';
  export let strokeWidth: number = 1;
  export let bordercolors: {
    rbr: string;
    rtr: string;
    lbl: string;
    ltl: string;
    tltr: string;
    blbr: string;
  } = {
    rbr: 'transparent',
    rtr: 'transparent',
    lbl: 'transparent',
    ltl: 'transparent',
    tltr: 'transparent',
    blbr: 'transparent',
  };

  const t = (120 * Math.PI) / 180; // 120 degrees in radians
  const a = (side * Math.sqrt(3)) / 2; // distance from a side to center of hexagon

  const Left = { x: 0, y: a };
  const BottomLeft = {
    x: Left.x - side * Math.cos(t),
    y: Left.y + side * Math.sin(t),
  };
  const TopLeft = { x: BottomLeft.x, y: 0 };
  const BottomRight = { x: BottomLeft.x + side, y: BottomLeft.y };
  const Right = { x: side * 2, y: a };
  const TopRight = { x: BottomLeft.x + side, y: 0 };

  const l = `${Left.x},${Left.y}`;
  const bl = `${BottomLeft.x},${BottomLeft.y}`;
  const tl = `${TopLeft.x},${TopLeft.y}`;
  const br = `${BottomRight.x},${BottomRight.y}`;
  const r = `${Right.x},${Right.y}`;
  const tr = `${TopRight.x},${TopRight.y}`;
</script>

<defs>
  <pattern
    id={`image-bg_${image}`}
    height={side * 2}
    width={side * 2}
    patternUnits="userSpaceOnUse"
  >
    <image width={side * 2} height={side * 2} xlink:href={image} />
  </pattern>
</defs>
<g
  transform="scale({scale}) translate({x}, {y})"
  on:click
  on:mouseenter
  on:mouseleave
>
  {#if image != ''}
    <image class="hexagon" href={image} width={side * 2} height={side * 2}>
      <text
        class="pointer-events-none"
        transform="translate({side},{side})"
        font-family="Verdana"
        font-size="30"
        text-anchor="middle"
        fill="red"
      >
        {text}
      </text>
    </image>
  {:else}
    <polygon points="{r} {br} {bl} {l} {tl} {tr}" fill={color} />
  {/if}
  <Borders
    {TopLeft}
    {TopRight}
    {BottomLeft}
    {BottomRight}
    {Right}
    {Left}
    {stroke}
    {strokeWidth}
    {bordercolors}
  />
</g>

<style>
  /* % values are calculated using the same formulas as above */
  .hexagon {
    clip-path: polygon(25% 0%, 75% 0%, 100% 43%, 75% 86%, 25% 86%, 0% 43%);
    image-rendering: pixelated;
  }
</style>
