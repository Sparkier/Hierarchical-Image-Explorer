/**
 * Collection of methods for backend interaction
 */

import { SERVER_ADRESS } from "../config";
import type { HcNode, PointData, QuantizationResults, SWGInfo } from "../types";


export default class BackendService {
  private static serverAdress = SERVER_ADRESS

  private static async getEndpoint(endpoint: string): Promise<unknown> {
    const response = await fetch(this.serverAdress + endpoint);
    return response.json();
  }

  public static async getRootCluster(): Promise<HcNode> {
    return this.getEndpoint('hc/root') as Promise<HcNode>;
  }

  public static async getCluster(clusterID: number): Promise<HcNode> {
    return this.getEndpoint(`hc/nodes/${clusterID}`) as Promise<HcNode>;
  }

  public static async getClusterParent(clusterID: number): Promise<HcNode> {
    return this.getEndpoint(`hc/parent/${clusterID}`) as Promise<HcNode>;
  }

  public static async getClusterSize(clusterID: number): Promise<number> {
    return this.getEndpoint(
      `hc/clusterinfo/size/${clusterID}`
    ) as Promise<number>;
  }

  public static async getClusterLevel(clusterID: number): Promise<number> {
    return this.getEndpoint(
      `hc/clusterinfo/level/${clusterID}`
    ) as Promise<number>;
  }

  public static getCentroidImageUrl(clusterID: number, rank = 0): string {
    return `${this.serverAdress}hc/repimage/close/${clusterID}/${rank}`;
  }

  public static getOutlierImageUrl(clusterID: number, rank = 0): string {
    return `${this.serverAdress}hc/repimage/distant/${clusterID}/${rank}`;
  }

  public static getImageUrl(dataID: string): string {
    return `${this.serverAdress}data/images/${dataID}`;
  }

  public static async getAllDataPoints(): Promise<PointData[]> {
    return this.getEndpoint('2d/all') as Promise<PointData[]>;
  }

  public static async getSWGInfo(dataID: string) {
    return this.getEndpoint('data/annotations/' + dataID) as Promise<SWGInfo>;
  }

  public static async getQuantization(columns:number):Promise<QuantizationResults> {
    return this.getEndpoint(`data/quantized?columns=${columns}`) as Promise<QuantizationResults>
  }
}
