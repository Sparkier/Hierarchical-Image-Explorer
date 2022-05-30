import type { PointData } from './backendService';

export class ColorUtil {
  public static colors = [
    '#DF2935',
    '#7D5BA6',
    '#55D6BE',
    '#F19A3E',
    '#F8E16C',
    '#5DA9E9',
    '#DD5589',
    '#08605F',
    '#00B800',
    '#FFA07A',
  ];

  public static colorMap: Map<string, string> = new Map();

  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  public static getColor(label: string) {
    if (this.colorMap.has(label)) return this.colorMap.get(label);
    else {
      const color = this.colors[this.colorMap.size];
      this.colorMap = this.colorMap.set(label, color);
      return color;
    }
  }

  /**
   * Get the most occuring color within the PointData to find representative color
   * @param input PointData array containing data points
   * @returns most occuring color
   */
  public static getCellColor(input: PointData[]) {
    const countMap = new Map<string, number>();
    input.forEach((p) => {
      const prevCount = countMap.get(p.label);
      if (prevCount == undefined) {
        countMap.set(p.label, 1);
      } else {
        countMap.set(p.label, prevCount + 1);
      }
    });

    const sortedList = [...countMap.entries()].sort((a, b) => b[1] - a[1]);
    return this.getColor(sortedList[0][0]);
  }
}
