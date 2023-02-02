"""Collection of image processing techniques"""
import argparse
from pathlib import Path
import sys
import json
import pandas as pd
from sklearn.manifold import TSNE
import tensorflow as tf
from tensorflow import keras
from keras.models import Model
import numpy as np
import umap
import pyarrow as pa



def read_annotations(swg_path):
    """Reads annotations from given file"""
    with pa.memory_map(swg_path, 'r') as source:
        loaded_arrays = pa.ipc.open_file(source).read_all()
        return loaded_arrays


def load_image(path, resolution):
    """Loads a single image from file and converts it to 224x224x3 numpy array"""
    img = tf.io.read_file(path)
    img = tf.io.decode_jpeg(img, channels=3)
    img = tf.image.resize_with_pad(img, resolution, resolution)
    img = tf.image.convert_image_dtype(img, tf.int8)[tf.newaxis, ...]
    return img


def load_images_from_annotations(annotations, resolution=128):
    """loads all images described in annotations"""
    images = []
    for entry in annotations.column("file_path"):
        img = load_image(str(entry), resolution)
        images.append(img)
    return images


def save_points_data(out_name, points_df):
    """Saves dataframe to given path"""
    schema = pa.Schema.from_pandas(points_df, preserve_index=False)
    table = pa.Table.from_pandas(points_df, preserve_index=False)

    writer = pa.ipc.new_file(out_name, schema)
    writer.write(table)
    writer.close()


def pixels_to_features(images):
    """squeezes pixels of an image into a single dimension"""
    return map(lambda img: np.array(img).flatten(), images)


def extract_features_vgg_16(images):
    """Takes in images as pixel data and runs a vgg-16
       pretrained on imagenet as a feature extractor"""
    model = keras.applications.VGG16(weights="imagenet", include_top=True)
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


def run_feature_extraction(encoding_method, annotations):
    """if args contains a set flag runs the
    corresponding feature extraction and returns a feature list"""
    features = None
    if encoding_method is not None:
        if encoding_method == "pixels":
            features = map(lambda img: img.tolist(), pixels_to_features(
                load_images_from_annotations(annotations)))
            features = list(features)
        elif encoding_method == "vgg-16":
            features = extract_features_vgg_16(
                load_images_from_annotations(annotations, 224))
        elif encoding_method.startswith("arrow"):
            column_name = encoding_method.replace("arrow.", "")
            print(column_name)
            return annotations.column(column_name).combine_chunks().to_pylist()
        else:
            sys.exit("unknown encoding reduction method: " + encoding_method)
    return features


def run_dimensionality_reduction(dimensionality_reduction_method, annotations,
                                features, out_dir, out_name):
    """if args contains a flag runs the
    corresponding dimensionality reduction"""
    if dimensionality_reduction_method is not None:
        if features is None:
            sys.exit("Running dimensionality reduction requires a feature set. \
                Please provide either a metric or a path to a previously generated feature list")
        ids = annotations.column("image_id")
        out_path = out_dir / f"{out_name}_{dimensionality_reduction_method}.arrow"
        if dimensionality_reduction_method == "t-sne":
            points_df = run_tsne(features, ids)
        elif dimensionality_reduction_method == "umap":
            points_df = run_umap(features, ids)
        else:
            sys.exit("unknown dimensionality reduction method")
        save_points_data(out_path, points_df)
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run processing on image datasets defined by swg.csv files every optional \
          parameter can be replaced with a path \
          to the corresponding output file of the processing step.")
    parser.add_argument("--swg_file", type=str, help="path to swg file")
    parser.add_argument(
        "-n", "--name", help="name for files created by the script", default="")
    parser.add_argument("-enc", "--encoding",
                        help="Method for encoding the images, options:\
                             [pixels, vgg-16, arrow.<column_name>]")
    parser.add_argument("-dim", "--dimensionality_reduction",
                        help="method for dimensionality reduction\
         on features. options: [t-sne, umap]")
    args = parser.parse_args()

    # Run pipeline
    print("Reading annotations")
    annotation = read_annotations(args.swg_file)
    output_dir = Path(args.swg_file).parent
    name = Path(args.swg_file).stem
    model_features = run_feature_extraction(args.encoding, annotation)
    projections_2d_path = run_dimensionality_reduction(
        args.dimensionality_reduction, annotation, model_features, output_dir, name)

    config = {"swg": args.swg_file, "points2d": projections_2d_path, "imgDataRoot": ""}
    json.dump(config, open("configurations" / f"config_{name}.json", "w", encoding="utf-8"))
