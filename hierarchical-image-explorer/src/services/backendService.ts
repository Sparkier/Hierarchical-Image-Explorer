/**
 * Collection of methods for backend interaction
 * Sends Promises only
 */

import { SERVER_ADRESS } from "../config";
import type { QuantizationResults, SWGInfo } from "../types";


export default class BackendService {
  private static serverAdress = SERVER_ADRESS

  private static async getEndpointJSON(endpoint: string): Promise<unknown> {
    const response = await fetch(this.serverAdress + endpoint);
    return response.json();
  }

  private static async getEndpointBinary(endpoint:string): Promise<unknown> {
    const response = await fetch(this.serverAdress + endpoint)
    return response.arrayBuffer
  }

  public static getImageUrl(dataID: string): string {
    return `${this.serverAdress}data/images/${dataID}`;
  }

  public static async getDataQuantized(columns:number):Promise<QuantizationResults> {
    return this.getEndpointJSON(`data/quantized?columns=${columns}`) as Promise<QuantizationResults>
  }

  public static async getDataArquero():Promise<string> {
    return this.getEndpointJSON("data/aquero/all") as Promise<string>
  }

}
