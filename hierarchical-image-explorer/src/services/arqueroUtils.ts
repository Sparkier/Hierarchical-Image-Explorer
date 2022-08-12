import type { HexagonPropertiesMap } from "../types";
import * as aq from 'arquero';
import type ColumnTable from "arquero/dist/types/table/column-table";

export function quantizationRollup(table:ColumnTable, hexagonPropertiesMap:HexagonPropertiesMap){
  return table.groupby('quantization')
          .rollup({
            quantization: (d: { quantization: [number, number] }) =>
              aq.op.any(d.quantization),
            representantID: (d:{id:string}) => aq.op.mode(d.id),
            color: hexagonPropertiesMap.color,
            count: (d) => aq.op.count(),
            dominantLabel: (d: { label: string }) => aq.op.mode(d.label),
          })

}