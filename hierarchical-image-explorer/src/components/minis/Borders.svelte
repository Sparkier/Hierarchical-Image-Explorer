<script lang="ts">
  // coordinates
  export let left: { x: number; y: number } = { x: 0, y: 0 };
  export let bottomLeft: { x: number; y: number } = { x: 0, y: 0 };
  export let topLeft: { x: number; y: number } = { x: 0, y: 0 };
  export let bottomRight: { x: number; y: number } = { x: 0, y: 0 };
  export let right: { x: number; y: number } = { x: 0, y: 0 };
  export let topRight: { x: number; y: number } = { x: 0, y: 0 };

  export let bordercolors: {
    rbr: string;
    rtr: string;
    lbl: string;
    ltl: string;
    tltr: string;
    blbr: string;
  };

  // standard stroke
  export let stroke: string = 'black'; // if differing colors is not neccessary
  export let strokeWidth: number = 1;
</script>

<!--Right to BottomRight-->
<line
  x1={right.x}
  x2={bottomRight.x}
  y1={right.y}
  y2={bottomRight.y}
  stroke={bordercolors.rbr == 'undefined' ? stroke : bordercolors.rbr}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
<!--Right to TopRight-->
<line
  x1={right.x}
  x2={topRight.x}
  y1={right.y}
  y2={topRight.y}
  stroke={bordercolors.rtr == 'undefined' ? stroke : bordercolors.rtr}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
<!--TopLeft to TopRight-->
<line
  x1={topLeft.x}
  x2={topRight.x}
  y1={topLeft.y}
  y2={topRight.y}
  stroke={bordercolors.tltr == 'undefined' ? stroke : bordercolors.tltr}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
<!--BottomLeft to BottomRight-->
<line
  x1={bottomLeft.x}
  x2={bottomRight.x}
  y1={bottomLeft.y}
  y2={bottomRight.y}
  stroke={bordercolors.blbr == 'undefined' ? stroke : bordercolors.blbr}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
<!--Left to TopLeft-->
<line
  x1={left.x}
  x2={topLeft.x}
  y1={left.y}
  y2={topLeft.y}
  stroke={bordercolors.ltl == 'undefined' ? stroke : bordercolors.ltl}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
<!--Left to BottomLeft-->
<line
  x1={left.x}
  x2={bottomLeft.x}
  y1={left.y}
  y2={bottomLeft.y}
  stroke={bordercolors.lbl == 'undefined' ? stroke : bordercolors.lbl}
  stroke-width={strokeWidth}
  stroke-linecap="round"
/>
