import fs from 'fs'

export default
class HierarchicalClusterDataProvider{

    public root:HcNode
    private nodes:[HcNode?] 
    private leafNodes:Map<number,string> = new Map()
    private indexOffset:number


    /**
     * Loads the data from the given filePath and converts it to a tree structure
     * @param filePath path to json file containing the tree and id to node id tables
     */
    public constructor(filePath:string){
        var data = JSON.parse(fs.readFileSync(filePath,'utf-8'))
       
        data.clusters.forEach(entry => this.leafNodes.set(entry.clusterID,entry.ID))
        
        this.indexOffset = data.tree[0].node_id // node_id ascents in order in file but starts at offset

        this.nodes = []
        // create implicit nodes
        for(var i = 0; i < this.indexOffset;i++){
            this.nodes.push(new HcNode(i))
        }

        // create nodes
        data.tree.forEach(node => {
            this.nodes.push(new HcNode(node.node_id))
        });


        this.root = this.nodes[this.nodes.length-1]!
        // create connections
        data.tree.forEach(dataNode=> {
            const node = this.getNode(dataNode.node_id)
            node.addChild(this.getNode(dataNode.left))
            node.addChild(this.getNode(dataNode.right))
        })
        console.log("Hierarchical data setup complete!")
    }

    /**
     * Returns a node from its ID
     * @param nodeID 
     * @returns 
     */
    public getNode(nodeID):HcNode{
        if(nodeID >= this.nodes.length) throw new Error(`Node index out of range: ${nodeID}`)
        return this.nodes[nodeID]!
    }

    /**
     * Converts node IDs of leaf nodes to the corresponding data ID
     * @param nodeID 
     * @returns 
     */
    public nodeIDtoDataID(nodeID:number):string{
        console.log(nodeID)
        console.log(typeof(nodeID))
        if(this.leafNodes.has(nodeID)) return this.leafNodes.get(nodeID)!
        else throw new Error(`NodeID not a leaf node: ${nodeID}`)
    }

    /**
     * Returns all dataIDs of all leaf-child nodes of the given nodeID
     * @param nodeID root node to start search from
     * @returns List of dataIDs
     */
    public getAllIDs(nodeID:number):string[]{
        var toReturn:string[] = []
        const root:HcNode = this.getNode(nodeID) 
        var nodePool:HcNode[] = [root] 

        while (nodePool.length > 0){
            const node = nodePool.pop()
            if(node!.isLeaf()) toReturn.push(this.nodeIDtoDataID(node!.nodeID))
            else nodePool = nodePool.concat(node?.getChildren()!)
        }
        return toReturn;
    }
}



class HcNode{
    private children:HcNode[] = []

    constructor(
        public nodeID:number, 
        ){}
    
    public isLeaf():boolean{
        return this.children.length == 0
    }
    public addChild(child:HcNode):void{
        this.children.push(child)
    }
    public getChildren():HcNode[]{
        return this.children
    }
    
}