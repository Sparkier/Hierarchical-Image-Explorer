import os
import csv

def main():
    print("Converting annotations to compatible format")
    
    script_dir = os.path.dirname(__file__)
    print(f"Script dir: {script_dir}")
    
    annotations = []

    for i in range(10):
        subPath = f"mnist_jpg/MNIST-JPG-testing/{i}/"
        path = os.path.join(script_dir, subPath)
        files = [f for f in os.listdir(path)]
        for file in files:
            fileName = os.path.splitext(file)[0]
            object = {
                "image_id": f"mnist-{fileName}" ,
                "file_path":subPath + file,
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
    exit(1)

if __name__ == '__main__':
    main()