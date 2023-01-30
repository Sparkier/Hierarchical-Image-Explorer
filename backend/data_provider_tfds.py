"""Converts a Tensorflow datasets dataset into a format that can be used by data_processing.py"""
import argparse
import sys
import tarfile
import pickle
from pathlib import Path
import urllib.request
import zipfile
from PIL import Image
import pyarrow as pa
from pyarrow import _csv
import tensorflow_datasets as tfds
import os
import numpy as np

def export_images(image_dir, dataset):
    """ Helper function to save images from a Dataset"""
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

def setup_data_provider(data_set, split, data_path):
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

    swg_dict = {"image_id": file_names, "file_path": file_paths, "label": labels}
    return swg_dict
    

def write_data_table(destination, dataset, store_csv, swg_name, swg_dict):
    """Writes data into an arrow IPC file"""
    arrow_table = pa.Table.from_pydict(swg_dict)
    output_path = Path(destination) / dataset / (swg_name + ".arrow")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = pa.RecordBatchFileWriter(output_path, arrow_table.schema)
    writer.write(arrow_table)
    writer.close()
    if store_csv:
        _csv.write_csv(arrow_table, str(
            output_path).replace(".arrow", ".csv"))

def dir_path(string):
    if Path(string).is_dir():
        return string
    raise NotADirectoryError(string)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('dataset', type=str, help='Any image data set: https://www.tensorflow.org/datasets/catalog/overview')
    parser.add_argument(
        '-o',
        '--out_path',
        help='Path to generate the swg file in',
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
    swg_dict = setup_data_provider(args.dataset, args.split, args.data_path)
    write_data_table(args.out_path, args.dataset, args.store_csv, args.dataset, swg_dict)

