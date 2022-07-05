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
}

export type DataHexagon = {
  hexaX: number;
  hexaY: number;
  size: number;
  dominantLabel: string;
  representantID: string;
  labelDistribution: { label: string; amount: number }[];
};

export type QuantizationResults = {
  datagons: DataHexagon[];
  xDomain: [number, number];
  yDomain: [number, number];
  columns: number;
  rows: number;
};