# donwloads and extracts the mnist test dataset

import os
import urllib.request
import zipfile

print("Downloading Data")
mnistTestJpgURL = "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true"
urllib.request.urlretrieve(mnistTestJpgURL,"mnistTest.zip")
print("Unzipping Data - this may take a while")
with zipfile.ZipFile("mnistTest.zip","r") as zip_file:
    for file in zip_file.namelist():
        if file.startswith("MNIST Dataset JPG format/MNIST - JPG - testing/"):
            zip_file.extract(file)

print("Renaming Folders")
os.rename("MNIST Dataset JPG format","mnist_jpg")
os.rename("mnist_jpg/MNIST - JPG - testing", "mnist_jpg/MNIST-JPG-testing")
print("Cleaning Up")
os.remove("mnistTest.zip")