import type { HexagonPropertiesMap } from '../types';
import * as aq from 'arquero';
import type ColumnTable from 'arquero/dist/types/table/column-table';
import type { ArraySet } from '../ArraySet';

/**
 * Aggregates information based on quantization
 * @param table data source
 * @param hexagonPropertiesMap object containing queries
 * @returns table with aggregated information
 */
export function quantizationRollup(
  table: ColumnTable,
  hexagonPropertiesMap: HexagonPropertiesMap
): ColumnTable {
  return table.groupby('quantization').rollup({
    quantization: (d: { quantization: [number, number] }) =>
      aq.op.any(d.quantization),
    representantID: (d: { id: string }) => aq.op.mode(d.id),
    color: hexagonPropertiesMap.color,
    count: () => aq.op.count(),
    dominantLabel: hexagonPropertiesMap.representantID,
  });
}

/**
 * Filters table to given selection
 * @param table data source
 * @param selectionA set containing coordinates of hexagons selected in A
 * @param selectionB (optional) set containing coordinates of hexagons selected in B
 * @returns table only containing datapoints with matching quantization
 */
export function getSelection(
  table: ColumnTable,
  selectionA: ArraySet<[number, number]>,
  selectionB: ArraySet<[number, number]> | null = null
): ColumnTable {
  const filterFunction =
    selectionB == null
      ? (d: { quantization: [number, number] }) => {
          return selectionA.has(d.quantization);
        }
      : (d: { quantization: [number, number] }) => {
          return (
            selectionA.has(d.quantization) || selectionB.has(d.quantization)
          );
        };
  return table.filter(aq.escape(filterFunction));
}

/**
 * Calculates the amount of datapoints matching the selection
 * @param selectionA set containing coordinates of hexagons selected in A
 * @param selectionB set containing coordinates of hexagons selected in B
 * @param table data source
 * @returns number of datapoints matching selection
 */
export function getTotalSelectionSize(
  selectionA: ArraySet<[number, number]>,
  selectionB: ArraySet<[number, number]>,
  table: ColumnTable
): number {
  if (table == undefined) return -1;
  const sizeObject = getSelection(table, selectionA, selectionB)
    .select('id')
    .rollup({ count: aq.op.count() })
    .object() as { count: number };
  return sizeObject.count;
}
