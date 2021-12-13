# Download and extract the mnistJPG data from: https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true
# Generates an annotation file by parsing the annotation from the file structure of the zip

import argparse
import os
import urllib.request
import zipfile
import csv
from pathlib import Path

extractedFileStructure = "mnist_jpg/MNIST-JPG-testing"

def download_data(files_path):
    print("Downloading Data")
    files_path = Path(files_path)
    mnist_test_jpg_url = "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true"
    zip_filename = "mnistTest.zip"
    urllib.request.urlretrieve(mnist_test_jpg_url, zip_filename)
    print("Unzipping Data - this may take a while")
    with zipfile.ZipFile(zip_filename,"r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith("MNIST Dataset JPG format/MNIST - JPG - testing/"):
                zip_file.extract(file, path=files_path)

    print("Renaming Folders")
    os.rename(files_path / "MNIST Dataset JPG format",files_path /  "mnist_jpg")
    os.rename(files_path / "mnist_jpg/MNIST - JPG - testing", files_path / extractedFileStructure)
    print("Cleaning Up")
    os.remove(zip_filename)

def parse_annotations(files_path):
    print("Parsing annotations to compatible format")
    files_path = Path(files_path)
    
    csv_file = open(files_path / "mnist_test_swg.csv", "w",newline='', encoding="utf8")
    writer = csv.writer(csv_file)
    writer.writerow(["image_id","file_path","label"])

    class_names = Path(files_path / extractedFileStructure).glob('*')
    for class_name in class_names:
        sub_path = Path(Path(extractedFileStructure) / class_name.name)
        path = files_path / sub_path      
        files = Path(path).glob('*')
        for file in files:
            writer.writerow([f"mnist-{file.stem}", file, class_name.name]) # file_name, file_path, label
    print("Annotation parsing complete")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', help='Path to download the files and generate the annotations to', default="data/mnist", type=str)
    args = parser.parse_args()
    
    download_data(args.path)
    parse_annotations(args.path)
    print("Dataset setup complete")

