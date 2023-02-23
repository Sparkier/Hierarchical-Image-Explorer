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
import pandas as pd
import h5py
import time

def export_images(image_dir, dataset):
    """Helper function to save images from a dataset.

    Args:
        image_dir (Path): where to find the images to be exported
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
    if data_set.element_spec.shape[-1] == 1:
        preprocessing = tf.image.grayscale_to_rgb(inputs)
    else:
        preprocessing = inputs
    return inputs, preprocessing


def setup_feature_extraction_model(data_set, model, layer):
    """Configure feature extraction model to handle data set.

    Args:
        data_set (Tensorflow.DataSet): Data set that will be used for prediction.

    Returns:
        Keras.Model: Mode
    """
    def resize_images(images, image_size):
        return tf.image.resize(images, image_size)
    if model == "VGG16":
        image_size = (224, 224)
    elif model == "InceptionV3":
        image_size = (299, 299)
    # Resize images before providing data to preprocessing
    # to avoid errors with different image sizes in one batch
    data_set = data_set.map(lambda row: resize_images(row, image_size),
                            num_parallel_calls=tf.data.AUTOTUNE)

    inputs, preprocessing = model_preprocessing(data_set)
    if model == "VGG16":
        model = tf.keras.applications.VGG16(
            include_top=True, weights='imagenet')
        preprocessing = tf.keras.applications.vgg16.preprocess_input(
            preprocessing)
        if layer == "":
            layer = "fc2"
    elif model == "InceptionV3":
        model = tf.keras.applications.InceptionV3(
            include_top=True, weights='imagenet')
        preprocessing = tf.keras.applications.inception_v3.preprocess_input(
            preprocessing)
        if layer == "":
            layer = "predictions"
    print(model.summary())

    feat_extractor_output = tf.keras.Model(
        inputs=model.input, outputs=model.get_layer(layer).output)(preprocessing)
    feature_extractor_with_preprocessing = tf.keras.Model(
        inputs=inputs, outputs=feat_extractor_output)

    return data_set, feature_extractor_with_preprocessing


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

    image_quality_path = Path(image_dir, "image_quality.pkl")
    if image_quality_path.exists():
        #util.export_image_quality(image_dir.glob('*.jpeg'), image_quality_path)
        # Dataframe with image_id and image quality
        imge_quality_df = pd.read_pickle(image_quality_path)
        data_dict = pd.merge(pd.DataFrame(data_dict), imge_quality_df,
                            on="image_id", how="left").to_dict('list')

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
                        required=False, choices=["VGG16", "InceptionV3"])
    parser.add_argument("--feature_extraction_model_layer",
                        help='Model layer to use, empty for a default layer',
                        default="")
    parser.add_argument("-p", "--projection_method", default="umap",
                        help="method for reducing model output to two dimensions",
                        choices=["t-sne", "umap"])
    args = parser.parse_args()
    ds, dataset_info = get_tfds_image_data_set(
        args.dataset, args.split, args.data_path)
    swg_dict = convert_tfds_data_set(args.dataset, args.split, args.data_path)
    output_dir = Path(args.out_dir, args.dataset)
    swg_name = f"{args.dataset}_{args.split}"

    if args.feature_extraction_model:
        swg_name = f"{swg_name}_{args.feature_extraction_model}_{args.feature_extraction_model_layer}"
        activations_path = Path("cache", args.feature_extraction_model,
                                args.dataset,
                                f"activations_{args.split}_{args.feature_extraction_model_layer}.h5")
        if not activations_path.exists():
            ds, feature_extractor = setup_feature_extraction_model(
                ds, args.feature_extraction_model, args.feature_extraction_model_layer)
            activations_path.parent.mkdir(parents=True, exist_ok=True)
            with h5py.File(activations_path, 'w') as file_handle:
                features = feature_extractor.predict(ds.take(1).batch(1))
                total_num_inputs = ds.cardinality().numpy()
                output_shape = [total_num_inputs, np.prod(features.shape[:])]
                BYTES_PER_FLOAT = 4
                num_activations_in_one_mb = min(total_num_inputs, max(
                    1, int(1000000 / (np.prod(output_shape[1:])*BYTES_PER_FLOAT))))
                chunk_size = tuple([num_activations_in_one_mb] + output_shape[1:])
                dset = file_handle.create_dataset(
                    "activations", output_shape, compression="gzip", chunks=chunk_size)
                iterator = 0
                start = time.time()
                for batch in ds.batch(128).prefetch(tf.data.AUTOTUNE):
                    num_inputs = batch.shape[0]
                    features = feature_extractor.predict(batch)
                    flattened = np.reshape(features,
                                [features.shape[0],
                                np.prod(features.shape[1:])])
                    dset[iterator:iterator+num_inputs] = flattened
                    iterator += num_inputs
                    print(f"Processed {iterator}/{total_num_inputs}")
                print(f'Time to process {total_num_inputs}: {time.time()-start:.2f}')   
        projections_2d_path = output_dir / \
            f"{swg_name}_{args.projection_method}.arrow"
        with h5py.File(activations_path, 'r') as f_act:
            features = f_act["activations"]
            embedding = util.project_2d(features, args.projection_method)
        data_frame = pd.DataFrame({"id": swg_dict["image_id"],
                                "x": embedding[:, 0], "y": embedding[:, 1]})

        util.save_points_data(projections_2d_path, data_frame)

        config = {"swg": f"{output_dir}/{swg_name}.arrow",
                  "points2d": str(projections_2d_path), "imgDataRoot": ""}

        config_path = Path(
            "configurations", f"config_{swg_name}_{args.projection_method}.json")
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as config_file:
            json.dump(config, config_file)

    util.write_data_table(output_dir, args.store_csv,
                          swg_name, swg_dict)
