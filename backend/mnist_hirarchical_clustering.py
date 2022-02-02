"""Does basic hierarchical clustering on the mnist test data"""

import argparse
import json
import itertools
import csv
from PIL import Image
from numpy import asarray
from sklearn.cluster import AgglomerativeClustering


def read_annoations(datapath):
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
    images = []
    print("Converting images to Numpy Arrays")
    # load images from disk and convert them:
    for annotation in annotations:
        image = Image.open(annotation[1])
        data = asarray(image).reshape(1,-1) # from 2D => 1D
        images.append(data[0])
    return images


def cluster_data(images):
    print("Started Clustering")
    model = AgglomerativeClustering(distance_threshold=0, n_clusters=None)
    model.fit(images)
    return model


def save_clustering(annotations, images, model, output_path):
    print("Saving results")
    image_iterator = itertools.count(len(images))
    treeview = [{
    'node_id': int(next(image_iterator)),
    'children': [int(x[0]), int(x[1])],
    } for x in model.children_]

    labels = []

    for i in range(0,len(annotations)):
        labels.append({"ID":annotations[i][0],"clusterID":i})

    with open(output_path,'w', encoding='utf-8') as json_file:
        json.dump({"tree":treeview,"clusters":labels},json_file, indent=4)


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

    args = parser.parse_args()

    annotations = read_annoations(args.annotation_file)
    images = read_image_data(annotations)
    model = cluster_data(images)
    save_clustering(annotations, images, model, args.output_file)
    print("Done")
