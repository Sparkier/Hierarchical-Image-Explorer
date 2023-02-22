"""Module that downloads datasets and generates corresponding swg-files"""
import argparse
import sys
import tarfile
import pickle
from pathlib import Path
import urllib.request
import zipfile
from PIL import Image
import util


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
     "id_source": "filename"},
    {"name": "imagenet2012",
     "split" : "train",
     "url": "D:/data/tensorflow_datasets/imagenet2012/train",
     "filetype": "folder",
     "label_source": "folder",
     "id_source": "filename"}
]

TMP_ARCHIVE_NAME = "downloaded_archive"


def download_file(url, filetype):
    """Downloads a file from a given url"""
    print("Downloading Data")
    if not Path(url).exists():
        urllib.request.urlretrieve(url, TMP_ARCHIVE_NAME + "." + filetype)


def delete_file(filename):
    """Deletes a given file"""
    print("Cleaning up")
    if Path(filename).exists():
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
    """method provdided by cifar to read binary files"""
    with open(file, 'rb') as file_open:
        data_dict = pickle.load(file_open, encoding='bytes')
    return data_dict


def extract_convert_cifar(destination, img_root, dataset):
    """Extracts cifar dataset, loads images and converts them to jpg"""
    extract_file_tgz(destination, img_root, "cifar")
    datapath = Path(destination) / dataset["img_root"]
    # get classes
    meta_file = unpickle(datapath / "batches.meta")
    label_names = meta_file[b"label_names"]
    for label in label_names:
        Path(datapath / label.decode("utf-8")
             ).mkdir(parents=True, exist_ok=True)
    # unpickle cifar
    archives = (datapath).glob("*")
    for file in archives:
        if(file.suffix != "" or not file.is_file()):
            continue
        unpickeled = unpickle(file)
        for i, img in enumerate(unpickeled[b'data']):
            img_reshape = Image.fromarray(
                img.reshape(3, 32, 32).transpose(1, 2, 0))
            img_reshape.save(
                datapath /
                label_names[unpickeled[b'labels'][i]].decode("utf-8") /
                unpickeled[b'filenames'][i].decode("utf-8").replace(".png", ".jpg"))


def extract_file(filetype, destination, dataset):
    """Determines the correct function to extract an archive"""
    print("Extracting archive")
    if filetype == "zip":
        extract_file_zip(destination, dataset["img_root"])
    if filetype in ("tgz", "tar", "tar.gz"):
        extract_file_tgz(destination, dataset["img_root"], filetype)
    if filetype == "cifar":
        extract_convert_cifar(destination, dataset["img_root"], dataset)


def download_and_extract(dataset, destination):
    """Downloads extracts and removes the archive"""
    download_file(dataset["url"], dataset["filetype"])
    extract_file(dataset["filetype"], destination + "/" +
                 dataset["name"] + "/", dataset)
    delete_file(TMP_ARCHIVE_NAME + "." + dataset["filetype"])


def generate_annotations_from_folders(destination, dataset, store_csv):
    """Generates a swg file based on the folder structure of a dataset"""
    if "split" in dataset:
        swg_name = f'{dataset["name"]}_{dataset["split"]}'
    else:
        swg_name = f'{dataset["name"]}'
    ids = []
    file_paths = []
    labels = []
    if "img_root" in dataset:
        class_names = Path(destination, dataset["name"], dataset["img_root"]).glob("*")
    else:
        class_names = Path(dataset["url"]).glob("*")
   
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
                id_to_write = file.stem
            ids.append(dataset["name"] + "-" + id_to_write)
            file_paths.append(str(file))
            labels.append(class_name.name)
            generated_id += 1
    swg_dict = {"image_id": ids, "file_path": file_paths, "label": labels}
    util.write_data_table(Path(destination, dataset["name"]), store_csv, swg_name, swg_dict)

def generate_annotations(destination, dataset, store_csv):
    """Determines the correct function to generate annotations"""
    print("Generating annotations")
    if dataset["label_source"] == "folder":
        generate_annotations_from_folders(destination, dataset, store_csv)


if __name__ == "__main__":
    # pylint: disable=duplicate-code

    parser = argparse.ArgumentParser()
    DATASET_OPTIONS = [item["name"] for item in datasets]
    parser.add_argument('dataset', choices=DATASET_OPTIONS,
                        help=f"the dataset to download one of {','.join(DATASET_OPTIONS)}")
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the images to and generate the swg file in',
        default="data/",
        type=str)
    parser.add_argument(
        '-csv',
        '--store_csv',
        help='Stores the metadata as csv in addition to arrow',
        action='store_true',)
    args = parser.parse_args()
    dataset_selected = list(
        filter(lambda e: e["name"] == args.dataset, datasets))[0]
    print(f"Preparing dataset: {dataset_selected}")
    download_and_extract(dataset_selected, args.path)
    generate_annotations(args.path, dataset_selected, args.store_csv)
