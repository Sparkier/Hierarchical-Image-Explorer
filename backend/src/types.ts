export type csvRow2D = {
  id: string;
  x: string;
  y: string;
};

export type datum2dPoint = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type datapoint = {
  file_path: string;
  label: string;
};

export type datapointWithID = {
  image_id: string;
  file_path: string;
  label: string;
};

export type clustersDatum = {
  clusterID: number;
  ID: string;
};

export type clusterTreeNodeDatum = {
  node_id: number;
  children: number[];
};

export type Point2d = {
  x: number;
  y: number;
};

export type DataHexagon = {
  hexaX: number;
  hexaY: number;
  size: number;
  dominantLabel: string;
  representantID: string;
  labelDistribution: { label: string; amount: number }[];
};

export type PointData = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type QuantizationResults = {
  datagons: DataHexagon[];
  xDomain: [number, number];
  yDomain: [number, number];
  columns: number;
  rows: number;
};
