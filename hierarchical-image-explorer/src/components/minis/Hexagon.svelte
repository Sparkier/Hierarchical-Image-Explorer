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
    rbr: 'undefined',
    rtr: 'undefined',
    lbl: 'undefined',
    ltl: 'undefined',
    tltr: 'undefined',
    blbr: 'undefined',
  };

  const t = (120 * Math.PI) / 180; // 120 degrees in radians
  const a = (side * Math.sqrt(3)) / 2; // distance from a side to center of hexagon

  const left = { x: 0, y: a };
  const bottomLeft = {
    x: left.x - side * Math.cos(t),
    y: left.y + side * Math.sin(t),
  };
  const topLeft = { x: bottomLeft.x, y: 0 };
  const bottomRight = { x: bottomLeft.x + side, y: bottomLeft.y };
  const right = { x: side * 2, y: a };
  const topRight = { x: bottomLeft.x + side, y: 0 };

  const l = `${left.x},${left.y}`;
  const bl = `${bottomLeft.x},${bottomLeft.y}`;
  const tl = `${topLeft.x},${topLeft.y}`;
  const br = `${bottomRight.x},${bottomRight.y}`;
  const r = `${right.x},${right.y}`;
  const tr = `${topRight.x},${topRight.y}`;
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
    {topLeft}
    {topRight}
    {bottomLeft}
    {bottomRight}
    {right}
    {left}
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
