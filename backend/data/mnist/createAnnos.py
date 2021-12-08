import os
import csv

annos = []

for i in range(10):
    path = "mnist_jpg/MNIST-JPG-testing/" + str(i) + "/"
    files = [f for f in os.listdir(path)]
    for file in files:
        object = {
            "image_id":file.replace(".jpg",""),
            "file_path":path + file,
            "label":i
        }
        annos.append(object)
    #print(files)

csv_file = open("mnist_swg.csv", "w",newline='', encoding="utf8")
writer = csv.writer(csv_file)
writer.writerow(["image_id","file_path","label"])
for row in annos:
    writer.writerow([row["image_id"],row["file_path"],row["label"]])
print("Done")
exit(1)
