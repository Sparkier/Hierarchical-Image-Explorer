import argparse
import os
import urllib.request
import zipfile
import csv

def download_data(download_path):
    print("Downloading Data")
    mnist_test_jpg_url = "https://github.com//teavanist/MNIST-JPG/blob/master/MNIST%20Dataset%20JPG%20format.zip?raw=true"
    zip_filename = "mnistTest.zip"
    urllib.request.urlretrieve(mnist_test_jpg_url, zip_filename)
    print("Unzipping Data - this may take a while")
    with zipfile.ZipFile(zip_filename,"r") as zip_file:
        for file in zip_file.namelist():
            if file.startswith("MNIST Dataset JPG format/MNIST - JPG - testing/"):
                zip_file.extract(file, path=download_path)

    print("Renaming Folders")
    os.rename(os.path.join(download_path, "MNIST Dataset JPG format"),os.path.join(download_path,"mnist_jpg"))
    os.rename(os.path.join(download_path,"mnist_jpg/MNIST - JPG - testing"), os.path.join(download_path, "mnist_jpg/MNIST-JPG-testing"))
    print("Cleaning Up")
    os.remove(zip_filename)

def generate_annotations():
    print("Converting annotations to compatible format")
    
    script_dir = os.path.dirname(__file__)
    print(f"Script dir: {script_dir}")
    
    annotations = []

    for i in range(10):
        sub_path = f"mnist_jpg/MNIST-JPG-testing/{i}/"
        path = os.path.join(script_dir, sub_path)
        files = [f for f in os.listdir(path)]
        for file in files:
            file_name = os.path.splitext(file)[0]
            object = {
                "image_id": f"mnist-{file_name}" ,
                "file_path":sub_path + file,
                "label":i
            }
            annotations.append(object)
        print(f"Done with {i}/10")

    csv_file = open(os.path.join(script_dir, "mnist_test_swg.csv"), "w",newline='', encoding="utf8")
    writer = csv.writer(csv_file)
    writer.writerow(["image_id","file_path","label"])
    for row in annotations:
        writer.writerow([row["image_id"],row["file_path"],row["label"]])
    print("Annotations complete")





def main(path):
    download_data(path)







if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--path', help='Path to download the files and generate the annotations to', default="data/mnist", type=str)
    args = parser.parse_args()
    main(args.path)

