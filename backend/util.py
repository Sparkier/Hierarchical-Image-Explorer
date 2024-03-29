""" Utility functions for data providers. """
import csv
import itertools
from pathlib import Path

import numpy as np
import pandas as pd
import piq
import pyarrow as pa
import torch
import umap
from PIL import Image
from sklearn.manifold import TSNE
from torchvision import transforms

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


def write_data_table(destination, store_csv, data_name, data_dict):
    """Writes dictionary items in data_dict into an arrow file."""
    arrow_table = pa.Table.from_pydict(data_dict)
    output_path = destination / (data_name + ".arrow")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = pa.RecordBatchFileWriter(output_path, arrow_table.schema)
    writer.write(arrow_table)
    writer.close()
    if store_csv:
        with open(destination / (data_name + ".csv"), 'w', encoding='UTF') as file:
            csv_writer = csv.DictWriter(file, data_dict.keys())
            csv_writer.writeheader()
            csv_writer.writerow(data_dict)


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


def embedding_to_df(embedding, ids):
    """converts a 2d array of coordinates and ids to a dataframe"""
    data_frame = pd.DataFrame()
    data_frame["id"] = ids
    data_frame["x"] = embedding[:, 0]
    data_frame["y"] = embedding[:, 1]
    return data_frame


def project_2d(X, method="umap"):
    # pylint: disable=invalid-name
    """Projects high dimensional points to 2D.

    Args:
        X (array-like of shape (n_samples, n_features)): Input points
        method (str, optional): Projection method, options: ["umap", "t-sne"]. Defaults to "umap".

    Returns:
        ndarray array of shape (n_samples, 2): List of projected points
    """
    if method == "umap":
        projector = umap.UMAP()
    elif method == "t-sne":
        projector = TSNE(n_components=2, verbose=1,
                         random_state=222, perplexity=32)
    # The array must be flattened
    X_2d = np.reshape(X,
                      [X.shape[0],
                       np.prod(X.shape[1:])])
    embedding = projector.fit_transform(X_2d)
    return embedding, projector


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


def brisque_score(image_path: Path):
    """Compute BRISQUE score image quality metric
       See https://ieeexplore.ieee.org/document/6272356
    Args:
        image_path (Path): Path to image

    Returns:
        double: BRISQUE score
    """
    img = Image.open(str(image_path))
    to_tensor = transforms.Compose([
        transforms.ToTensor()
    ])
    img_normalized = to_tensor(img)
    # Input must be batched
    img_normalized = img_normalized.unsqueeze(0)
    brisque_index: torch.Tensor = piq.brisque(
        img_normalized, data_range=1., reduction='none')
    return brisque_index.item()


def export_image_quality(image_paths: iter, out_path):
    """Compute Brisque image quality and save DataFrame with its associated file name as image_id.

    Args:
        image_paths (iter): Paths to images
        out_path (Path): Path to write pickle file
    """
    # Copy iterator
    image_paths, iter_copy = itertools.tee(image_paths)
    filenames = [str(pth.name) for pth in iter_copy]
    scores = [brisque_score(img_path) for img_path in image_paths]
    pd.DataFrame({"image_id": filenames, "brisque_score": scores}
                 ).to_pickle(out_path)
