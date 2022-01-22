"""Does basic hierarchical clustering on the mnist test data"""

import json
import itertools
import csv
from PIL import Image
from numpy import asarray
from sklearn.cluster import AgglomerativeClustering


# read in annotations
annotations = []

with open('data/mnist/mnist_test_swg.csv', encoding='utf-8') as csvfile:
    csv_reader = csv.reader(csvfile)
    for row in csv_reader:
        annotations.append(row)
# remove heads
del annotations[0]
print("Opened Annotation File")


images = []


print("Converting images to Numpy Arrays")
# load images from disk and convert them:
for annotation in annotations:
    image = Image.open(annotation[1])
    data = asarray(image).reshape(1,-1) # from 2D => 1D
    images.append(data[0])



print("Started Clustering")
model = AgglomerativeClustering(distance_threshold=0, n_clusters=None)
model.fit(images)

print("Saving results")
ii = itertools.count(len(images))
treeview = [{
    'node_id': int(next(ii)),
    'left':int(x[0]), 
    'right':int(x[1])
    } for x in model.children_]

labels = []
clusters = []


for i in range(0,len(annotations)):
    labels.append({"ID":annotations[i][0],"clusterID":i})


# save result
with open('data/mnist/ClusteringTree.json','w', encoding='utf-8') as json_file:
    json.dump({"tree":treeview,"clusters":labels},json_file, indent=4)

print("Done")
