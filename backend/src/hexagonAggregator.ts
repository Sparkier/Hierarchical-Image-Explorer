import { createDocumentRegistry } from 'typescript';
import { DataProvider2D } from './2dDataProvider';

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
  containedIDs: string[];
};

export type PointData = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export class HexagonAggregator {
  private APOTHEM = Math.sqrt(3) / 2;
  private hexaRatio = Math.sqrt(3);

  constructor(private dataProvider: DataProvider2D) {}

  public quantise(
    columns: number,
    topleft: Point2d,
    bottomright: Point2d,
  ) {
    const startTime = Date.now()

    const rows = Math.ceil(this.hexaRatio * 2 * columns);
    console.log('Quanisizing with rows and columns: ', rows, columns);

    const filteredData = this.dataProvider
      .getAllPoints()
      .filter(
        (p) =>
          p.x > topleft.x &&
          p.x < bottomright.x &&
          p.y > topleft.y &&
          p.y < bottomright.y
      );

      const dataPointMax = Math.ceil(
        Math.max(
          ...filteredData.map((d) => Math.max(Math.abs(d.x), Math.abs(d.y)))
        )+2
      );
      console.log('Maximum coordinate is: ', dataPointMax);

    const hexaSide = (2*dataPointMax) / (3 * columns);



    const scaleQuantisedX = (v: number, row: number) => {
      return v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
    };

    const scaleQuantisedY = (v: number) => {
      return this.APOTHEM * hexaSide * v;
    };

    const scaleContinuous = (v:number) => {
      return (v+dataPointMax)/(2*dataPointMax)*(columns*3*hexaSide)
    }


    const possiblePoints: {
      xCoord: number;
      xQuantised: number;
      yCoord: number;
      yQuantised: number;
    }[][] = [];

    for (let i = 0; i < columns; i++) {
      possiblePoints.push([]);
      for (let j = 0; j < rows; j++) {}
    }

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const topleftX = scaleQuantisedX(x, y);
        const topleftY = scaleQuantisedY(y);
        const centerX = topleftX + hexaSide;
        const centerY = topleftY + hexaSide * this.APOTHEM;
        if (
          centerX > topleft.x &&
          centerX < bottomright.x &&
          centerY > topleft.y &&
          centerY < bottomright.y
        ) {
          possiblePoints[x][y] = {
            xCoord: centerX,
            xQuantised: x,
            yCoord: centerY,
            yQuantised: y,
          };
        }
      }
    }

    // initialize empty 3d Array
    const quantised: PointData[][][] = [];
    for (let x = 0; x < columns; x++) {
      quantised.push([]);
      for (let y = 0; y < rows; y++) {
        quantised[x].push([]);
      }
    }

    // grid 3 * hexa side wide; 2* apothem * hexaside height; offset -1/2*apothem*hexaside
    filteredData.forEach((filteredPoint) => {
      const gridX = Math.floor(
        (filteredPoint.x + dataPointMax - 0.5 * this.APOTHEM * hexaSide) / (3 * hexaSide)
      );
      const gridY = Math.floor(
        (filteredPoint.y + dataPointMax) / (2 * this.APOTHEM * hexaSide)
      );

      // overlay grid to narrow down possible closest hexagons to 5
      // resulting possible hexagons:
      // gx, gy*2
      // gx+1 gy*2-1
      // gx+1 gy*2+1
      // gx gy*2+1
      // gx gy*2-1

      const comparisonPoints = [];

      if (gridX < columns && gridY * 2 <= rows)
        comparisonPoints.push(possiblePoints[gridX][gridY * 2]);
      if (gridX + 1 < columns && gridY * 2 - 1 > 0)
        comparisonPoints.push(possiblePoints[gridX + 1][gridY * 2 - 1]);
      if (gridX + 1 < columns && gridY * 2 + 1 < rows)
        comparisonPoints.push(possiblePoints[gridX + 1][gridY * 2 + 1]);
      if (gridX <= columns && gridY * 2 + 1 < rows)
        comparisonPoints.push(possiblePoints[gridX][gridY * 2 + 1]);
      if (gridX <= columns && gridY * 2 - 1 > 0)
        comparisonPoints.push(possiblePoints[gridX][gridY * 2 - 1]);
      
      if (comparisonPoints.some(i => i === undefined)){
        throw new Error("Undefined element in comparisonPoints " + gridX + ", " + gridY )
      }

      //console.log(comparisonPoints)

      const distances = comparisonPoints.map((pp) =>{
        //console.log("Combi: ", filteredPoint, pp)
        //console.log(Math.hypot((filteredPoint.x - pp.xCoord),(filteredPoint.y - pp.yCoord)))
        return Math.hypot((scaleContinuous(filteredPoint.x) - pp.xCoord),(scaleContinuous(filteredPoint.y) - pp.yCoord))}
      );
      //console.log('distancens: ', distances);
      const closesHexaIndex = distances.indexOf(Math.min(...distances));
      const closestHexa = comparisonPoints[closesHexaIndex];
      quantised[closestHexa.xQuantised][closestHexa.yQuantised].push(filteredPoint);

      //console.log("Grid: ", gridX, gridY)
    });

    const dataList: DataHexagon[] = [];
    for (let x = 0; x < quantised.length; x++) {
      for (let y = 0; y < quantised[x].length; y++) {
        if (quantised[x][y].length != 0) {
          const distances = quantised[x][y].map((p) =>
            Math.hypot(
              p.x - (possiblePoints[x][y].xCoord+dataPointMax),
              p.y - (possiblePoints[x][y].yCoord+dataPointMax)
            )
          );
          const closestPoint =
            quantised[x][y][distances.indexOf(Math.min(...distances))];

          dataList.push({
            hexaX: x,
            hexaY: y,
            size: quantised[x][y].length,
            dominantLabel: this.getMajorityLabel(
              quantised[x][y].map((p) => p.label)
            ),
            representantID: closestPoint.id,
            containedIDs: quantised[x][y].map((p) => p.id),
          });
        }
      }
    }
    const endTime = Date.now()
    const duration = new Date(endTime-startTime)
    console.log("Time taken: ", duration.getMilliseconds(), "ms")

    return dataList;
  }

  private getMajorityLabel(input: string[]): string {
    const countMap = new Map<string, number>();
    input.forEach((p) => {
      const prevCount = countMap.get(p);
      if (prevCount == undefined) {
        countMap.set(p, 1);
      } else {
        countMap.set(p, prevCount + 1);
      }
    });

    const sortedList = [...countMap.entries()].sort((a, b) => b[1] - a[1]);
    return sortedList[0][0];
  }

  /**
//    * Calculate a quantisation of our values, to combine multiple points
//    * @param input PointData array containing data points
//    * @returns quantised PointData with x and y coordinates and an array of included data points
//    */
  //   function calculateQuantisation(input: PointData[]): PointData[][][] {
  //     const possiblePoints: {
  //       xCoord: number;
  //       xQuantised: number;
  //       yCoord: number;
  //       yQuantised: number;
  //     }[] = [];

  //     // calculate possible hexagon center points:
  //     hexaSide = svgWidth / (3 * columns);
  //     for (let x = 0; x < columns; x++) {
  //       for (let y = 0; y < rows; y++) {
  //         const topleftX = scaleQuantisedX(x, y);
  //         const topleftY = scaleQuantisedY(y);
  //         const centerX = topleftX + hexaSide;
  //         const centerY = topleftY + hexaSide * hexaShortDiag;
  //         possiblePoints.push({
  //           xCoord: centerX,
  //           xQuantised: x,
  //           yCoord: centerY,
  //           yQuantised: y,
  //         });
  //       }
  //     }

  //     // initialize empty 3d Array
  //     const quantised: PointData[][][] = [];
  //     for (let x = 0; x < columns; x++) {
  //       quantised.push([]);
  //       for (let y = 0; y < rows; y++) {
  //         quantised[x].push([]);
  //       }
  //     }

  //     // check which possible point is closest to datum (modeling hexagons as circles)
  //     input.forEach((e) => {
  //       const scaledX = ((e.x + 10) / 20) * svgWi  dth;
  //       const scaledY = ((e.y + 10) / 20) * rows * hexaSide * hexaShortDiag;

  //       const distances = possiblePoints.map((p) =>
  //         Math.sqrt((p.xCoord - scaledX) ** 2 + (p.yCoord - scaledY) ** 2)
  //       );
  //       const smallestDistanceIndex = distances.indexOf(Math.min(...distances));
  //       const nearestPoint = possiblePoints[smallestDistanceIndex];

  //       quantised[nearestPoint.xQuantised][nearestPoint.yQuantised].push(e);
  //     });
  //     return quantised;
  //   }
}
