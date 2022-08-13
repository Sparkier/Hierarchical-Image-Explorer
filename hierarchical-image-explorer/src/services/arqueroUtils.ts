import type { HexagonPropertiesMap } from "../types";
import * as aq from 'arquero';
import type ColumnTable from "arquero/dist/types/table/column-table";
import type { ArraySet } from "../ArraySet";

export function quantizationRollup(table:ColumnTable, hexagonPropertiesMap:HexagonPropertiesMap){
  return table.groupby('quantization')
          .rollup({
            quantization: (d: { quantization: [number, number] }) =>
              aq.op.any(d.quantization),
            representantID: (d:{id:string}) => aq.op.mode(d.id),
            color: hexagonPropertiesMap.color,
            count: () => aq.op.count(),
            dominantLabel: hexagonPropertiesMap.representantID,
          })

}

export function getSelection(table: ColumnTable,  selectionA: ArraySet<[number, number]>,
  
  selectionB: ArraySet<[number, number]>|null = null){
    const filterFunction = selectionB ==null?((d: { quantization: [number, number] }) => {
      return (
        selectionA.has(d.quantization)
      );
    }):((d: { quantization: [number, number] }) => {
      return (
        selectionA.has(d.quantization) || selectionB.has(d.quantization)
      );
    })
  return table.filter(aq.escape(filterFunction))
}

export function getTotalSelectionSize(
  selectionA: ArraySet<[number, number]>,
  selectionB: ArraySet<[number, number]>,
  table: ColumnTable
) {
  if (table == undefined) return -1;
  const sizeObject = getSelection(table, selectionA, selectionB)
    .select('id')
    .rollup({ count: aq.op.count() })
    .object() as { count: number };
  return sizeObject.count;
}