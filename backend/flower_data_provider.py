"""Download and extract the mnistJPG data"""
import argparse
import csv
import urllib.request
import tarfile
from pathlib import Path


DATASET_URL = "http://download.tensorflow.org/example_images/flower_photos.tgz"
TGZ_NAME = "flower_photos.tgz"


def download_and_extract(file_path):
    """Downloads and extraxcts the dataset to a give file path"""
    print("Downloading Data")
    urllib.request.urlretrieve(DATASET_URL, TGZ_NAME)
    print("Unzipping Data - this may take a while")
    tar = tarfile.open(TGZ_NAME, "r")
    tar.extractall(path=file_path)


def parse_annotations(file_path):
    """Generates SWG File based on the downloaded file structure ids are generated sequentially"""
    print("Parsing annotations to compatible format")
    with open(file_path / "flowers_swg.csv", "w", newline='', encoding="utf8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["image_id", "file_path", "label"])

        class_names = Path(file_path / "flower_photos").glob("*")

        flower_id = 0

        for class_name in class_names:
            if class_name.name == "LICENSE.txt":
                continue

            path = Path(file_path / "flower_photos" / class_name.name)
            print(path)
            files = path.glob("*")
            for file in files:
                print(file.name)
                writer.writerow([f"flower-{flower_id}", file, class_name.name])
                flower_id += 1
        print("Annotation parsing complete")


def cleanup():
    """Deletes the downloaded tgz file"""
    Path(TGZ_NAME).unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-p',
        '--path',
        help='Path to download the files and generate the annotations to',
        default="data/flowers",
        type=str)
    args = parser.parse_args()

    # download_and_extract(Path(args.path))
    parse_annotations(Path(args.path))
    # cleanup()
