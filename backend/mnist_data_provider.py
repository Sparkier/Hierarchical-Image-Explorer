"""Download and extract the mnistJPG data"""
# https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true
# Generates an annotation file by parsing the annotation from the file structure of the zip

import argparse
import urllib.request
import zipfile
import csv
from pathlib import Path

extractedFileStructure = Path("mnist_jpg/MNIST-JPG-testing")


def download_data(files_path):
    """Download the mnist data set and save it to a specified path.

    Args:
        files_path (Path): where the downloaded data should be saved to.
    """
    print("Downloading Data")
    mnist_test_jpg_url = ("https://github.com//teavanist/MNIST-JPG/blob/master/"
                          "MNIST%20Dataset%20JPG%20format.zip?raw=true")
    zip_filename = "mnistTest.zip"
    urllib.request.urlretrieve(mnist_test_jpg_url, zip_filename)
    print("Unzipping Data - this may take a while")
    with zipfile.ZipFile(zip_filename, "r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith("MNIST Dataset JPG format/MNIST - JPG - testing/"):
                zip_file.extract(file, path=files_path)

    print("Renaming Folders")
    (files_path / "MNIST Dataset JPG format").rename(files_path / "mnist_jpg")
    (files_path / "mnist_jpg/MNIST - JPG - testing").rename(files_path /
                                                            extractedFileStructure)
    print("Cleaning Up")
    Path(zip_filename).unlink()


def parse_annotations(files_path):
    """Parsing the annotations of the data set and saving them as a csv.

    Args:
        files_path (Path): where the metadata should be saved to.
    """
    print("Parsing annotations to compatible format")

    with open(files_path / "mnist_test_swg.csv", "w", newline='', encoding="utf8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["image_id", "file_path", "label"])

        class_names = Path(files_path / extractedFileStructure).glob('*')
        for class_name in class_names:
            sub_path = Path(extractedFileStructure / class_name.name)
            path = files_path / sub_path
            files = Path(path).glob('*')
            for file in files:
                # file_name, file_path, label
                writer.writerow([f"mnist-{file.stem}", file, class_name.name])
        print("Annotation parsing complete")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the files and generate the annotations to',
        default="data/mnist",
        type=str)
    args = parser.parse_args()

    download_data(Path(args.path))
    parse_annotations(Path(args.path))
    print("Dataset setup complete")
