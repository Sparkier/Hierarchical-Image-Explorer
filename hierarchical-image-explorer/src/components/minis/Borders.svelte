<script lang="ts">
  // coordinates
  export let Left: { x: number; y: number } = { x: 0, y: 0 };
  export let BottomLeft: { x: number; y: number } = { x: 0, y: 0 };
  export let TopLeft: { x: number; y: number } = { x: 0, y: 0 };
  export let BottomRight: { x: number; y: number } = { x: 0, y: 0 };
  export let Right: { x: number; y: number } = { x: 0, y: 0 };
  export let TopRight: { x: number; y: number } = { x: 0, y: 0 };

  export let bordercolors: {
    rbr: string;
    rtr: string;
    lbl: string;
    ltl: string;
    tltr: string;
    blbr: string;
  } = {
    rbr: 'deeppink',
    rtr: 'deeppink',
    lbl: 'deeppink',
    ltl: 'deeppink',
    tltr: 'deeppink',
    blbr: 'deeppink',
  };

  // standard stroke
  export let stroke: string = 'black'; // if differing colors is not neccessary
  export let strokeWidth: number = 1;

  // assign standard stroke color if not assigned
  bordercolors.rbr = bordercolors.rbr == 'deeppink' ? stroke : bordercolors.rbr;
  bordercolors.rtr = bordercolors.rtr == 'deeppink' ? stroke : bordercolors.rtr;
  bordercolors.lbl = bordercolors.lbl == 'deeppink' ? stroke : bordercolors.lbl;
  bordercolors.ltl = bordercolors.ltl == 'deeppink' ? stroke : bordercolors.ltl;
  bordercolors.tltr =
    bordercolors.tltr == 'deeppink' ? stroke : bordercolors.tltr;
  bordercolors.blbr =
    bordercolors.blbr == 'deeppink' ? stroke : bordercolors.blbr;
</script>

<!--Right to BottomRight-->
<line
  x1={Right.x}
  x2={BottomRight.x}
  y1={Right.y}
  y2={BottomRight.y}
  stroke={bordercolors.rbr}
  stroke-width={strokeWidth}
/>
<!--Right to TopRight-->
<line
  x1={Right.x}
  x2={TopRight.x}
  y1={Right.y}
  y2={TopRight.y}
  stroke={bordercolors.rtr}
  stroke-width={strokeWidth}
/>
<!--TopLeft to TopRight-->
<line
  x1={TopLeft.x}
  x2={TopRight.x}
  y1={TopLeft.y}
  y2={TopRight.y}
  stroke={bordercolors.tltr}
  stroke-width={strokeWidth}
/>
<!--BottomLeft to BottomRight-->
<line
  x1={BottomLeft.x}
  x2={BottomRight.x}
  y1={BottomLeft.y}
  y2={BottomRight.y}
  stroke={bordercolors.blbr}
  stroke-width={strokeWidth}
/>
<!--Left to TopLeft-->
<line
  x1={Left.x}
  x2={TopLeft.x}
  y1={Left.y}
  y2={TopLeft.y}
  stroke={bordercolors.ltl}
  stroke-width={strokeWidth}
/>
<!--Left to BottomLeft-->
<line
  x1={Left.x}
  x2={BottomLeft.x}
  y1={Left.y}
  y2={BottomLeft.y}
  stroke={bordercolors.lbl}
  stroke-width={strokeWidth}
/>
