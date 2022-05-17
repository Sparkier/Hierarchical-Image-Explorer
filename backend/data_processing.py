"""Collection of image processing techniques"""
import argparse
import csv
import itertools
import json
from pathlib import Path
import sys
import pandas as pd
from sklearn.cluster import AgglomerativeClustering
from sklearn.manifold import TSNE
import tensorflow as tf
from tensorflow import keras
from keras.models import Model
import numpy as np
from scipy.spatial.distance import cdist
import hdbscan
import umap


def read_annotations(swg_path):
    """Reads annotations from given file"""
    annotation_list = []
    with open(swg_path, 'r', encoding="utf8") as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        next(reader)
        for i, row in enumerate(reader):
            annotation_list.append(row)
            if i == 20:  # ! remove me after debugging!
                break
        return annotation_list


def load_json(file_path):
    """reads the content of a json file and returns it"""
    with open(file_path, encoding='utf8') as json_file:
        return json.load(json_file)


def load_image(path, resolution):
    """Loads a single image from file and converts it to 224x224x3 numpy array"""
    img = tf.io.read_file(path)
    img = tf.io.decode_jpeg(img, channels=3)
    img = tf.image.resize_with_pad(img, resolution, resolution)
    img = tf.image.convert_image_dtype(img, tf.float32)[tf.newaxis, ...]
    return img


def load_images_from_annotations(annotations, resolution=128):
    """loads all images described in annotations"""
    images = []
    for entry in annotations:
        img = load_image(entry[1], resolution)
        images.append(img)
    return images


def save_json(file_path, content):
    """saves the a given content to a json file"""
    with open(file_path, "w", encoding="utf8") as json_file:
        json.dump(content, json_file)


def save_clustering_json_agglomerative(annotations, model, output_path):
    """Saves the resulting hierarchical tree and image labesl to a json file"""
    print("Saving results")
    image_iterator = itertools.count(len(annotations))
    treeview = [{
        'node_id': int(next(image_iterator)),
        'children': [int(x[0]), int(x[1])],
    } for x in model.children_]

    labels = []

    for index, value in enumerate(annotations):
        labels.append({"ID": value[0], "clusterID": index})

    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump({"tree": treeview, "clusters": labels}, json_file, indent=4)


def save_clustering_json_hdbscan(tree, annotations, output_name):
    """Saves the clustering tree resulting from hdbscan"""
    data_frame = tree.to_pandas()
    data_frame = data_frame.reset_index()
    tree_list = []
    for index, row in data_frame.iterrows():
        tree_list.append({
            "node_id": row["parent"],
            "children": [row["left_child"], row["right_child"]],
            "distance": row["distance"]
        })
    # generate implicit (leaf) nodes
    clusters = []
    for index, row in enumerate(annotations):
        clusters.append({
            "ID": row[0],
            "clusterID": int(index)
        })
    to_write = {"tree": tree_list, "clusters": clusters}
    with open(output_name, 'w',
              encoding='utf-8') as json_file:
        json.dump(to_write, json_file, indent=2)


def save_points_data(out_name, points_df):
    """Saves dataframe to given path"""
    points_df.to_csv(out_name, index=False)


def pixels_to_features(images):
    """squeezes pixels of an image into a single dimension"""
    return map(lambda img: np.array(img).flatten(), images)


def extract_features_vgg_16(images):
    """Takes in images as pixel data and runs a vgg-16
       pretrained on imagenet as a feature extractor"""
    model = keras.applications.VGG16(weights='imagenet', include_top=True)
    feat_extractor = Model(
        inputs=model.input, outputs=model.get_layer("fc2").output)
    image_features = []
    print("")  # new line to write progress in
    for index, img in enumerate(images):
        print(f"File {index+1} / {len(images)}", end="\r")
        img_features = feat_extractor.predict(img)
        feature_set = np.squeeze(img_features)
        image_features.append(feature_set.tolist())
    return image_features


def create_distance_matrix(feature_list, metric):
    """Converts a feature list to a distance matrix by cosine similarity"""
    return cdist(np.array(feature_list), np.array(feature_list), metric=metric)


def run_clustering_agglomerative(similarity_matrix):
    """Runs clustering based on similarity matrix with scikit
         learn agglomerative clustering"""
    model = AgglomerativeClustering(
        distance_threshold=0, n_clusters=None, affinity='precomputed', linkage="average")
    model.fit(similarity_matrix)
    return model


def run_clustering_hdbscan(similarity_matrix):
    """Runs clustering based on similarity matrix with hdbscan"""
    similarity_matrix = np.array(similarity_matrix)
    clusterer = hdbscan.HDBSCAN(metric="precomputed")
    clusterer.fit(similarity_matrix)
    return clusterer


def embedding_to_df(embedding, ids):
    """converts a 2d array of coordinates and ids to a dataframe"""
    data_frame = pd.DataFrame()
    data_frame["id"] = ids
    data_frame["x"] = embedding[:, 0]
    data_frame["y"] = embedding[:, 1]
    return data_frame


def run_tsne(features, ids):
    """Runs t-sne on a given feature list. Returns a dataframe with id and coordinates"""
    tsne = TSNE(n_components=2, verbose=1, random_state=222, perplexity=32)
    tsne_output = tsne.fit_transform(features)
    return embedding_to_df(tsne_output, ids)


def run_umap(features, ids):
    """Runs umap on a given feature list"""
    reducer = umap.UMAP()
    embedding = reducer.fit_transform(features)
    return embedding_to_df(embedding, ids)


def run_feature_extraction(args, annotations, file_name_prefix):
    """if args contains a set flag runs the
    corresponding feature extraction and returns a feature list"""
    features = None
    if args.encoding is not None:
        if args.encoding == "pixels":
            features = map(lambda img: img.tolist(), pixels_to_features(
                load_images_from_annotations(annotations)))
            features = list(features)
        elif args.encoding == "vgg-16":
            features = extract_features_vgg_16(
                load_images_from_annotations(annotations, 224))
        else:
            # load features from file
            features = load_json(args.encoding)
            print("Read feature json of length " + str(len(features)))
        print("Saving features")
        features_file_name = file_name_prefix + "_" + args.name + "_features.json"
        save_json(Path(Path(args.output_dir) / features_file_name), features)
    return features


def run_similarity_generation(args, features, file_name_prefix):
    """if args contains a flag runs the
        corresponding similarity matrix generation"""
    similarity_matrix = None
    if args.similarity_metric is not None:
        print("Generating similarity matrix")
        if features is None:
            sys.exit("Generating a similarity matrix requires a feature set. \
                Please provide either a metric or a path to a previously generated feature list")
        if args.similarity_metric in ('euclidean', 'cosine'):
            similarity_matrix = create_distance_matrix(
                features, args.similarity_metric)
        else:
            similarity_matrix = load_json(args.similarity_metric)
        similarity_matrix_file_name = file_name_prefix + \
            "_" + args.name + "_sim_matrix.json"
        save_json(Path(Path(args.output_dir) /
                  similarity_matrix_file_name),  similarity_matrix.tolist())
    return similarity_matrix


def run_clustering(args, annotations, file_name_prefix, similarity_matrix):
    """if args contains a flag runs the
        corresponding clustering algorithm"""
    if args.clustering is not None:
        print("Running clustering")
        if similarity_matrix is None:
            sys.exit("For clustering a similarity matrix is needed. Please provide a metric for\
                 generation or the path to a previously generated matrx")
        if args.clustering == "agglomerative":
            clusterer = run_clustering_agglomerative(similarity_matrix)
            clustering_file_name = file_name_prefix + \
                "_" + args.name + "_agg_clustering.json"
            save_clustering_json_agglomerative(
                annotations, clusterer, Path(args.output_dir) / clustering_file_name)
        elif args.clustering == "hdbscan":
            clusterer = run_clustering_hdbscan(similarity_matrix)
            clustering_file_name = file_name_prefix + \
                "_" + args.name + "_hdb_clustering.json"
            save_clustering_json_hdbscan(clusterer.single_linkage_tree_,
                                         annotations, Path(args.output_dir) / clustering_file_name)
        else:
            sys.exit("Unknown clusterer")


def run_dimensionality_reduction(args, annotations, file_name_prefix, features):
    """if args contains a flag runs the
    corresponding dimensionality reduction"""
    if args.dimensionality_reduction is not None:
        if features is None:
            sys.exit("Running dimensionality reduction requires a feature set. \
                Please provide either a metric or a path to a previously generated feature list")
        ids = list(map(lambda a: a[0], annotations))
        if args.dimensionality_reduction == "t-sne":
            points_df = run_tsne(features, ids)
            dim_red_file_name = file_name_prefix + \
                "_" + args.name + "_t-sne.csv"
            save_points_data(Path(args.output_dir) /
                             dim_red_file_name, points_df)
        elif args.dimensionality_reduction == "umap":
            points_df = run_umap(features, ids)
            dim_red_file_name = file_name_prefix + \
                "_" + args.name + "_umap.csv"
            save_points_data(Path(args.output_dir) /
                             dim_red_file_name, points_df)
        else:
            sys.exit("unknown dimensionality reduction method")


def run_pipeline(args):
    """Runs through the processing pipeline given by the command line args"""
    print("Reading annotations")
    annotations = read_annotations(args.swg_file)
    file_name_prefix = Path(args.swg_file).stem
    features = run_feature_extraction(args, annotations, file_name_prefix)
    similarity_matrix = run_similarity_generation(
        args, features, file_name_prefix)
    run_clustering(args, annotations, file_name_prefix, similarity_matrix)
    run_dimensionality_reduction(args, annotations, file_name_prefix, features)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Run processing on image datasets defined by swg.csv files every optional \
          parameter can be replaced with a path \
          to the corresponding output file of the processing step.')
    parser.add_argument("swg_file", type=str, help="path to swg file")
    parser.add_argument("output_dir", type=str,
                        help="directory to output generated files to")
    parser.add_argument(
        "-n", "--name", help="name for files created by the script", default="")
    parser.add_argument("-enc", "--encoding",
                        help="Method for encoding the images, options: [pixels, vgg-16]")
    parser.add_argument("-sim", "--similarity_metric",
                        help="distance measurement metric for \
                            generation of similarity matrix, options: [euclidean, cosine],\
                                 if pre-generated similarity matrix exists a path will also work")
    parser.add_argument("-clu", "--clustering",
                        help="clustering method one of [agglomerative, hdbscan]")
    parser.add_argument("-dim", "--dimensionality_reduction",
                        help="method for dimensionality reduction\
         on features. options: [t-sne, umap]")
    arguments = parser.parse_args()
    run_pipeline(arguments)
