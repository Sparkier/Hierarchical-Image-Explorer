<script lang="ts">
  export let side: number = 100;
  export let image: string = '';
  export let scale: number = 1;
  export let x: number = 0;
  export let y: number = 0;
  export let text: string = '';
  export let stroke: string = 'none';
  export let strokeWidth: number = 1;

  const t = (120 * Math.PI) / 180; // 120 degrees in radians
  $: a = (side * Math.sqrt(3)) / 2; // distance from a side to center of hexagon

  $: left = { x: 0, y: a };
  $: bottomLeft = {
    x: left.x - side * Math.cos(t),
    y: left.y + side * Math.sin(t),
  };
  $: topLeft = { x: bottomLeft.x, y: 0 };
  $: bottomRight = { x: bottomLeft.x + side, y: bottomLeft.y };
  $: right = { x: side * 2, y: a };
  $: topRight = { x: bottomLeft.x + side, y: 0 };

  $: l = `${left.x},${left.y}`;
  $: bl = `${bottomLeft.x},${bottomLeft.y}`;
  $: tl = `${topLeft.x},${topLeft.y}`;
  $: br = `${bottomRight.x},${bottomRight.y}`;
  $: r = `${right.x},${right.y}`;
  $: tr = `${topRight.x},${topRight.y}`;

  // Individual hexagons require individual clip paths
  $: IDString = Math.round(x * 1000) + '' + Math.round(y * 1000);
</script>

<!--
  A polygon is used to create a clipppath for our image. 
  Then the polygon borders are drawn over the images.
 -->
<g
  transform="scale({scale}) translate({x}, {y})"
  on:click
  on:mouseenter
  on:mouseleave
>
  <polygon id={IDString + '_polygon'} points="{r} {br} {bl} {l} {tl} {tr}"></polygon >

  <defs>
    <clipPath id={IDString + '_clipping'}>
      <use xlink:href="#{IDString + '_polygon'}"></use >
    </clipPath>
  </defs>

  {#if image !== ''}
    <image
      href={image}
      width={side * 2}
      height={side * 2}
      clip-path="url(#{IDString + '_clipping'})"
      style="image-rendering: pixelated;"
    >
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
  {/if}
  <use
    clip-path="url(#{IDString + '_clipping'})"
    xlink:href="#{IDString + '_polygon'}"
    fill="none"
    {stroke}
    stroke-width={strokeWidth}></use >
</g>
