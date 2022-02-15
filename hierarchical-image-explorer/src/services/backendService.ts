/**
 * Collection of methods for backend interaction
 */
export type HcNode = {
  children: HcNode[];
  nodeID: number;
};

export default class BackendService {
  private static serverAdress = 'http://localhost:25679/';

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
}
