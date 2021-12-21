import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import fs = require('fs');
import csv = require('fast-csv');
import path = require('path');

const dataPath = '/data/mnist/';

const port = 25679;

console.log('server starting');

// app initiation
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

console.log('server is alive!');

type mnistDatum = {
  image_id: string;
  file_path: string;
  label: number;
};

// load data
const dataFrame: mnistDatum[] = [];
fs.createReadStream(`${dataPath}mnist_test_swg.csv`)
  .pipe(csv.parse({ headers: true }))
  .on('error', (e) => console.log(e))
  .on('data', (row) => dataFrame.push(row))
  .on('end', (rowCount) => {
    if (dataFrame.length == 0) throw new Error('Dataset empty');
    console.log('CSV read with ' + rowCount + ' rows');
  });

// functions
function getPathFromId(id): string {
  return getDatumByID(id).file_path;
}

function getDatumByID(id): mnistDatum {
  const resultSet = dataFrame.filter((elem) => elem.image_id == id);
  if (resultSet.length == 0) throw new Error('Id not in dataframe');
  return resultSet[0];
}

function getAllIds(): string[] {
  const allIDs: string[] = [];
  dataFrame.forEach((datum) => {
    allIDs.push(datum.image_id);
  });
  return allIDs;
}

// endpoints
app.get('/', (req, res) => {
  res.send('Server is running and listening on port ' + port);
});

app.get('/data/images/:id', (req, res) => {
  const file_path = getPathFromId(req.params.id);
  const absolutPath = path.join(__dirname, '../') + file_path;
  res.sendFile(absolutPath);
});

app.get('/data/annotations/:id', (req, res) => {
  res.send(getDatumByID(req.params.id));
});

app.get('/data/allIds', (req, res) => {
  res.send(getAllIds());
});

app.get('/data/label/:id', (req, res) => {
  const filteredResult = dataFrame.filter((d) => d.label === req.params.id);
  res.send(filteredResult.map((row) => row.image_id));
});

app.get('/annotations/pages/:id', (req, res) => {
  const batchSize = 20; // rows per page
  res.send(
    dataFrame.slice(
      req.params.id * batchSize,
      req.params.id * batchSize + batchSize
    )
  );
});

app.get('/data/heads', (req, res) => {
  res.send(Object.keys(dataFrame[0]));
});

app.get('/test/:number', (req, res) => {
  res.send(req.params.number);
});

// start actual server
app.listen(port, () => {
  console.log('Server started! on port ' + port);
});
