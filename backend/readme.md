# Backend

## Install

To setup data run (mnist is here the data set name):
`python -m data_provider_tfds --dataset mnist --split test`
`python -m data_processing data/mnist/mnist_test.arrow data/mnist_test --encoding vgg-16 --dimensionality_reduction umap`
More image data sets can be found at https://www.tensorflow.org/datasets/catalog/overview


Setup the server with `yarn`

## Running

Run `yarn start -c configurations/config_mnist_test.json` 