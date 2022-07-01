/**
 * Collection of methods for backend interaction
 * Sends Promises only
 */

import { SERVER_ADRESS } from "../config";
import type { PointData, QuantizationResults, SWGInfo } from "../types";


export default class BackendService {
  private static serverAdress = SERVER_ADRESS

  private static async getEndpoint(endpoint: string): Promise<unknown> {
    const response = await fetch(this.serverAdress + endpoint);
    return response.json();
  }

  public static getImageUrl(dataID: string): string {
    return `${this.serverAdress}data/images/${dataID}`;
  }

  public static async get2DAll(): Promise<PointData[]> {
    return this.getEndpoint('2d/all') as Promise<PointData[]>;
  }

  public static async getDataAnnotations(dataID: string) {
    return this.getEndpoint('data/annotations/' + dataID) as Promise<SWGInfo>;
  }

  public static async getDataQuantized(columns:number):Promise<QuantizationResults> {
    return this.getEndpoint(`data/quantized?columns=${columns}`) as Promise<QuantizationResults>
  }
}
