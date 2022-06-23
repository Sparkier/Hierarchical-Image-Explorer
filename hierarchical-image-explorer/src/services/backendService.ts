/**
 * Collection of methods for backend interaction
 */
export type HcNode = {
  children: HcNode[];
  nodeID: number;
};

export type PointData = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type SWGInfo = {
  image_id: string;
  file_path: string;
  label: string;
}

export type DataHexagon = {
  hexaX: number;
  hexaY: number;
  size: number;
  dominantLabel: string;
  representantID: string;
  containedIDs: string[];
};

export default class BackendService {
  //private static serverAdress = 'http://nemesis.informatik.uni-ulm.de/main/';
  private static serverAdress = "http://localhost:25679/"

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

<<<<<<< HEAD
  public static async getSWGInfo(dataID: string) {
    return this.getEndpoint('data/annotations/' + dataID) as Promise<SWGInfo>;
=======
  public static async getQuantization(columns:number, topleftX:number, topleftY:number, bottomrightX:number, bottomrightY:number):Promise<DataHexagon[]> {
    return this.getEndpoint(`data/quantized?columns=${columns}&topleftX=${topleftX}&topleftY=${topleftY}&bottomrightX=${bottomrightX}&bottomrightY=${bottomrightY}`) as Promise<DataHexagon[]>
>>>>>>> b317feb (feat: rewrite for displaying different zoom levels)
  }
}
