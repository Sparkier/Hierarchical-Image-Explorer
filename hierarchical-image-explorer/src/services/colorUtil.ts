import type { PointData } from "../types";

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

  public static SELECTION_HIGHLIGHT_COLOR = "#fcfc1e"

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
}
