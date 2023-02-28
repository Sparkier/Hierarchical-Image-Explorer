""" Script to export model predictions in data_path/dataset/split/predictions_{model}.pkl
    Example usage:
        python -m export_predictions_tfds --dataset mnist --split test --model VGG16
"""
import argparse
from pathlib import Path

import pandas as pd
import tensorflow as tf
import tensorflow_datasets as tfds
import util
import util_tfds

def setup_model(data_set, model_name):
    """Configure feature extraction model_name to handle data set.

    Args:
        data_set (Tensorflow.DataSet): Data set that will be used for prediction.

    Returns:
        Keras.Model: Model
    """
    data_set, inputs, preprocessing = util_tfds.model_preprocessing(data_set, model_name)
    if model_name == "VGG16":
        prediction_model = tf.keras.applications.VGG16(
            include_top=True, weights='imagenet')
        preprocessing = tf.keras.applications.vgg16.preprocess_input(
            preprocessing)
    elif model_name == "InceptionV3":
        prediction_model = tf.keras.applications.InceptionV3(
            include_top=True, weights='imagenet')
        preprocessing = tf.keras.applications.inception_v3.preprocess_input(
            preprocessing)
    elif model_name == "Xception-malaria":
        model_path = "models/Xception-malaria.keras"
        prediction_model = tf.keras.models.load_model(model_path)

    outputs = prediction_model(preprocessing)
    model_with_preprocessing = tf.keras.Model(
        inputs=inputs, outputs=outputs)

    return data_set, model_with_preprocessing

if __name__ == "__main__":
    # pylint: disable=duplicate-code

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--dataset', type=str,
        help='Any image data set, .e.g, binarized_mnist: \
            https://www.tensorflow.org/datasets/catalog/overview')
    parser.add_argument("--data_path", type=util.dir_path,
                        default='D:/data/tensorflow_datasets')
    parser.add_argument(
        '-s',
        '--split',
        help='Split of the dataset to use',
        default="test",
        type=str)
    parser.add_argument("--model", help='Tensorflow keras model',
                        required=False, choices=["VGG16", "InceptionV3", "Xception-malaria"])
    args = parser.parse_args()

    ds, dataset_info = tfds.load(
        args.dataset, split=args.split, shuffle_files=False,
        with_info=True, data_dir=args.data_path)

    output_dir = Path(args.data_path, args.dataset, args.split)
    ds_dict = util_tfds.decode_tfds_image_data_set(ds, dataset_info, output_dir)

    ds, model = setup_model(ds, args.model)
    predictions = []
    for batch in ds.batch(128).prefetch(tf.data.AUTOTUNE):
        predictions.extend(tf.argmax(model.predict(batch),
                                axis=-1).numpy())

    predictions_path = Path(output_dir, f"predictions_{args.model}.pkl")
    predictions_path.parent.mkdir(parents=True, exist_ok=True)
    label_feature = dataset_info.features['label']
    predictions_coded = [label_feature.int2str(prediction) for prediction in predictions]
    pd.DataFrame({"image_id": ds_dict["image_id"],
                  "prediction": predictions_coded,
                  "prediction_raw": predictions}
                ).to_pickle(predictions_path)
