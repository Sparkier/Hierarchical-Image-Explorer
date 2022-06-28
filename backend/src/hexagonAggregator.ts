import { DataProvider2D } from './2dDataProvider';

export class HexagonAggregator {
  private APOTHEM = Math.sqrt(3) / 2;
  private HEXA_RATIO = Math.sqrt(3);

  constructor(private dataProvider: DataProvider2D) {}

  /**
   * Aggregates the dimensionality reduction points into hexagons
   * @param columns amount of columns to agrregate in rows is automatically calculated based on this number and the shape of the data
   * @returns List of Quantizationresults
   */
  public quantize(columns: number): QuantizationResults {
    const dimredData = this.dataProvider.getAllPoints();

    const { xMin, xMax, yExtent, xExtent, yMin, yMax } =
      this.getExtents(dimredData);

    const hexaSide = Math.abs(xMin - xMax) / (3 * columns);

    const rows = Math.ceil(
      (yExtent / xExtent) * (this.HEXA_RATIO * 2 * columns)
    );

    const { scaleQuantizedX, scaleQuantizedY, scaleX, scaleY } =
      this.generateScales(
        hexaSide,
        xMin,
        xExtent,
        columns,
        yMin,
        yExtent,
        rows
      );

    const possiblePoints: {
      xCoord: number;
      xQuantized: number;
      yCoord: number;
      yQuantized: number;
    }[][] = [];

    this.calculatePossiblePoints(
      columns,
      possiblePoints,
      rows,
      scaleQuantizedX,
      scaleQuantizedY,
      hexaSide
    );

    // initialize empty 3d Array
    const quantized: PointData[][][] = [];
    for (let x = 0; x < columns; x++) {
      quantized.push([]);
      for (let y = 0; y < rows; y++) {
        quantized[x].push([]);
      }
    }

    this.getQuantization(
      dimredData,
      xMin,
      hexaSide,
      yMin,
      columns,
      rows,
      possiblePoints,
      scaleX,
      scaleY,
      quantized
    );

    const dataList: DataHexagon[] = [];
    this.aggregateQuantization(quantized, possiblePoints, xMin, yMin, dataList);

    return {
      datagons: dataList,
      xDomain: [xMin, xMax],
      yDomain: [yMin, yMax],
      columns: columns,
      rows: rows,
    };
  }

  /**
   * takes in a list of quantized datapoints and aggregates them into the necessary hexagons
   * @param quantized list of quantized datapoints
   * @param possiblePoints list of hexagon centers
   * @param xMin minmal x in Data
   * @param yMin minimal y in Data
   * @param dataList empty list
   */
  private aggregateQuantization(
    quantized: PointData[][][],
    possiblePoints: {
      xCoord: number;
      xQuantized: number;
      yCoord: number;
      yQuantized: number;
    }[][],
    xMin: number,
    yMin: number,
    dataList: DataHexagon[]
  ) {
    for (let x = 0; x < quantized.length; x++) {
      for (let y = 0; y < quantized[x].length; y++) {
        if (quantized[x][y].length != 0) {
          const distances = quantized[x][y].map((p) =>
            Math.hypot(
              p.x - (possiblePoints[x][y].xCoord - xMin),
              p.y - (possiblePoints[x][y].yCoord - yMin)
            )
          );

          const closestPoint =
            quantized[x][y][distances.indexOf(Math.min(...distances))];

          dataList.push({
            hexaX: x,
            hexaY: y,
            size: quantized[x][y].length,
            dominantLabel: this.getMajorityLabel(
              quantized[x][y].map((p) => p.label)
            ),
            representantID: closestPoint.id,
            containedIDs: quantized[x][y].map((p) => p.id),
          });
        }
      }
    }
  }

  /**
   * Quantizes dimred datapoints on a hexagon grid
   * This method overlays a grid with wich the hexagons in question can be limited to 5 possible ones
   * After that the closest of the 5 is choosen
   * This gives O(n) where n is the length of the input data and the amount of hexagons does not significantly impact the algorithm
   * @param dimredData the data that shall be quantized
   * @param xMin minimum x in data
   * @param hexaSide length of the side of a hexagon
   * @param yMin minimum y in data
   * @param columns amount of columns to quantize to
   * @param rows amount of rows to quantize to
   * @param possiblePoints list of hexagon centers to quantize in
   * @param scaleX scale between data and hexagon domain
   * @param scaleY scale between data and hexagon domain
   * @param quantized
   */
  private getQuantization(
    dimredData: { id: string; x: number; y: number; label: string }[],
    xMin: number,
    hexaSide: number,
    yMin: number,
    columns: number,
    rows: number,
    possiblePoints: {
      xCoord: number;
      xQuantized: number;
      yCoord: number;
      yQuantized: number;
    }[][],
    scaleX: (v: number) => number,
    scaleY: (v: number) => number,
    quantized: PointData[][][]
  ) {
    dimredData.forEach((filteredPoint) => {
      let gridX = Math.floor(
        (filteredPoint.x - xMin - 0.5 * this.APOTHEM * hexaSide) /
          (3 * hexaSide)
      );
      gridX = Math.max(0, gridX); // in edge cases since the grids first cell starts in the negative a value of -1 can appear
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
      const scaledX = scaleX(filteredPoint.x);
      const scaledY = scaleY(filteredPoint.y);

      const distances = comparisonPoints.map((pp) => {
        return Math.hypot(scaledX - pp.xCoord, scaledY - pp.yCoord);
      });
      const closesHexaIndex = distances.indexOf(Math.min(...distances));
      const closestHexa = comparisonPoints[closesHexaIndex];
      quantized[closestHexa.xQuantized][closestHexa.yQuantized].push(
        filteredPoint
      );
    });
  }

  /**
   * Calculates possible hexagon centers for quantization
   * @param columns amount of hexagons in x-direction
   * @param possiblePoints list to fill
   * @param rows amount of hexagons in y-direction
   * @param scaleQuantizedX scale between hexagon-x (discrete) and domain
   * @param scaleQuantizedY scale between hexagon-y (discrete) and domain
   * @param hexaSide length of the side of one hexagon
   */
  private calculatePossiblePoints(
    columns: number,
    possiblePoints: {
      xCoord: number;
      xQuantized: number;
      yCoord: number;
      yQuantized: number;
    }[][],
    rows: number,
    scaleQuantizedX: (v: number, row: number) => number,
    scaleQuantizedY: (v: number) => number,
    hexaSide: number
  ) {
    for (let i = 0; i < columns; i++) {
      possiblePoints.push([]);
    }

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        const topleftX = scaleQuantizedX(x, y);
        const topleftY = scaleQuantizedY(y);
        const centerX = topleftX + hexaSide;
        const centerY = topleftY + hexaSide * this.APOTHEM;
        possiblePoints[x][y] = {
          xCoord: centerX,
          xQuantized: x,
          yCoord: centerY,
          yQuantized: y,
        };
      }
    }
  }

  /**
   * Generates scales necessary for hexagon quantization
   * @param hexaSide length of the side of one hexagon
   * @param xMin minimum x in data
   * @param xExtent minX-maxX
   * @param columns amount of hexagons in x direction
   * @param yMin minimum y in data
   * @param yExtent maxY-minY
   * @param rows amount of hexagons in y direction
   * @returns
   */
  private generateScales(
    hexaSide: number,
    xMin: number,
    xExtent: number,
    columns: number,
    yMin: number,
    yExtent: number,
    rows: number
  ) {
    const scaleQuantizedX = (v: number, row: number) => {
      return v * 3 * hexaSide + (row % 2 == 0 ? 0 : 1.5 * hexaSide);
    };

    const scaleQuantizedY = (v: number) => {
      return this.APOTHEM * hexaSide * v;
    };

    const scaleX = (v: number) => {
      return ((v - xMin) / xExtent) * (columns * 3 * hexaSide);
    };

    const scaleY = (v: number) => {
      return ((v - yMin) / yExtent) * (rows * this.APOTHEM * hexaSide);
    };
    return { scaleQuantizedX, scaleQuantizedY, scaleX, scaleY };
  }

  private getExtents(
    dimredData: { id: string; x: number; y: number; label: string }[]
  ) {
    const xMin = Math.min(...dimredData.map((d) => d.x));
    const xMax = Math.max(...dimredData.map((d) => d.x));
    const xExtent = Math.abs(xMin - xMax);

    const yMin = Math.min(...dimredData.map((d) => d.y));
    const yMax = Math.max(...dimredData.map((d) => d.y));
    const yExtent = Math.abs(yMin - yMax);
    return { xMin, xMax, yExtent, xExtent, yMin, yMax };
  }

  /**
   * For a given list returns the item with most occurance
   * @param input list of strings
   * @returns most common item
   */
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
