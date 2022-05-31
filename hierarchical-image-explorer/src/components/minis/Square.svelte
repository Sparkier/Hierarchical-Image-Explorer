<script>
  export let width = '300';
  export let height = '300';
  export let style = 'stroke-width:3;stroke:rgb(0,0,0)';
  export let image = 'http://placekitten.com/306/306';
</script>

<defs>
  <pattern id="image-bg" {height} {width} patternUnits="userSpaceOnUse">
    <image {width} {height} xlink:href={image} />
  </pattern>
</defs>
<rect {width} {height} fill="url('#image-bg')" {style} />
