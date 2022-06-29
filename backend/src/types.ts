/* eslint-disable @typescript-eslint/no-unused-vars */

type csvRow2D = {
  id: string;
  x: string;
  y: string;
};

type datum2dPoint = {
  id: string;
  x: number;
  y: number;
  label: string;
};

type datapoint = {
  file_path: string;
  label: string;
};

type datapointWithID = {
  image_id: string;
  file_path: string;
  label: string;
};

type clustersDatum = {
  clusterID: number;
  ID: string;
};

type clusterTreeNodeDatum = {
  node_id: number;
  children: number[];
};

type Point2d = {
  x: number;
  y: number;
};

type DataHexagon = {
  hexaX: number;
  hexaY: number;
  size: number;
  dominantLabel: string;
  representantID: string;
  containedIDs: string[];
};

type PointData = {
  id: string;
  x: number;
  y: number;
  label: string;
};
type QuantizationResults = {
  datagons: DataHexagon[];
  xDomain: [number, number];
  yDomain: [number, number];
  columns: number;
  rows: number;
};