import fs from 'fs';
import * as csv from 'fast-csv';
import type { datapoint, csvRow2D, datum2dPoint } from './types';

export class DataProvider2D {
  pointMap: Map<string, { x: number; y: number; label: string }> = new Map();

  /**
   * Reads in a given 2d-points csv and compares it to a swg-dataframe
   * @param filePath path to 2d csv
   * @param dataFrame swg dataframe
   */
  constructor(private filePath: string, dataFrame: Map<string, datapoint>) {
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

  /**
   * Returns all points
   * @returns List of all datum2dPoint
   */
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

  /**
   * @returns dataPoint for a given id
   */
  public getPointByID(id: string) {
    const mapEntry = this.pointMap.get(id);
    if (mapEntry == undefined) throw new Error('ID does not exist');
    return { id: id, x: mapEntry.x, y: mapEntry.y, label: mapEntry.label };
  }
}
