/**
 * Collection of methods for backend interaction
 * Sends Promises only
 */

import { SERVER_ADRESS } from "../config";
import type { QuantizationResults, SWGInfo } from "../types";


export default class BackendService {
  private static serverAdress = SERVER_ADRESS

  private static async getEndpoint(endpoint: string): Promise<unknown> {
    const response = await fetch(this.serverAdress + endpoint);
    return response.json();
  }

  public static getImageUrl(dataID: string): string {
    return `${this.serverAdress}data/images/${dataID}`;
  }

  public static async getDataQuantized(columns:number):Promise<QuantizationResults> {
    return this.getEndpoint(`data/quantized?columns=${columns}`) as Promise<QuantizationResults>
  }

  public static async getDataArquero():Promise<string> {
    return this.getEndpoint("data/aquero/all") as Promise<string>
  }

}
