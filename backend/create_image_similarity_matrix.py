"""Geneartes similarity matrix code adjusted from https://towardsdatascience.com/image-similarity-detection-in-action-with-tensorflow-2-0-b8d9a78b2509"""

import argparse
import csv
import json
import os
from pathlib import Path
from turtle import distance
import tensorflow as tf
import tensorflow_hub as hub
from scipy.spatial.distance import cdist
import pickle

import numpy as np


def read_annotations(swg_path):
    annotations = []
    with open(swg_path, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        next(reader)
        for row in reader:
            annotations.append(row)
        return annotations


def load_images(path):
    img = tf.io.read_file(path)
    img = tf.io.decode_jpeg(img, channels=3)
    img = tf.image.resize_with_pad(img, 224, 224)
    img = tf.image.convert_image_dtype(img, tf.float32)[tf.newaxis, ...]
    return img


def get_image_feature_vectors(image_paths):

    module_handle = "https://tfhub.dev/google/imagenet/mobilenet_v2_140_224/feature_vector/4"
    module = hub.load(module_handle)

    image_features = []
    index = 1
    print("")  # new line to write progress in
    for filename in image_paths:
        print(f"File {index} / {len(image_paths)}", end="\r")
        img = load_images(filename)
        features = module(img)
        feature_set = np.squeeze(features)
        image_features.append(feature_set)
        index += 1

    return image_features


def create_distance_matrix(feature_list):
    return cdist(feature_list, feature_list, metric='cosine')


def save_to_json(distance_matrix, out_dir, file_name):
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    with open(Path(out_dir) / file_name, "w") as json_file:
        distance_matrix = np.around(distance_matrix, 8)
        data = distance_matrix.tolist()
        json.dump(data, json_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Generate similarity matrix from swg file')
    parser.add_argument('swg_file', type=str,
                        help='path to swg file')
    parser.add_argument(
        '-o',
        '--output_dir',
        help='Path to output directory',
        default='data/sim/',
        type=str)
    args = parser.parse_args()
    print("Reading annotations")
    annotations = read_annotations(args.swg_file)
    file_names = map(lambda e: e[1], annotations)
    print("Detecting features")
    features = get_image_feature_vectors(list(file_names))
    print("Calculating similarities", end="\n")
    dm = create_distance_matrix(features)
    print("Saving results to file")
    out_file_name = Path(args.swg_file).name.replace("_swg.csv", "_sim.json")
    save_to_json(dm, args.output_dir, out_file_name)
    print("Done")
