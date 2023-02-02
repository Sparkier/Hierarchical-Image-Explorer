""" Utility functions for data providers. """
import csv
import pyarrow as pa



def write_data_table(destination, store_csv, swg_name, data_dict):
    """Writes dictionary items in data_dict into an arrow file."""
    arrow_table = pa.Table.from_pydict(data_dict)
    output_path = destination / (swg_name + ".arrow")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = pa.RecordBatchFileWriter(output_path, arrow_table.schema)
    writer.write(arrow_table)
    writer.close()
    if store_csv:
        with open(destination / (swg_name + ".csv"), 'w', encoding='UTF') as file:
            csv_writer = csv.DictWriter(file, data_dict.keys())
            csv_writer.writeheader()
            csv_writer.writerow(data_dict)
