"""Converts a Tensorflow datasets dataset into a format that can be used by data_processing.py
    Example usage:
        python -m data_provider_tfds --dataset mnist --split test
"""
import argparse
import os
from pathlib import Path

import numpy as np
import tensorflow_datasets as tfds
from PIL import Image
import data_provider_util

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


def get_tfds_data_set(data_set, split, data_path):
    """Potentially download a tensorflow datasets dataset and extract its images and labels. """
    data, ds_stats = tfds.load(
        data_set, split=split, shuffle_files=False, with_info=True, data_dir=data_path)
    image_dir = Path(data_path, data_set, split)

    if not image_dir.exists() or len(os.listdir(image_dir)) < data.cardinality().numpy():
        export_images(image_dir, data)
    # Extract labels
    ds_info_label = ds_stats.features["label"]
    label_names = {label: ds_info_label.int2str(
        label) for label in range(0, ds_info_label.num_classes)}
    file_names = []
    file_paths = []
    labels = []
    for i, item in enumerate(data):
        if "id" in item:
            file_name = item['id'].numpy().decode("utf-8") + ".jpeg"
        elif "file_name" in item:
            file_name = item['file_name'].numpy().decode("utf-8")
        else:
            file_name = f"{i}.jpeg"
        file_names.append(file_name)
        file_paths.append(str(Path(image_dir, file_name)))
        if "label" in item:
            labels.append(label_names[item['label'].numpy()])

    return {"image_id": file_names, "file_path": file_paths, "label": labels}




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
    parser.add_argument(
        '-csv',
        '--store_csv',
        help='Stores the metadata as csv in addition to arrow',
        action='store_true',)
    parser.add_argument(
        '-s',
        '--split',
        help='Split of the dataset to use',
        default="test",
        type=str)
    args = parser.parse_args()
    swg_dict = get_tfds_data_set(args.dataset, args.split, args.data_path)
    data_provider_util.write_data_table(args.out_dir, args.dataset, args.store_csv,
                                        f"{args.dataset}_{args.split}", swg_dict)
