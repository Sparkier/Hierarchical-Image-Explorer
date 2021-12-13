# donwload and extract the mnist test dataset

import os
import urllib.request
import zipfile

def main():
    script_dir = os.path.dirname(__file__)

    print("Downloading Data")
    mnistTestJpgURL = "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true"
    urllib.request.urlretrieve(mnistTestJpgURL,"mnistTest.zip")
    print("Unzipping Data - this may take a while")
    with zipfile.ZipFile("mnistTest.zip","r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith("MNIST Dataset JPG format/MNIST - JPG - testing/"):
                zip_file.extract(file, path=script_dir)

    print("Renaming Folders")
    os.rename(os.path.join(script_dir, "MNIST Dataset JPG format"),os.path.join(script_dir,"mnist_jpg"))
    os.rename(os.path.join(script_dir,"mnist_jpg/MNIST - JPG - testing"), os.path.join(script_dir, "mnist_jpg/MNIST-JPG-testing"))
    print("Cleaning Up")
    os.remove("mnistTest.zip")

if __name__ == '__main__':
    main()