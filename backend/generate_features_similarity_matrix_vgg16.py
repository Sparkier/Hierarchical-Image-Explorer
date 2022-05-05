"""Geneartes feature vectors and from that a similarity matrix. Code adjusted from
https://towardsdatascience.com/image-similarity-detection-in-action-with-tensorflow-2-0-b8d9a78b2509"""

import argparse
import csv
import json
from pathlib import Path
import tensorflow as tf
import tensorflow_hub as hub
from scipy.spatial.distance import cdist
import numpy as np
from tensorflow import keras
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.imagenet_utils import preprocess_input
from tensorflow.keras.models import Model

model = keras.applications.VGG16(weights='imagenet', include_top=True)
feat_extractor = Model(
    inputs=model.input, outputs=model.get_layer("fc2").output)


def read_annotations(swg_path):
    """Reads annotations from given file"""
    annotation_list = []
    with open(swg_path, 'r', encoding="utf8") as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        next(reader)
        for row in reader:
            annotation_list.append(row)
        return annotation_list


def load_image(path):
    """Loads an image from a given path"""
    img = image.load_img(path, target_size=model.input_shape[1:3])
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    return img, x


def get_image_feature_vectors(image_paths):
    """Runs feature-detection with vgg-16 network pretrained on imagenet"""
    image_features = []
    print("")  # new line to write progress in
    for index, filename in enumerate(image_paths):
        print(f"File {index+1} / {len(image_paths)}", end="\r")
        _, x = load_image(filename)
        img_features = feat_extractor.predict(x)
        feature_set = np.squeeze(img_features)
        image_features.append(feature_set)

    return image_features


def create_distance_matrix(feature_list):
    """Converts a feature list to a distance matrix by cosine similarity"""
    return cdist(feature_list, feature_list, metric='cosine')


def save_similarity_to_json(distance_matrix, out_dir, file_name):
    """Saves distance matrix to json file"""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    with open(Path(out_dir) / file_name, "w", encoding="utf8") as json_file:
        distance_matrix = np.around(distance_matrix, 8)
        data = distance_matrix.tolist()
        json.dump(data, json_file)


def save_feature_vectors_to_json(annos, features, out_dir, file_name):
    """Saves features list to json file"""
    feature_list = []
    for index, row in enumerate(annos):
        feature_list.append({
            "ID": row[0],
            "features": features[index].tolist()})
    with open(Path(out_dir) / file_name, "w", encoding="utf8") as json_file:
        json.dump(feature_list, json_file)


def main(parameters):
    """Main Method"""
    print("Reading annotations")
    annotations = read_annotations(parameters.swg_file)
    file_names = map(lambda e: e[1], annotations)
    print("Detecting features")
    features = get_image_feature_vectors(list(file_names))
    print("Calculating similarities", end="\n")
    distance_matrix = create_distance_matrix(features)
    print("Saving results to file")
    out_file_name_sim = Path(parameters.swg_file).name.replace(
        "_swg.csv", "_sim.json")
    out_file_name_features = Path(
        parameters.swg_file).name.replace("_swg.csv", "_feat.json")
    save_similarity_to_json(
        distance_matrix, parameters.output_dir, out_file_name_sim)
    save_feature_vectors_to_json(
        annotations, features, parameters.output_dir, out_file_name_features)
    print("Done")


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
    main(args)
