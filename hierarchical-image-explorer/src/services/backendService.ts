/**
 * Collection of methods for backend interaction
 */
export default class BackendService{

    private static serverAdress:string = "http://localhost:25679/"

    private static async getEndpoint(endpoint:string):Promise<any>{
        const response = await fetch(this.serverAdress + endpoint);
        return response.json();
    }

    public static async getRootCluster(){
        return this.getEndpoint("hc/root");
    }

    public static async getCluster(clusterID:number){
        return this.getEndpoint(`hc/nodes/${clusterID}`)
    }

    public static async getClusterParent(clusterID:number){
        return this.getEndpoint(`hc/parent/${clusterID}`)
    }

    public static async getClusterSize(clusterID:number):Promise<number>{
        return this.getEndpoint(`hc/clusterinfo/size/${clusterID}`)
    }

    public static async getClusterLevel(clusterID:number):Promise<number>{
        return this.getEndpoint(`hc/clusterinfo/level/${clusterID}`)
    }

    public static getCentroidImageUrl(clusterID:number, rank:number = 0){
        return `${this.serverAdress}hc/repimage/close/${clusterID}/${rank}`
    }

    public static getOutlierImageUrl(clusterID:number, rank:number = 0){
        return `${this.serverAdress}hc/repimage/distant/${clusterID}/${rank}`
    }
} 