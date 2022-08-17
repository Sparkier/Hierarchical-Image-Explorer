import * as chroma from 'chroma.ts'

export class ColorUtil {
  public static colors = ['#5778a4', '#e49444', '#d1615d', '#85b6b2', '#6a9f58', '#e7ca60', '#a87c9f', '#f1a2a9', '#967662', '#b8b0ac'];

  public static SELECTION_HIGHLIGHT_COLOR_A = "#A03D52"
  public static SELECTION_HIGHLIGHT_COLOR_B = "#8D8797"

  public static colorMap: Map<string, string> = new Map();

  public static dataRange:{ min: number; max: number; } = {min:0,max:0}

  public static gradients:{name:string, gradient: chroma.Scale<chroma.Color>}[] = [
    {name: "Hot", gradient: chroma.scale("black", "red", "gold").mode("lab")},
    {name: "Cold", gradient: chroma.scale("yellow", '#008AE5').mode("lab")},
    {name: "Cinema", gradient: chroma.scale("#751f7e", "#ff6000").mode("lab")},
  ]

  private static getContinuousValue(v:number, selectedPallettName:string){
   const gradient =  this.gradients.find(e => e.name == selectedPallettName)
   if (gradient == undefined) throw new Error("Color gradient undefined")
   return gradient.gradient((v-this.dataRange.min)/(Math.abs(this.dataRange.min-this.dataRange.max))).css()
  }





  /**
   * Assigns colors to label values
   * @param label
   * @returns assigned color
   */
  public static getColor(label: string|number, selectedPallettName:string):string {
    if (typeof label == 'number'){
      return this.getContinuousValue(label, selectedPallettName);
    }
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
