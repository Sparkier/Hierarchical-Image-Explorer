import type { PointData } from "./backendService";

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
    '#FFA07A'
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
    const maxOccurence = input.reduce((previous, current, i, arr) =>
      arr.filter((item) => item === previous).length >
      arr.filter((item) => item === current).length
        ? previous
        : current
    );
    return this.getColor(maxOccurence.label);
  }
}

