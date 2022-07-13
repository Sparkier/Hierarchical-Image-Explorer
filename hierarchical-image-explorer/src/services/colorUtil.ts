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

  public static SELECTION_HIGHLIGHT_COLOR_A = "#fcfc1e"
  public static SELECTION_HIGHLIGHT_COLOR_B = "#ff1493"

  public static colorMap: Map<string, string> = new Map();

  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  public static getColor(label: string):string {
    if (this.colorMap.has(label)){
      const color = this.colorMap.get(label);
      if (color == undefined) throw new Error("Color not in colordict")
      return color
    }
    else {
      const color = this.colors[this.colorMap.size];
      this.colorMap = this.colorMap.set(label, color);
      return color;
    }
  }
}
