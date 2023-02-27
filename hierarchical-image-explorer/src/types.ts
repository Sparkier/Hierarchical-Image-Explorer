import type ColumnTable from 'arquero/dist/types/table/column-table';

export enum ShapeType {
  Hexagon,
  Square
}

export type QuantizationResults = {
  datagons: ColumnTable;
  xDomain: [number, number];
  yDomain: [number, number];
  columns: number;
  rows: number;
};

export type filterDescriptor = {
  toBeFilteredOn: string; // type to be filtered on
  comparator: string; // comparison operator to be used
  valueToBeComparedTo: string; // value to be compared with
  arqueroQuery: string;
  arqueroQueryManuallyEdited: boolean;
};

export type SettingsObject = {
  columns: number,
  shapeType: ShapeType,
 };

export type DerivedHexagon = {
  quantization: [number, number];
  count: number;
  representantID: string;
  dominantLabel: string;
  color: string;
};

export type HexagonPropertiesMap = {
  color: string;
  representantID: string;
};

export type BoxPlotDatum = {
  min: number;
  max: number;
  median: number;
  q1: number;
  q2: number;
  name: string;
};
