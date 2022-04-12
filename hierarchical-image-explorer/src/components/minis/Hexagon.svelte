<script lang="ts">
  export let side: number = 100;
  export let color: string = 'green';
  export let image: string = '';
  export let scale: number = 1;
  export let x: number = 0;
  export let y: number = 0;
  export let text: string = '';

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

  $: fill = image == '' ? color : 'url(#image-bg_${image})';
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
  <polygon class="hex" points="{r} {br} {bl} {l} {tl} {tr}" {fill} />
  <text
    transform="translate({side},{side})"
    font-family="Verdana"
    font-size="30"
    text-anchor="middle"
    fill="red"
  >
    {text}
  </text>
</g>

<style>
  .hex {
    stroke: black;
    stroke-width: 1;
  }

  text {
    pointer-events: none;
  }
</style>
