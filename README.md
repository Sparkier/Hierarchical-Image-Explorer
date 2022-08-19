# Hierarchical Image Explorer (HIE)

The goal of this project is to develop a Level of Detail visualization for large-scale image datasets, that allows interactive exploration of the data. It is part of the specialization subject Computer Graphics in the 5th and 6th semester for computer science and media students at Ulm University.
The project with an example dataset loaded can be found [here](http://nemesis.informatik.uni-ulm.de/frontend/main/)

### Getting started

1. Clone the repository using your method of choice
2. run `yarn` to initialize the project and install all necessary packages
3. run `yarn build` to compile and build the project
4. run `yarn start -c <config_path> -p <port(default = 25679)>` to start the backend server (navigate to [localhost:5000](http://localhost:5000))

#### Further commands

- `yarn format`: runs the Prettier code formatter
- `yarn lint`: runs the eslint linter, returning all linting problems
- `yarn lint:fix`: runs the eslint linter and automatically fixes all linting problems

### Technology stack
- Code formatter: [prettier](https://prettier.io/)
- Linter: [eslint](https://eslint.org/)
- Web-framework: [svelte](https://svelte.dev/)

### Preparing datasets

A dataset needs a descriptive `.arrow` file this can be obtained in two ways:

#### Preparing predefined datasets (mnist, flowers, cifar-10)

* Can be automatically downloaded with the `data_provider.py` script
* `data_provider.py` can be easily expanded to support other image datasets where the folder of an image determines its class

#### Preparing custom datasets

* The expected Arrow IPC file requires the following columns:
  * `image_id` a unique identifier
  * `file_path` relative path to image file
  * [optional] more columns containing data (e.g. `label`, `classification`, `probability`, ...)
  * [optional] representation of the image (e.g. `activations`, `feature_vector`, ...)

#### Generating dimensionality reduction

For dimensionality reduction the backend expects an arrow IPC table containing: (`id`, `x`, `y`). These can be automatically generated with `data_processing.py`. The scripts supports 3 image representations (`-enc`):

* `pixels` raw pixel data
* `vgg-16` feature vector generated from a pre-trained VGG-16 model
* `arrow.<column>` take custom data from the dataset description table

#### Loading data in the backend

The backend takes in a configuration file (`-c`) this contains 3 properties:

* `swg` path to dataset arrow IPC table
* `points2d` path to dimensionality reduction arrow IPC table
* `imgDataRoot` path to the relative root of image paths

#### Example

We have an exported table `raw_data.arrow` containing the columns: (`image_id`, `file_path`, `label`, `prediction`,  `probability`, `activations`). `activations` contains the representation of the image we want to use going forward. We put the table in `backend/data/example` and the images in `backend/data/examples/images`.

One row might look like this:

| image_id | file_path                    | label  | prediction | probability | activations         |
| -------- | ---------------------------- | ------ | ---------- | ----------- | ------------------- |
| '01'     | 'data/example/images/01.jpg' | 'bird' | 'plane'    | 0.2543      | [0.2342,...,0.3243] |

* Run dimensionality reduction: `python data_processing.py data/example -enc arrow.activations -dim umap ` this generates the file `data/example/raw_data_umap.arrow`
* Now we write a config for the server:

```js
// backend/configurations/config_example.json
{
    "swg": "data/example/raw_data.arrow",
    "points2d": "data/example/raw_data_umap.arrow",
    "imgDataRoot": "../"
}
```

Now start the backend server with `yarn start -c configurations/config_example.json`
The frontend needs no further adjustment to different datasets.



### Committing

To have nice commit messages throughout, we use [commitizen](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly). To commit, use `git cz`.

We require reviewed pull requests before merging to `main`. This means:

1. You cannot directly push to the `main` branch.
2. You should create a new branch for a change you want to make.
3. Changes should be as small as possible to allow for a quick review.
4. Once you have applied all the changes you wanted to make to your branch, you need to open a pull request on GitHub.
5. You need to assign a reviewer and get approval before you are able to merge your changes.
6. Your pull request needs to pass all checks on GitHub before being merged.