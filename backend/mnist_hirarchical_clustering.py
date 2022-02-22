"""Does basic hierarchical clustering on the mnist test data"""

import argparse
import json
import itertools
import csv
import os
from PIL import Image
from numpy import asarray
from sklearn.cluster import AgglomerativeClustering
from neo4j import GraphDatabase


def start_neo4j_docker():
    """Starts a docker container with neo4j"""
    docker_command_neo4j = "docker run --name hie_neo4j -p7474:7474 -p7687:7687 -d -v {pwd}/data/neo4j/data:/data -v {pwd}/data/neo4j/logs:/logs -v {pwd}/data/neo4j/import:/var/lib/neo4j/import -v {pwd}/data/neo4j/plugins:/plugins --env NEO4J_AUTH=neo4j/password neo4j:latest".format(
        pwd="\"%cd%\"")  # needs probably needs to be changed for linux systems
    os.system(docker_command_neo4j)


def read_annoations(datapath):
    """Reads in a given csv file"""
    # read in annotations
    annotations = []

    with open(datapath, encoding='utf-8') as csvfile:
        csv_reader = csv.reader(csvfile)
        next(csv_reader)
        for row in csv_reader:
            annotations.append(row)
    print("Opened Annotation File")
    return annotations


def read_image_data(annotations):
    """Reads images from annotations and converts them to 1D Array"""
    images = []
    print("Converting images to Numpy Arrays")
    # load images from disk and convert them:
    for annotation in annotations:
        image = Image.open(annotation[1])
        data = asarray(image).reshape(1, -1)  # from 2D => 1D
        images.append(data[0])
    return images


def cluster_data(images):
    """Runs Clustering on a given image Array"""
    print("Started Clustering")
    model = AgglomerativeClustering(distance_threshold=0, n_clusters=None)
    model.fit(images)
    return model


def save_clustering_json(annotations, images, model, output_path):
    """Saves the resulting hierarchical tree and image labesl to a json file"""
    print("Saving results")
    image_iterator = itertools.count(len(images))
    treeview = [{
        'node_id': int(next(image_iterator)),
        'children': [int(x[0]), int(x[1])],
    } for x in model.children_]

    labels = []

    for index, value in enumerate(annotations):
        labels.append({"ID": value[0], "clusterID": index})

    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump({"tree": treeview, "clusters": labels}, json_file, indent=4)


def save_clustering_neo4j(annotations, images, model):
    """Saves the resulting hierarchical tree and image labels to a freshly created neo4j database"""
    # create driver
    uri = "bolt://localhost:7687"
    driver = GraphDatabase.driver(uri, auth=("neo4j", "password"))
    with driver.session() as session:
        # create implicit nodes
        with session.begin_transaction() as transaction:
            for index, value in enumerate(annotations):
                transaction.run(
                    "CREATE (a:leaf_node {id: $id, clusterID: $clusterID})", id=value[0], clusterID=index)
            transaction.commit()

        image_iterator = itertools.count(len(images))
        treeview = [{
            'node_id': int(next(image_iterator)),
            'children': [int(x[0]), int(x[1])],
        } for x in model.children_]
        # create tree
        with session.begin_transaction() as transaction:

            # create nodes:
            for node in treeview:
                transaction.run(
                    "CREATE (a:tree_node {clusterID: $clusterID})", clusterID=node["node_id"])
            transaction.commit()

        with session.begin_transaction() as transaction:
            # create tree relations
            for node in treeview:
                for child in node["children"]:
                    transaction.run(
                        "MATCH (p), (c) WHERE p.clusterID = $parentID AND c.clusterID = $childID CREATE (p)-[r: RELTYPE {name: p.clusterID + '->' + c.clusterID}]-> (c)", parentID=node["node_id"], childID=child)
            transaction.commit()

    driver.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-a',
        '--annotation_file',
        help='Path to annotation file for the dataset',
        default="data/mnist/mnist_test_swg.csv",
        type=str)
    parser.add_argument(
        '-o',
        '--output_file',
        help='Path to output json file',
        default='data/mnist/ClusteringTree.json',
        type=str)
    parser.add_argument('--no-neo4j', dest='use_neo4j', action='store_false')
    parser.set_defaults(use_neo4j=True)

    args = parser.parse_args()
    if args.use_neo4j:
        start_neo4j_docker()
    mnist_annotations = read_annoations(args.annotation_file)
    mnist_images = read_image_data(mnist_annotations)
    mnist_model = cluster_data(mnist_images)
    save_clustering_json(mnist_annotations, mnist_images,
                         mnist_model, args.output_file)
    if args.use_neo4j:
        save_clustering_neo4j(mnist_annotations, mnist_images, mnist_model)
    print("Done")
