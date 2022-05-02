"""Takes a fature list representation of an image
and runs dimensionality reduction to 2D using t-sne"""
import argparse
from pathlib import Path
import json
from sklearn.manifold import TSNE
import pandas as pd


def load_features(file_path):
    """Loads a given feature json file and returns ids and features seperately"""
    with open(file_path, "r", encoding="utf8") as feature_json_file:
        feature_data = json.load(feature_json_file)
        features = []
        ids = []
        for datum in feature_data:
            features.append(datum["features"])
            ids.append(datum["ID"])
        return features, ids


def run_tsne(features, ids):
    """Runs t-sne on a given feature list. Returns a dataframe with id and coordinates"""
    tsne = TSNE(n_components=2, verbose=1, random_state=222, perplexity=32)
    tsne_output = tsne.fit_transform(features)
    data_frame = pd.DataFrame()
    data_frame["id"] = ids
    data_frame["x"] = tsne_output[:, 0]
    data_frame["y"] = tsne_output[:, 1]
    return data_frame


def save_points_data(out_dir, out_name, points_df):
    """Saves dataframe to given path"""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    points_df.to_csv(out_name, index=False)


def main(parameters):
    """Main Method"""
    print("Generating 2D points from feature Vectors")
    features, ids = load_features(parameters.feature_json)
    print("Running t-sne")
    points_df = run_tsne(features, ids)
    out_name = parameters.feature_json.replace(
        "_feat.json", "") + "_2d_points.csv"
    print("Saving results to file")
    save_points_data(parameters.output_dir, out_name, points_df)
    print("Done")


if __name__ == "__main__":
    # pylint: disable=duplicate-code
    parser = argparse.ArgumentParser(
        description='Generate 2D points from features')
    parser.add_argument('feature_json', type=str,
                        help='path to feature json')
    parser.add_argument(
        '-o',
        '--output_dir',
        help='Path to output directory',
        default='data/sim/',
        type=str)
    args = parser.parse_args()
    main(args)
