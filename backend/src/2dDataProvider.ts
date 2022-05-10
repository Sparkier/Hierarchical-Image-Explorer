import fs from 'fs';
import * as csv from 'fast-csv';
import { mnistDatum } from './server';

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

export class DataProvider2D {
  pointMap: Map<string, { x: number; y: number; label: string }> = new Map();

  constructor(private filePath: string, dataFrame: Map<string, mnistDatum>) {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on('error', (e) => console.log(e))
      .on('data', (row: csvRow2D) => {
        const datapoint = dataFrame.get(row.id);
        if (datapoint == undefined)
          throw new Error('ID in 2d csv not in swg file: ' + row.id);
        this.pointMap.set(row.id, {
          x: parseFloat(row.x),
          y: parseFloat(row.y),
          label: datapoint.label,
        });
      })
      .on('end', (rowCount: number) => {
        if (this.pointMap.size == 0) throw new Error('Dataset empty');
        console.log('2D - CSV read with ' + rowCount + ' rows');
      });
  }

  public getAllPoints(): datum2dPoint[] {
    return Array.from(this.pointMap).map(([k, v]) => {
      return {
        id: k,
        x: v.x,
        y: v.y,
        label: v.label,
      };
    });
  }

  public getPointByID(id: string) {
    const mapEntry = this.pointMap.get(id);
    if (mapEntry == undefined) throw new Error('ID does not exist');
    return { id: id, x: mapEntry.x, y: mapEntry.y, label: mapEntry.label };
  }
}
