"""Converts a Tensorflow datasets dataset into a format that can be used by data_processing.py
    Example usage:
        python -m data_provider_tfds --dataset mnist --split test
"""
import argparse
import json
import os
import time
from pathlib import Path

import pickle
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow_datasets as tfds
import util
import util_tfds
from PIL import Image


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




def setup_feature_extraction_model(data_set, model, layer):
    """Configure feature extraction model to handle data set.

    Args:
        data_set (Tensorflow.DataSet): Data set that will be used for prediction.

    Returns:
        Keras.Model: Model
    """
    data_set, inputs, preprocessing = util_tfds.model_preprocessing(data_set, model)
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
    elif model == "Xception-malaria":
        model_path = "models/Xception-malaria.keras"
        model = tf.keras.models.load_model(model_path)
        # model = tf.saved_model.load(model_path)
        if layer == "":
            layer = "global_average_pooling2d"
    print(model.summary())

    feat_extractor_output = tf.keras.Model(
        inputs=model.input, outputs=model.get_layer(layer).output)(preprocessing)
    feature_extractor_with_preprocessing = tf.keras.Model(
        inputs=inputs, outputs=feat_extractor_output)

    return data_set, feature_extractor_with_preprocessing


def export_activations(dataset, out_hdf5_path, model):
    """Export activations from a model."""
    out_hdf5_path.parent.mkdir(parents=True, exist_ok=True)
    with h5py.File(out_hdf5_path, 'w') as file_handle:
        activations = model.predict(dataset.take(1).batch(1))
        total_num_inputs = dataset.cardinality().numpy()
        output_shape = [total_num_inputs, np.prod(activations.shape[:])]
        bytes_per_float = 4
        num_activations_in_one_mb = min(total_num_inputs, max(
                    1, int(1000000 / (np.prod(output_shape[1:])*bytes_per_float))))
        chunk_size = tuple(
                    [num_activations_in_one_mb] + output_shape[1:])
        dset = file_handle.create_dataset(
                    "activations", output_shape, compression="gzip", chunks=chunk_size)
        current_index = 0
        start = time.time()
        for batch in dataset.batch(128).prefetch(tf.data.AUTOTUNE):
            num_inputs = batch.shape[0]
            activations = model.predict(batch)
            flattened = np.reshape(activations,
                                           [activations.shape[0],
                                            np.prod(activations.shape[1:])])
            dset[current_index:current_index+num_inputs] = flattened
            current_index = current_index + num_inputs
            print(f"Processed {current_index}/{total_num_inputs}")
        print(f'Time to process {total_num_inputs}: {time.time()-start:.2f}')

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
    parser.add_argument("--data_path", type=util.dir_path,
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
                        required=False, choices=["VGG16", "InceptionV3", "Xception-malaria"])
    parser.add_argument("--feature_extraction_model_layer",
                        help='Model layer to use, empty for a default layer',
                        default="")
    parser.add_argument("-p", "--projection_method", default="umap",
                        help="method for reducing model output to two dimensions",
                        choices=["t-sne", "umap"])
    parser.add_argument("--projection_model_path",
                        help='Model layer to use, empty for a default layer',
                        default=None)
    args = parser.parse_args()
    ds, dataset_info = tfds.load(
        args.dataset, split=args.split, shuffle_files=False,
        with_info=True, data_dir=args.data_path)
    output_dir = Path(args.out_dir, args.dataset)

    dataset_dir = Path(args.data_path, args.dataset, args.split)
    if not dataset_dir.exists() or len(os.listdir(dataset_dir)) < ds.cardinality().numpy():
        export_images(dataset_dir, ds)
    data = util_tfds.decode_tfds_image_data_set(ds, dataset_info, dataset_dir)

    data_name = f"{args.dataset}_{args.split}"
    if args.feature_extraction_model:
        data_name = f"{data_name}_{args.feature_extraction_model}_" \
                    f"{args.feature_extraction_model_layer}"
        activations_base = f"cache/{args.feature_extraction_model}/" \
                    f"{args.dataset}/activations_{args.split}" \
                    f"_{args.feature_extraction_model_layer}"
        activations_path = Path(f"{activations_base}.h5")
        if not activations_path.exists():
            ds, feature_extractor = setup_feature_extraction_model(
                ds, args.feature_extraction_model, args.feature_extraction_model_layer)
            # Activations might not fit in memory, so we export them in chunks to file
            export_activations(ds, activations_path, feature_extractor)
        projections_2d_path = output_dir / \
            f"{data_name}_{args.projection_method}.arrow"
        with h5py.File(activations_path, 'r') as f_act:
            features = f_act["activations"]
            # Project activations to 2D.
            # Either use a precomputed projection model or compute a new one
            if args.projection_model_path:
                projection_model_path = Path(args.projection_model_path)
            else:
                projection_model_path = Path(f'{activations_base}_projection_model.sav')
            if projection_model_path.exists():
                projector = pickle.load((open(projection_model_path, 'rb')))
                embedding = projector.transform(features)
            else:
                embedding, projector = util.project_2d(features, args.projection_method)
                pickle.dump(projector, open(projection_model_path, 'wb'))
                print(f"Saved UMAP model to: {projection_model_path}."
                      "You can use this model to project new data to the same 2D space."
                      "Use the --projection_model_path argument.")
                print(f"--projection_model_path {projection_model_path}")
        data_frame = pd.DataFrame({"id": data["image_id"],
                                   "x": embedding[:, 0], "y": embedding[:, 1]})

        projections_2d_path.parent.mkdir(parents=True, exist_ok=True)
        util.save_points_data(projections_2d_path, data_frame)

        config = {"table": f"{output_dir}/{data_name}.arrow",
                  "points2d": str(projections_2d_path), "imgDataRoot": ""}

        config_path = Path(
            "configurations", f"config_{data_name}_{args.projection_method}.json")
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as config_file:
            json.dump(config, config_file)

    util.write_data_table(
        output_dir, args.store_csv, data_name, data)
