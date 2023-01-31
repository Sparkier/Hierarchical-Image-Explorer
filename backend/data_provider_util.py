""" Utility functions for data providers. """
from pathlib import Path
from pyarrow import _csv
import pyarrow as pa



def write_data_table(destination, dataset, store_csv, swg_name, data_dict):
    """Writes dictionary items in data_dict into an arrow file."""
    arrow_table = pa.Table.from_pydict(data_dict)
    output_path = Path(destination) / dataset / (swg_name + ".arrow")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = pa.RecordBatchFileWriter(output_path, arrow_table.schema)
    writer.write(arrow_table)
    writer.close()
    if store_csv:
        _csv.write_csv(arrow_table, str(
            output_path).replace(".arrow", ".csv"))