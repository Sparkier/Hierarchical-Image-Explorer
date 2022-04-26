# content
# * donwload archive
# * extract archive
# * generate annotation from folder structure


import argparse
import csv
import sys
import tarfile
from pathlib import Path
import urllib.request
import zipfile

datasets = [
    {"name": "mnist_test", "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",
        "filetype": "zip", "img_root": "MNIST Dataset JPG format/MNIST - JPG - testing/", "label_source": "folder", "id_source": "filename"},
    {"name": "mnist_train", "url": "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true",
     "filetype": "zip", "img_root": "MNIST Dataset JPG format/MNIST - JPG - training/", "label_source": "folder", "id_source": "filename"},
    {"name": "flowers", "url": "http://download.tensorflow.org/example_images/flower_photos.tgz",
        "filetype": "tgz", "img_root": "flower_photos/", "label_source": "folder", "id_source": "generate"}
]

tmp_archive_name = "downloaded_archive"


def download_file(url, filetype):
    print("Downloading Data")
    urllib.request.urlretrieve(url, tmp_archive_name + "." + filetype)


def delete_file(filename):
    print("Cleaning up")
    Path(filename).unlink()


def extract_file_zip(destination, img_root):
    with zipfile.ZipFile(tmp_archive_name + ".zip", "r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith(img_root):
                zip_file.extract(file, path=destination)


def extract_file_tgz(destination, img_root, filetype):
    with tarfile.open(tmp_archive_name + "." + filetype) as tar:
        subdir_and_files = [
            tarinfo for tarinfo in tar.getmembers()
            if tarinfo.name.startswith(img_root)
        ]
        tar.extractall(members=subdir_and_files, path=destination)


def extract_file(filetype, destination, img_root):
    print("Extracting archive")
    if filetype == "zip":
        extract_file_zip(destination, img_root)
    if filetype == "tgz" or filetype == "tar":
        extract_file_tgz(destination, img_root, filetype)


def download_and_extract(dataset, destination):
    download_file(dataset["url"], dataset["filetype"])
    extract_file(dataset["filetype"], destination + "/" +
                 dataset["name"] + "/", dataset["img_root"])
    delete_file(tmp_archive_name + "." + dataset["filetype"])


def generate_annotations_from_folders(destination, dataset):
    swg_name = dataset["name"] + ".csv"
    with open(Path(destination) / dataset["name"] / swg_name, "w", newline='', encoding="utf8") as csv_file:
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
    print("Generating annotations")
    if dataset["label_source"] == "folder":
        generate_annotations_from_folders(destination, dataset)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    dataset_options = str(list(map(lambda e: e["name"], datasets)))
    parser.add_argument('dataset', type=str,
                        help='the dataset to download one of: ' + dataset_options)
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the images to and generate the swg file in',
        default="data/",
        type=str)
    args = parser.parse_args()
    if not dataset_options.__contains__(args.dataset):
        sys.exit("Dataset must be one of: " + dataset_options)
    dataset = list(filter(lambda e: e["name"] == args.dataset, datasets))[0]
    download_and_extract(dataset, args.path)
    generate_annotations(args.path, dataset)
