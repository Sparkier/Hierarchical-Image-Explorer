"""Collection of image processing techniques"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas
import pyarrow as pa
import pyarrow.csv as csv
import pyarrow.json as pajson
import pyarrow.feather as feather
import pyarrow.parquet as parquet
import tensorflow as tf
import util
from keras.models import Model
from tensorflow import keras


def read_annotations(path: Path):
    """Read annotations from file path.

    Supported file extensions: .csv, .feather, .json, .parquet, .arrow
    """
    readict = {
        ".csv": {"read": csv.read_csv},
        ".feather": {"read": feather.read_table},
        ".json": {"read": pajson.read_json},
        ".parquet": {"read": parquet.read_table},
        ".arrow": {"read": lambda path: pa.ipc.open_file(path).read_all()},
    }
    ext = path.suffix
    return readict[ext]["read"](path)


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


def extract_features_vgg_16(images):
    """Takes in images as pixel data and runs a vgg-16
    pretrained on imagenet as a feature extractor"""
    model = keras.applications.VGG16(weights="imagenet", include_top=True)
    feat_extractor = Model(inputs=model.input, outputs=model.get_layer("fc2").output)
    image_features = []
    print("")  # new line to write progress in
    for index, img in enumerate(images):
        print(f"File {index+1} / {len(images)}", end="\r")
        img_features = feat_extractor.predict(img)
        feature_set = np.squeeze(img_features)
        image_features.append(feature_set.tolist())
    return np.array(image_features)


def run_feature_extraction(encoding_method, annotations):
    """if args contains a set flag runs the
    corresponding feature extraction and returns a feature list"""
    features = None
    if encoding_method is not None:
        if encoding_method == "pixels":
            features = map(
                lambda img: img.tolist(),
                util.pixels_to_features(load_images_from_annotations(annotations)),
            )
            features = np.array(features)
        elif encoding_method == "vgg-16":
            features = extract_features_vgg_16(
                load_images_from_annotations(annotations, 224)
            )
        elif encoding_method.startswith("arrow"):
            column_name = encoding_method.replace("arrow.", "")
            print(column_name)
            features = np.array(
                annotations.column(column_name).combine_chunks().to_pylist()
            )
        else:
            sys.exit("unknown encoding reduction method: " + encoding_method)
    return features


def run_dimensionality_reduction(
    dimensionality_reduction_method, annotations, features, out_dir, out_name
):
    """if args contains a flag runs the
    corresponding dimensionality reduction"""
    if dimensionality_reduction_method is not None:
        if features is None:
            sys.exit(
                "Running dimensionality reduction requires a feature set. \
                Please provide either a metric or a path to a previously generated feature list"
            )
        out_path = out_dir / f"{out_name}_{dimensionality_reduction_method}.arrow"
        embedding, _ = util.project_2d(features, dimensionality_reduction_method)
        points_df = pandas.DataFrame(
            {"id": annotations["image_id"], "x": embedding[:, 0], "y": embedding[:, 1]}
        )
        util.save_points_data(out_path, points_df)
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run image encoding and dimensionality reduction \
                for each file in the supplied table. \
                Every optional parameter can be replaced with a path to the \
                corresponding output file of the processing step."
    )
    parser.add_argument(
        "--table",
        type=str,
        help="Path to table with columns file_path and image_id. \
            Supports .csv, .feather, .json, .parquet, .arrow",
    )
    parser.add_argument(
        "-enc",
        "--encoding",
        help="Method for encoding the images, options:\
                             [pixels, vgg-16, arrow.<column_name>]",
    )
    parser.add_argument(
        "-p",
        "--projection_method",
        default="umap",
        help="method for dimensionality reduction\
         on features. options: [t-sne, umap]",
    )
    args = parser.parse_args()

    # Run pipeline
    print("Reading annotations")
    annotation = read_annotations(Path(args.table))
    output_dir = Path(args.table).parent
    name = Path(args.table).stem
    model_features = run_feature_extraction(args.encoding, annotation)
    projections_2d_path = run_dimensionality_reduction(
        args.projection_method, annotation, model_features, output_dir, name
    )

    config = {
        "table": args.table,
        "points2d": str(projections_2d_path),
        "imgDataRoot": "",
    }
    config_path = Path("configurations", f"config_{name}_{args.projection_method}.json")
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as config_file:
        json.dump(config, config_file)
