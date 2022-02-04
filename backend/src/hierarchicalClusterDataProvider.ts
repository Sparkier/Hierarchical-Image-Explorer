import fs from 'fs';

export default class HierarchicalClusterDataProvider {
  public root: HcNode; // root of the tree
  private nodes: [HcNode?]; // all nodes of the tree
  private leafNodes: Map<number, string> = new Map(); // all leaf nodes in this case all nodes containing dataIDs
  private indexOffset: number; // first index of none-leaf node in nodes which is also the number of leafNodes

  /**
   * Loads the data from the given filePath and converts it to a tree structure
   * @param filePath path to json file containing the tree and id to node id tables
   */
  public constructor(filePath: string) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    data.clusters.forEach((entry) =>
      this.leafNodes.set(entry.clusterID, entry.ID)
    );

    this.indexOffset = data.tree[0].node_id; // node_id ascents in order in file but starts at offset

    this.nodes = [];
    // create implicit nodes
    for (let i = 0; i < this.indexOffset; i++) {
      this.nodes.push(new HcNode(i));
    }

    console.log('Implicit Nodes created');
    // create nodes
    data.tree.forEach((node) => {
      this.nodes.push(new HcNode(node.node_id));
    });

    this.root = this.nodes[this.nodes.length - 1] ?? new HcNode(-1);
    // create connections
    console.log('Starting Node Population');
    data.tree.forEach((dataNode) => {
      const node = this.getNode(dataNode.node_id);
      for (const childNode of dataNode.children) {
        node.addChild(this.getNode(childNode));
      }
    });
    console.log('Hierarchical data setup complete!');
  }

  /**
   * Returns a node from its ID
   * @param nodeID
   * @returns
   */
  public getNode(nodeID: number): HcNode {
    if (nodeID >= this.nodes.length)
      throw new Error(`Node index out of range: ${nodeID}`);
    const toReturn = this.nodes[nodeID];
    if (toReturn == null) throw new Error('Node index out of Range');
    else return toReturn;
  }

  /**
   * Converts node IDs of leaf nodes to the corresponding data ID
   * @param nodeID
   * @returns
   */
  public nodeIDtoDataID(nodeID: number): string {
    if (this.leafNodes == null) throw new Error(`Undefined leaf node`);
    else {
      if (this.leafNodes.has(nodeID)) return this.leafNodes.get(nodeID)!;
      else throw new Error(`NodeID not a leaf node: ${nodeID}`);
    }
  }

  /**
   * Returns all dataIDs of all leaf-child nodes of the given nodeID
   * @param nodeID root node to start search from
   * @returns List of dataIDs
   */
  public getAllIDs(nodeID: number): string[] {
    const toReturn: string[] = [];
    const root: HcNode = this.getNode(nodeID);
    let nodePool: HcNode[] = [root];

    while (nodePool.length > 0) {
      const node = nodePool.pop();
      if (node!.isLeaf()) toReturn.push(this.nodeIDtoDataID(node!.nodeID));
      else nodePool = nodePool.concat(node!.getChildren());
    }
    return toReturn;
  }

  public getParent(nodeID: number): HcNode {
    for (const node of this.nodes) {
      if (node?.getChildren().filter((n) => n.nodeID == nodeID).length != 0) {
        return node!;
      }
    }

    throw new Error('Node has no parent');
  }
}

class HcNode {
  private children: HcNode[] = [];

  constructor(public nodeID: number) {}

  public isLeaf(): boolean {
    return this.children.length == 0;
  }
  public addChild(child: HcNode): void {
    this.children.push(child);
  }
  public getChildren(): HcNode[] {
    return this.children;
  }
}
