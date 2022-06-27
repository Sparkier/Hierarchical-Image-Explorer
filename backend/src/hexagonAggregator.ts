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

export type QuantizationResults = {
  datagons:DataHexagon[];
  xDomain:[number,number]
  yDomain:[number,number]
  columns:number;
  rows:number;
}

export class HexagonAggregator {
  private APOTHEM = Math.sqrt(3) / 2;
  private hexaRatio = Math.sqrt(3);

  constructor(private dataProvider: DataProvider2D) {}

  public quantise(columns: number, topleft: Point2d, bottomright: Point2d):QuantizationResults {
    const startTime = Date.now();

    
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
      ) + 2
    );
    console.log('Maximum coordinate is: ', dataPointMax);
    const xMin = Math.min(...filteredData.map((d) => d.x));
    const xMax = Math.max(...filteredData.map((d) => d.x));
    const xExtent = Math.abs(xMin-xMax)

    const yMin = Math.min(...filteredData.map((d) => d.y));
    const yMax = Math.max(...filteredData.map((d) => d.y));
    const yExtent = Math.abs(yMin-yMax)

    console.log( "Maximas: ", xMin, xMax, yMin, yMax);
    console.log("Extents: ", xExtent, yExtent)
    const hexaSide = (Math.abs(xMin - xMax)) / (3 * columns);


    const rows = Math.ceil( (yExtent/xExtent)*(this.hexaRatio * 2 * columns));
    const scaleQuantisedX = (v: number, row: number) => {
      return v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
    };

    const scaleQuantisedY = (v: number) => {
      return this.APOTHEM * hexaSide * v;
    };

    const scaleX=(v:number) => {
      return (
        ((v - xMin) / xExtent) * (columns * 3 * hexaSide)
      );
    }

    const scaleY=(v:number) => {
      return (
        ((v -yMin) / yExtent) * (rows*this.APOTHEM*hexaSide)
      );
    }

    const possiblePoints: {
      xCoord: number;
      xQuantised: number;
      yCoord: number;
      yQuantised: number;
    }[][] = [];

    for (let i = 0; i < columns; i++) {
      possiblePoints.push([]);
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
      var gridX = Math.floor(
        (filteredPoint.x - xMin - 0.5 * this.APOTHEM * hexaSide) /
          (3 * hexaSide)
      );
      gridX = Math.max(0,gridX) // in edge cases since the grids first cell starts in the negative a value of -1 can appear
      const gridY = Math.floor(
        (filteredPoint.y - yMin) / (2 * this.APOTHEM * hexaSide)
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

      if (comparisonPoints.some((i) => i === undefined)) {
        throw new Error(
          'Undefined element in comparisonPoints ' + gridX + ', ' + gridY
        );
      }
      const scaledX = scaleX(filteredPoint.x)
      const scaledY = scaleY(filteredPoint.y)

      const distances = comparisonPoints.map((pp) => {
        return Math.hypot(
          scaledX - pp.xCoord,
          scaledY - pp.yCoord
        );
      });
      //console.log(distances)
      const closesHexaIndex = distances.indexOf(Math.min(...distances));
      const closestHexa = comparisonPoints[closesHexaIndex];
      quantised[closestHexa.xQuantised][closestHexa.yQuantised].push(
        filteredPoint
      );
    });

    const dataList: DataHexagon[] = [];
    for (let x = 0; x < quantised.length; x++) {
      for (let y = 0; y < quantised[x].length; y++) {
        if (quantised[x][y].length != 0) {
          const distances = quantised[x][y].map((p) =>
            Math.hypot(
              p.x - (possiblePoints[x][y].xCoord - xMin),
              p.y - (possiblePoints[x][y].yCoord - yMin)
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
    const endTime = Date.now();
    const duration = new Date(endTime - startTime);
    console.log('Time taken: ', duration.getMilliseconds(), 'ms');

    const toReturn:QuantizationResults = {
      datagons:dataList,
      xDomain: [xMin, xMax],
      yDomain: [yMin, yMax],
      columns: columns,
      rows: rows
    }
    console.log(columns, rows)
    return toReturn
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
}
