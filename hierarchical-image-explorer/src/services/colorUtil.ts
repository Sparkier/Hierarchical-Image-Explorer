export class ColorUtil {
  public static colors = ['#5778a4', '#e49444', '#d1615d', '#85b6b2', '#6a9f58', '#e7ca60', '#a87c9f', '#f1a2a9', '#967662', '#b8b0ac'];

  public static SELECTION_HIGHLIGHT_COLOR_A = "#A03D52"
  public static SELECTION_HIGHLIGHT_COLOR_B = "#8D8797"

  public static colorMap: Map<string, string> = new Map();

  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  public static getColor(label: string):string {
    if (this.colorMap.has(label)){
      const color = this.colorMap.get(label);
      if (color == undefined) throw new Error(`Color not in colordict: ${String(color)} for label: ${label}`)
      return color
    }
    else {
      const color = this.colors[this.colorMap.size%this.colors.length];
      this.colorMap = this.colorMap.set(label, color);
      return color;
    }
  }
}
