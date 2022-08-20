import * as chroma from 'chroma.ts';
import { get } from 'svelte/store';
import { colorQueryMaxima } from '../stores';

export class ColorUtil {
  public static colors: string[] = [
    '#5778a4',
    '#e49444',
    '#d1615d',
    '#85b6b2',
    '#6a9f58',
    '#e7ca60',
    '#a87c9f',
    '#f1a2a9',
    '#967662',
    '#b8b0ac',
  ];

  public static SELECTION_HIGHLIGHT_COLOR_A = '#A03D52';
  public static SELECTION_HIGHLIGHT_COLOR_B = '#8D8797';
  public static colorMap: Map<string, string> = new Map();

  public static gradients: {
    name: string;
    gradient: chroma.Scale<chroma.Color>;
  }[] = [
    { name: 'Hot', gradient: chroma.scale('black', 'red', 'gold').mode('lab') },
    { name: 'Cold', gradient: chroma.scale('yellow', '#008AE5').mode('lab') },
    {
      name: 'Cinema',
      gradient: chroma.scale('#751f7e', '#ff6000').mode('lab'),
    },
  ];

  /**
   * Returns a css gradient (left to right) as a style string for a given name of a gradient in this.gradients
   * @param gradientName name of gradient
   * @returns css gradient (e.g. linear-gradient(to right,#751f7e,#ff6000))
   */
  public static getCssGradient(gradientName:string){
    const gradient = this.gradients.find((e) => e.name == gradientName);
    if (gradient == undefined) throw new Error('Color gradient undefined');
    return `linear-gradient(to right,${gradient.gradient.colors().toString().replace("[","").replace("]","")})`
  }

  /**
   * Converts a number value to a color value
   * @param v value
   * @param selectedColorPalette name of color palette to use
   * @returns color value (css formatted)
   */
  private static getContinuousValue(v: number, selectedColorPalette: string) {
    const gradient = this.gradients.find((e) => e.name == selectedColorPalette);
    if (gradient == undefined) throw new Error('Color gradient undefined');
    const extent = get(colorQueryMaxima)
    return gradient
      .gradient(
        (v - extent.min) /
          Math.abs(extent.min - extent.max)
      )
      .css();
  }

  /**
   * Assigns colors to label values if value is not a number categorical color is assigned
   * @param value to match color to
   * @param selectedColorPalette name of color palette
   * @returns assigned color
   */
  public static getColor(
    value: string | number,
    selectedColorPalette: string
  ): string {
    if (typeof value == 'number') {
      return this.getContinuousValue(value, selectedColorPalette);
    }
    if (this.colorMap.has(value)) {
      const color = this.colorMap.get(value);
      if (color == undefined)
        throw new Error(
          `Color not in colordict: ${String(color)} for label: ${value}`
        );
      return color;
    } else {
      // cycle through colors if more categories than colors exist
      const color = this.colors[this.colorMap.size % this.colors.length];
      this.colorMap = this.colorMap.set(value, color);
      return color;
    }
  }
}
