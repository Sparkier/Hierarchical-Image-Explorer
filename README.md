![image](docs/img/banner.png)

HIE provides a hierarchical level-of-detail visualization for large-scale image datasets that allows for an interactive exploration of the data.
You can try HIE [online](http://nemesis.informatik.uni-ulm.de/frontend/main/) with an example dataset provided by us.

This is joint work by [Alex Bäuerle](a13x.io), [Christian van Onzenoodt](onze.io), [Daniel Jönsson](https://liu.se/en/employee/danjo37), and [Timo Ropinski](https://viscom.uni-ulm.de/members/timo-ropinski/).
HIE will be published as a short paper at [EuroVis 2023](https://www.eurovis.org).

---

# Functionality

## Exploring data

The image explorer offers a view of groups of images in a certain alignment on a 2D plane.
To explore the data, zooming and panning is possible.
Zooming in will reveal continuously smaller groups until only one image is visible. Every group can be selected to reveal additional information.

### Selecting groups

Selecting groups (and single images) can be done in two ways:

1. Selecting them one by one with a click
2. Using the lasso tool (`ALT` or button on top)

We support selecting two none overlapping sets of groups and offer various ways to compare them.

To switch between selecting group A and B use `x` or the button next to the lasso tool.
To unselect all groups at once, use `ESC`.

### Filters

The dataset can be filtered using a simple UI and more complex queries. To add a filter, open the right panel and click "add filter". If multiple filters are present, they are processed in order. Filters can be concatenated in with `OR` and `AND`. These operations apply to all the previous filters in the list.
Under each filter, the corresponding [arquero](https://uwdata.github.io/arquero/api/) query is displayed. These can be directly edited to achieve more complex filter operations.

<img src="docs/img/filtering.png" width="200">
 
### Minimap
In the bottom right of the view is a minimap. The minimap always displays the groups of the unfiltered dataset.

### Graphs and group info

Once one or multiple groups are selected, the left sidebar opens, and the user is provided with additional information on the selected groups:

- the representative image of the selections
- the number of images in each group as a bar chart

Furthermore, if the dataset provides adequate columns such as labels, outlier score or probability, the user can select the columns in the dropdown menu to be displayed in a graph. Subsequently, discrete values are displayed as a mirrored bar chart (if two selections are chosen) or as a pie chart (if only one selection is chosen). Continuous values are displayed as a box plot or histogram.

<img src="docs/img/graph.png" width="500">

### Settings

Settings can be changed in the settings menu (gearwheel) in the upper right corner. You can alternate the following:

1. Resolution

   - determines how many hexagons will be layed over the data and will be displayed on screen (higher resolution -> more hexagons, vice versa)
   - effectively changes the number of columns displayed (standard setting is 10)
   - _note: since hexagons have to be shifted by half a hexagon every row to get a perfect fit, only columns with hexagons having the same height are counted as one column and too high values (>20) may lead to performance issues_

2. Color query
   - This property determines the hexagon outline color. It can be modified with an [arquero](https://uwdata.github.io/arquero/api/) expression. If the query results in a number, a continuous color scale is applied. One can switch between different scales. For other values, the categorical [tableau-10](https://www.tableau.com/about/blog/2016/7/colors-upgrade-tableau-10-56782) palette is used. If needed, the colors may repeat.

<img src="docs/img/settings.png" width="200">

---

# Using HIE on your own data

To use HIE on your own data, the data needs to be processed before it can be used in HIE.
To get started, clone this repository and initialize it as follows:

1. run `yarn` to initialize the project and install all necessary packages
1. run `yarn build` to compile and build the project

## Preparing data

A dataset needs a descriptive `.arrow` file this can be obtained in different ways:

1. Predefined data (mnist, flowers, cifar-10)

   - Can be automatically downloaded with the `data_provider.py` script
   - `data_provider.py` can be easily expanded to support other image datasets where the folder of an image determines its class

2. Custom data

   - The expected Arrow IPC file requires the following columns:
     - `image_id` a unique identifier
     - `file_path` relative path to image file
     - [optional] more columns containing data (e.g. `label`, `classification`, `probability`, ...)
     - [optional] representation of the image (e.g. `activations`, `feature_vector`, ...)

3. Dimensionality reduction
   - For dimensionality reduction the backend expects an arrow IPC table containing: (`id`, `x`, `y`). These can be automatically generated with `data_processing.py`. The scripts supports 3 image representations (`-enc`):
     - `pixels` raw pixel data
     - `vgg-16` feature vector generated from a pre-trained VGG-16 model
     - `arrow.<column>` take custom data from the dataset description table

## Loading data in the backend

The backend takes in a configuration file (`-c`) this contains 3 properties:

- `table` path to dataset arrow IPC table
- `points2d` path to dimensionality reduction arrow IPC table
- `imgDataRoot` path to the relative root of image paths

Running `yarn start -c [config_path]` will then start the backend server.

## Starting the frontend

- Adjust `SERVER_ADDRESS` in `src/config.ts` to the backend IP.
- Build static site with `yarn build` and then start it with `yarn start` (or run dev-mode with `yarn dev` for live preview).

## Example

We have an exported table `raw_data.arrow` containing the columns: (`image_id`, `file_path`, `label`, `prediction`, `probability`, `activations`). `activations` contains the representation of the image we want to use going forward. We put the table in `backend/data/example/raw_data.arrow` and the images in `backend/data/example/images`.

One row might look like this:

| image_id | file_path                    | label  | prediction | probability | activations         |
| -------- | ---------------------------- | ------ | ---------- | ----------- | ------------------- |
| '01'     | 'data/example/images/01.jpg' | 'bird' | 'plane'    | 0.2543      | [0.2342,...,0.3243] |

Then, we run dimensionality reduction: `python data_processing.py data/example/raw_data.arrow data/example/ -enc arrow.activations --projection_method umap ` this generates the file `data/example/raw_data_umap.arrow`.

Now, we write a config for the server:

```js
// backend/configurations/config_example.json
{
    "table": "data/example/raw_data.arrow",
    "points2d": "data/example/raw_data_umap.arrow",
    "imgDataRoot": "../"
}
```

We can then start the backend server with `cd backend && yarn start -c configurations/config_example.json`.
The frontend needs no further adjustment to different datasets and can be started with `cd hierarchical-image-explorer && yarn build && yarn start`.
