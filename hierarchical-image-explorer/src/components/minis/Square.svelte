<script lang="ts">
  export let side: number = 100;
  export let image: string = '';
  export let scale: number = 1;
  export let x: number = 0;
  export let y: number = 0;
  export let text: string = '';
  export let stroke: string = 'none';
  export let strokeWidth: number = 1;

  // Individual hexagons require individual clip paths
  $: IDString = Math.round(x * 1000) + '' + Math.round(y * 1000);
  $: edgeLength = 1 * side;
</script>

<!--
  A polygon is used to create a clip path for our image.
  Then the polygon borders are drawn over the images.
 -->
<g
  transform="scale({scale}) translate({x}, {y})"
  viewBox="0 0 100 100"
  on:click
  on:mouseenter
  on:mouseleave
>
  <rect id={IDString + '_rect'} x={0} y={0} width={edgeLength} height={edgeLength} />

  <defs>
    <clipPath id={IDString + '_clipping'}>
      <use xlink:href="#{IDString + '_rect'}" />
    </clipPath>

    {#if image !== ''}
      <pattern
        id={IDString + '_img'}
        height="100%"
        width="100%"
        patternContentUnits="objectBoundingBox"
      >
        <image
          height="1"
          width="1"
          preserveAspectRatio="xMidYMid slice"
          xlink:href={image}
        />
      </pattern>
    {/if}
  </defs>

  {#if image !== ''}
    <rect 
      fill="url(#{IDString + '_img'})" 
      x={strokeWidth / 2} 
      y={strokeWidth / 2} 
      width={edgeLength - strokeWidth} 
      height={edgeLength - strokeWidth} 
      {stroke}
      stroke-width={strokeWidth}
    >
      <text
        class="pointer-events-none"
        transform="translate({edgeLength}, {edgeLength})"
        font-family="Verdana"
        font-size="30"
        text-anchor="middle"
        fill="red"
      >
        {text}
      </text>
    </rect>
  {/if}
  <use
    clip-path="url(#{IDString + '_clipping'})"
    xlink:href="#{IDString + '_rext'}"
    fill="none"
  />
</g>
