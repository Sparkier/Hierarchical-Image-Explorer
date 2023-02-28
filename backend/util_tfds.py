""" Utility functions for Tensorflow datasets. """
from pathlib import Path

import tensorflow as tf
import tensorflow_datasets as tfds
import pandas as pd


def model_preprocessing(data_set, model_name):
    """Preprocess the data so it can be used with a model.

    Args:
        data_set (Tensorflow.DataSet): Data set that will be prepared for use with a model.

    Returns:
       Keras.Layer, Tensorflow.DataSet : Input layer to the model and preprocessing ops for data.
    """
    def resize_images(images, image_size):
        return tf.image.resize(images, image_size)
    if model_name == "VGG16":
        image_size = (224, 224)
    elif model_name == "InceptionV3":
        image_size = (299, 299)
    elif model_name == "Xception-malaria":
        image_size = (150, 150)
    # Resize images before providing data to preprocessing
    # to avoid errors with different image sizes in one batch
    data_set = data_set.map(lambda row: resize_images(row['image'], image_size),
                            num_parallel_calls=tf.data.AUTOTUNE)
    inputs = tf.keras.layers.Input(shape=data_set.element_spec.shape.as_list())
    if data_set.element_spec.shape[-1] == 1:
        preprocessing = tf.image.grayscale_to_rgb(inputs)
    else:
        preprocessing = inputs


    return data_set, inputs, preprocessing

def decode_tfds_image_data_set(data, ds_stats, image_dir):
    """Decode a tensorflow datasets image dataset."""
    # Required entries
    data_dict = {"image_id": [], "file_path": []}

    for row_idx, row in enumerate(data):
        if "id" in row:
            file_name = row['id'].numpy().decode("utf-8") + ".jpeg"
        elif "file_name" in row:
            file_name = row['file_name'].numpy().decode("utf-8")
        else:
            file_name = f"{row_idx}.jpeg"
        data_dict["image_id"].append(file_name)
        data_dict["file_path"].append(str(Path(image_dir, file_name)))

        for key, val in row.items():
            feature = ds_stats.features[key]
            if isinstance(feature, tfds.features.ClassLabel):
                if key not in data_dict:
                    data_dict[key] = []
                data_dict[key].append(feature.int2str(val.numpy()))

    image_quality_path = Path(image_dir, "image_quality.pkl")
    if image_quality_path.exists():
        imge_quality_df = pd.read_pickle(image_quality_path)
        data_dict = pd.merge(pd.DataFrame(data_dict), imge_quality_df,
                             on="image_id", how="left").to_dict('list')
    for predictions_path in image_dir.glob("predictions_*.pkl"):
        predictions_df = pd.read_pickle(predictions_path)
        # Add model name to predictions column
        model_name = predictions_path.stem[len("predictions_"):]
        predictions_df.rename(columns={"prediction": f"prediction_{model_name}",
                                       "prediction_raw": f"prediction_raw_{model_name}"},
                                       inplace=True)
        data_dict = pd.merge(pd.DataFrame(data_dict), predictions_df,
                             on="image_id", how="left").to_dict('list')
    return data_dict
