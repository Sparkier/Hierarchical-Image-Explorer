"""Module that downloads datasets and generates corresponding swg-files"""
import pickle
import argparse
import csv
import sys
import tarfile
from pathlib import Path
import urllib.request
import zipfile

datasets = [
    {"name": "mnist_test",
     "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",  # pylint: disable=line-too-long
     "filetype": "zip",
     "img_root": "MNIST Dataset JPG format/MNIST - JPG - testing/",
     "label_source": "folder", "id_source": "filename"},
    {"name": "mnist_train",
     "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",  # pylint: disable=line-too-long
     "filetype": "zip",
     "img_root": "MNIST Dataset JPG format/MNIST - JPG - training/",
     "label_source": "folder",
     "id_source": "filename"},
    {"name": "flowers",
     "url": "http://download.tensorflow.org/example_images/flower_photos.tgz",
     "filetype": "tgz",
     "img_root": "flower_photos/",
     "label_source": "folder",
     "id_source": "generate"}
]

TMP_ARCHIVE_NAME = "downloaded_archive""""Module that downloads datasets and generates corresponding swg-files"""

datasets = [
    {"name": "mnist_test",
     "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",  # pylint: disable=line-too-long
     "filetype": "zip",
     "img_root": "MNIST Dataset JPG format/MNIST - JPG - testing/",
     "label_source": "folder", "id_source": "filename"},
    {"name": "mnist_train",
     "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",  # pylint: disable=line-too-long
     "filetype": "zip",
     "img_root": "MNIST Dataset JPG format/MNIST - JPG - training/",
     "label_source": "folder",
     "id_source": "filename"},
    {"name": "flowers",
     "url": "http://download.tensorflow.org/example_images/flower_photos.tgz",
     "filetype": "tgz",
     "img_root": "flower_photos/",
     "label_source": "folder",
     "id_source": "generate"},
    {"name": "cifar-10",
     "url": "https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz",
     "filetype": "cifar",
     "img_root": "cifar-10-batches-py",
     "label_source": "folder",
     "id_source": "filename"}
]

TMP_ARCHIVE_NAME = "downloaded_archive"


def download_file(url, filetype):
    """Downloads a file from a given url"""
    print("Downloading Data")
    urllib.request.urlretrieve(url, TMP_ARCHIVE_NAME + "." + filetype)


def delete_file(filename):
    """Deletes a given file"""
    print("Cleaning up")
    Path(filename).unlink()


def extract_file_zip(destination, img_root):
    """Extracts files from a zip file in (sub)folders in img_root"""
    with zipfile.ZipFile(TMP_ARCHIVE_NAME + ".zip", "r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith(img_root):
                zip_file.extract(file, path=destination)


def extract_file_tgz(destination, img_root, filetype):
    """Extracts files from a tar file in (sub)folders in img_root"""
    with tarfile.open(TMP_ARCHIVE_NAME + "." + filetype) as tar:
        subdir_and_files = [
            tarinfo for tarinfo in tar.getmembers()
            if tarinfo.name.startswith(img_root)
        ]
        tar.extractall(members=subdir_and_files, path=destination)


def unpickle(file):
    with open(file, 'rb') as fo:
        dict = pickle.load(fo, encoding='bytes')
    return dict


def extract_convert_cifar(destination, img_root):
    """Extracts cifar dataset, loads images and converts them to jpg"""
    extract_file_tgz(destination, img_root, "cifar")


def extract_file(filetype, destination, img_root):
    """Determines the correct function to extract an archive"""
    print("Extracting archive")
    if filetype == "zip":
        extract_file_zip(destination, img_root)
    if filetype in ("tgz", "tar", "tar.gz"):
        extract_file_tgz(destination, img_root, filetype)
    if filetype == "cifar":
        extract_convert_cifar(destination, img_root)


def download_and_extract(dataset, destination):
    """Downloads extracts and removes the archive"""
    download_file(dataset["url"], dataset["filetype"])
    extract_file(dataset["filetype"], destination + "/" +
                 dataset["name"] + "/", dataset["img_root"])
    delete_file(TMP_ARCHIVE_NAME + "." + dataset["filetype"])


def generate_annotations_from_folders(destination, dataset):
    """Generates a swg file based on the folder structure of a dataset"""
    swg_name = dataset["name"] + ".csv"
    with open(Path(destination) / dataset["name"] / swg_name,
              "w", newline='', encoding="utf8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["image_id", "file_path", "label"])

        class_names = Path(
            Path(destination) / dataset["name"] / dataset["img_root"]).glob("*")
        generated_id = 0
        for class_name in class_names:
            if Path(class_name).is_file():
                continue
            files = class_name.glob("*")
            for file in files:
                id_to_write = ""
                if dataset["id_source"] == "generate":
                    id_to_write = str(generated_id)
                if dataset["id_source"] == "filename":
                    id_to_write = file.name
                writer.writerow(
                    [dataset["name"] + "-" + id_to_write, file, class_name.name])
                generated_id += 1


def generate_annotations(destination, dataset):
    """Determines the correct function to generate annotations"""
    print("Generating annotations")
    if dataset["label_source"] == "folder":
        generate_annotations_from_folders(destination, dataset)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    DATASET_OPTIONS = str(list(map(lambda e: e["name"], datasets)))
    parser.add_argument('dataset', type=str,
                        help='the dataset to download one of: ' + DATASET_OPTIONS)
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the images to and generate the swg file in',
        default="data/",
        type=str)
    args = parser.parse_args()
    if not DATASET_OPTIONS.__contains__(args.dataset):
        sys.exit("Dataset must be one of: " + DATASET_OPTIONS)
    dataset_selected = list(
        filter(lambda e: e["name"] == args.dataset, datasets))[0]
    download_and_extract(dataset_selected, args.path)
    generate_annotations(args.path, dataset_selected)


def download_file(url, filetype):
    """Downloads a file from a given url"""
    print("Downloading Data")
    urllib.request.urlretrieve(url, TMP_ARCHIVE_NAME + "." + filetype)


def delete_file(filename):
    """Deletes a given file"""
    print("Cleaning up")
    Path(filename).unlink()


def extract_file_zip(destination, img_root):
    """Extracts files from a zip file in (sub)folders in img_root"""
    with zipfile.ZipFile(TMP_ARCHIVE_NAME + ".zip", "r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith(img_root):
                zip_file.extract(file, path=destination)


def extract_file_tgz(destination, img_root, filetype):
    """Extracts files from a tar file in (sub)folders in img_root"""
    with tarfile.open(TMP_ARCHIVE_NAME + "." + filetype) as tar:
        subdir_and_files = [
            tarinfo for tarinfo in tar.getmembers()
            if tarinfo.name.startswith(img_root)
        ]
        tar.extractall(members=subdir_and_files, path=destination)


def extract_file(filetype, destination, img_root):
    """Determines the correct function to extract an archive"""
    print("Extracting archive")
    if filetype == "zip":
        extract_file_zip(destination, img_root)
    if filetype in ("tgz", "tar", "tar.gz"):
        extract_file_tgz(destination, img_root, filetype)


def download_and_extract(dataset, destination):
    """Downloads extracts and removes the archive"""
    download_file(dataset["url"], dataset["filetype"])
    extract_file(dataset["filetype"], destination + "/" +
                 dataset["name"] + "/", dataset["img_root"])
    delete_file(TMP_ARCHIVE_NAME + "." + dataset["filetype"])


def generate_annotations_from_folders(destination, dataset):
    """Generates a swg file based on the folder structure of a dataset"""
    swg_name = dataset["name"] + ".csv"
    with open(Path(destination) / dataset["name"] / swg_name,
              "w", newline='', encoding="utf8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["image_id", "file_path", "label"])

        class_names = Path(
            Path(destination) / dataset["name"] / dataset["img_root"]).glob("*")
        generated_id = 0
        for class_name in class_names:
            if Path(class_name).is_file():
                continue
            files = class_name.glob("*")
            for file in files:
                id_to_write = ""
                if dataset["id_source"] == "generate":
                    id_to_write = str(generated_id)
                if dataset["id_source"] == "filename":
                    id_to_write = file.name
                writer.writerow(
                    [dataset["name"] + "-" + id_to_write, file, class_name.name])
                generated_id += 1


def generate_annotations(destination, dataset):
    """Determines the correct function to generate annotations"""
    print("Generating annotations")
    if dataset["label_source"] == "folder":
        generate_annotations_from_folders(destination, dataset)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    DATASET_OPTIONS = str(list(map(lambda e: e["name"], datasets)))
    parser.add_argument('dataset', type=str,
                        help='the dataset to download one of: ' + DATASET_OPTIONS)
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the images to and generate the swg file in',
        default="data/",
        type=str)
    args = parser.parse_args()
    if not DATASET_OPTIONS.__contains__(args.dataset):
        sys.exit("Dataset must be one of: " + DATASET_OPTIONS)
    dataset_selected = list(
        filter(lambda e: e["name"] == args.dataset, datasets))[0]
    download_and_extract(dataset_selected, args.path)
    generate_annotations(args.path, dataset_selected)
