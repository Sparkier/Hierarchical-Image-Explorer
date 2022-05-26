import type { PointData } from "./backendService";

/**
 * @param accessor accesor function for parameters of elements of pointsList
 * @param poinstList list of 2dPoint
 */
export function getExtent(
  accessor: (el: PointData) => number,
  pointsList: PointData[]
  ): [number, number] {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    pointsList.forEach((p) => {
      const value = accessor(p);
      if (value > max) max = value;
      if (value < min) min = value;
    });

    return [min, max];
}
  
/**
   * Generates a scale that maps input points of a given extent to the svg size.
   * In this scale 0 is always in the middle the values are scaled to fit
   * @param extent extent of scale
   * @param domain available height/width to display scale
   * @returns a scale function
   */
 export function generateScale(extent: number[], domain: number, padding:number):(v: number) => number {
    return (v: number) => {
      // maximum distance from zero *2
      const extentAbsMax =
        Math.max(Math.abs(extent[0]), Math.abs(extent[1])) * 2;
      // normalize to [0,1] and then scale with available space
      return (v / extentAbsMax + 0.5) * (domain - 2 * padding) + padding;
    };
  }

  export class LinearScale{
    private extentAbsMax = Math.max(Math.abs(this.extent[0]), Math.abs(this.extent[1])) * 2;
    constructor(private extent: number[], private domain: number, private padding: number){

    }

    public scale(v:number){
      return (v / this.extentAbsMax + 0.5) * (this.domain - 2 * this.padding) + this.padding;
    }

    public invert(w:number){
      return -1*(this.extentAbsMax*(this.domain-2*w))/(2*(this.domain-2*this.padding))
    }

  }