"""Converts a Tensorflow datasets dataset into a format that can be used by data_processing.py
    Example usage:
        python -m data_provider_tfds --dataset mnist --split test
"""
import argparse
import json
import os
from pathlib import Path
import pickle

import numpy as np
import tensorflow as tf
import tensorflow_datasets as tfds
from PIL import Image
import util
import pandas

def export_images(image_dir, dataset):
    """Helper function to save images from a dataset.

    Args:
        image_dir (Path): where to find the iages to be exported
        dataset (Dataset): the dataset from which to export the images
    """
    image_dir.mkdir(parents=True, exist_ok=True)
    for i, item in dataset.enumerate():
        if isinstance(item, dict):
            image = np.squeeze(item["image"].numpy())
            if "file_name" in item:
                file_name = item["file_name"].numpy().decode("utf-8")
            elif "id" in item:
                # Exist in CIFAR10
                file_name = item["id"].numpy().decode("utf-8") + ".jpeg"
            else:
                file_name = f"{i}.jpeg"

        else:
            image = np.squeeze(item[0].numpy())
            file_name = f"{i}.jpeg"
        if len(image.shape) == 2 or image.shape[-1] == 1:
            image = Image.fromarray((image).astype(np.uint8), 'L')
        else:
            image = Image.fromarray((image).astype(np.uint8), 'RGB')
        image.save(Path(image_dir, file_name))

def model_preprocessing(data_set):
    inputs = tf.keras.layers.Input(shape=data_set.element_spec.shape.as_list())
    preprocessing = tf.keras.layers.Resizing(224, 224)(inputs)

    if data_set.element_spec.shape[2] == 1:
        preprocessing = tf.image.grayscale_to_rgb(preprocessing)
    preprocessing = tf.keras.applications.vgg16.preprocess_input(preprocessing)
    return inputs, preprocessing

def setup_feature_extraction_model(data_set):
    """Configure feature extraction model to handle data set.

    Args:
        data_set (Tensorflow.DataSet): Data set that will be used for prediction.

    Returns:
        Keras.Model: Mode
    """
    inputs, preprocessing = model_preprocessing(data_set)
    model = tf.keras.applications.VGG16(
        include_top=True, weights='imagenet')
    feat_extractor_output = tf.keras.Model(
        inputs=model.input, outputs=model.get_layer("fc2").output)(preprocessing)
    feature_extractor_with_preprocessing = tf.keras.Model(
        inputs=inputs, outputs=feat_extractor_output)

    return feature_extractor_with_preprocessing

def get_tfds_image_data_set(data_set, split, data_path):
    """Setup a tensorflow dataset image dataset.

    Args:
        data_set (str): Name of data set
        split (str): Name of split, i.e., train or test
        data_path (Path): Path to directory of tensorflow datasets

    Returns:
        tensorflow.DataSet, tfds.core.DatasetInfo: Image DataSet and its info.
    """
    data, ds_stats = tfds.load(
    data_set, split=split, shuffle_files=False, with_info=True, data_dir=data_path)
    return data.map(lambda elem: elem['image']), ds_stats

def convert_tfds_data_set(data_set, split, data_path):
    """Potentially download a tensorflow datasets dataset and extract its images and labels. """
    data, ds_stats = tfds.load(
        data_set, split=split, shuffle_files=False, with_info=True, data_dir=data_path)
    image_dir = Path(data_path, data_set, split)

    if not image_dir.exists() or len(os.listdir(image_dir)) < data.cardinality().numpy():
        export_images(image_dir, data)

    # Required entries
    data_dict = {"image_id": [], "file_path": []}

    for row_idx, row in enumerate(data):
        if "id" in row:
            file_name = row['id'].numpy().decode("utf-8") + ".jpeg"
        elif "file_name" in row:
            file_name = row['file_name'].numpy().decode("utf-8")
        else:
            file_name = f"{row_idx}.jpeg"
        data_dict["image_id"].append(file_name)
        data_dict["file_path"].append(str(Path(image_dir, file_name)))

        for key, val in row.items():
            feature = ds_stats.features[key]
            if isinstance(feature, tfds.features.ClassLabel):
                if key not in data_dict:
                    data_dict[key] = []
                data_dict[key].append(feature.int2str(val.numpy()))
            # if key == "objects":
            #     if "object_count" not in data_dict: data_dict["object_count"] = []
            #     data_dict["object_count"].append(len(val))
                # for object_key, object in val.items():
                #     object_name = f"object_{object_key}"
                #     if object_name not in data_dict: data_dict[object_name] = []

                #print(val)

    return data_dict




def dir_path(string):
    """Check if a string is a path directory.

    Args:
        string (str): the string to be checked

    Raises:
        NotADirectoryError: error indicating the string is not a directory path

    Returns:
        str: the original string
    """
    if Path(string).is_dir():
        return string
    raise NotADirectoryError(string)

if __name__ == "__main__":
    # pylint: disable=duplicate-code

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--dataset', type=str,
        help='Any image data set, .e.g, binarized_mnist: \
            https://www.tensorflow.org/datasets/catalog/overview')
    parser.add_argument(
        '-o',
        '--out_dir',
        help='Directory to generate dataset description files in (.arrow, .csv)',
        default="data",
        type=str)
    parser.add_argument("--data_path", type=dir_path,
                        default='D:/data/tensorflow_datasets')
    parser.add_argument('-csv', '--store_csv',
        help='Stores the metadata as csv in addition to arrow',
        action='store_true',)
    parser.add_argument(
        '-s',
        '--split',
        help='Split of the dataset to use',
        default="test",
        type=str)
    parser.add_argument("--feature_extraction_model", help='Tensorflow keras model',
                required=False, choices=["VGG16"])
    parser.add_argument("-p", "--projection_method", default="umap",
                        help="method for reducing model output to two dimensions",
                        choices=["t-sne", "umap"])
    args = parser.parse_args()
    ds, dataset_info = get_tfds_image_data_set(args.dataset, args.split, args.data_path)
    swg_dict = convert_tfds_data_set(args.dataset, args.split, args.data_path)
    output_dir = Path(args.out_dir, args.dataset)
    swg_name = f"{args.dataset}_{args.split}"
    util.write_data_table(output_dir, args.store_csv,
                                    swg_name, swg_dict)
    if args.feature_extraction_model:
        feature_extractor = setup_feature_extraction_model(ds)
        predictions_path = Path("cache", args.feature_extraction_model, args.dataset, "predictions.pkl")
        if predictions_path.exists():
            with open(predictions_path, "rb") as predictions_file:
                features = pickle.load(predictions_file)
        else:
            ds = ds.batch(128).cache().prefetch(tf.data.AUTOTUNE)
            features = feature_extractor.predict(ds)
            predictions_path.parent.mkdir(parents=True, exist_ok=True)
            with open(predictions_path, "wb") as output:
                pickle.dump(features, output)
        embedding = util.project_2d(features, args.projection_method)
        data_frame = pandas.DataFrame({"id": swg_dict["image_id"],
                                    "x": embedding[:, 0], "y": embedding[:, 1]})
        projections_2d_path = output_dir / f"{swg_name}_{args.projection_method}.arrow"
        util.save_points_data(projections_2d_path, data_frame)

        config = {"swg": f"{output_dir}/{swg_name}.arrow", "points2d": str(projections_2d_path), "imgDataRoot": ""}

        config_path = Path("configurations", f"config_{swg_name}_{args.projection_method}.json")
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as config_file:
            json.dump(config, config_file)