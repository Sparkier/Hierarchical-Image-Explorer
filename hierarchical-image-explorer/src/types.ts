import type ColumnTable from "arquero/dist/types/table/column-table";

export type PointData = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type SWGInfo = {
  image_id: string;
  file_path: string;
  label: string;
};

export type DataHexagon = {
  hexaX: number;
  hexaY: number;
  size: number;
  dominantLabel: string;
  representantID: string;
  labelDistribution: { label: string; amount: number }[];
};

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

export type SettingsObject = { columns: number};

export type DerivedHexagon = {quantization:[number,number], count:number, representantID:string, dominantLabel:string, color:string}

export type HexagonPropertiesMap = {
  color: string;
};
