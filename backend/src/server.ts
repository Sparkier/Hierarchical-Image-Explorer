import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import * as csv from 'fast-csv';
import path from 'path';
import HierarchicalClusterDataProvider from './hierarchicalClusterDataProvider';

const dataPath = './data/mnist/';

const port = 25679;

const dataFrame: Map<string, mnistDatum> = new Map();
const app = express();
const hcDataProvider:HierarchicalClusterDataProvider = new HierarchicalClusterDataProvider(`${dataPath}/ClusteringTree.json`); 

type mnistDatum = {
  file_path: string;
  label: number;
};

type mnistDatumWithID = {
  image_id: string;
  file_path: string;
  label: number;
};

startServer();
function startServer() {
  console.log('server starting');

  app.use(bodyParser.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));

  // load data
  setUpData();

  // start actual server
  app.listen(port, () => {
  console.log('Server started! on port ' + port);
});
}

function setUpData() {
  // read and parse annotation file
  fs.createReadStream(`${dataPath}mnist_test_swg.csv`)
    .pipe(csv.parse({ headers: true }))
    .on('error', (e) => console.log(e))
    .on('data', (row) => dataFrame.set(row.image_id, { file_path: row.file_path, label: row.label })
    )
    .on('end', (rowCount) => {
      if (dataFrame.size == 0)
        throw new Error('Dataset empty');
      console.log('CSV read with ' + rowCount + ' rows');
    });
  // setup hierarchical clustering data
}

// functions
function getPathFromId(id): string {
  return getDatumByID(id).file_path;
}

function combineDatumWithID(datum: mnistDatum, id: string): mnistDatumWithID {
  return { image_id: id, file_path: datum.file_path, label: datum.label };
}

function getDatumByID(id): mnistDatumWithID {
  const result = dataFrame.get(id);
  if (result == undefined) throw new Error('ID not found');
  else return combineDatumWithID(result, id);
}

function getAllIds(): string[] {
  return [...dataFrame.keys()];
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
  const filteredResult = [...dataFrame.entries()].filter(
    (d) => d[1].label === req.params.id
  );
  res.send(filteredResult.map((row) => row[0]));
});

app.get('/annotations/pages/:id', (req, res) => {
  const batchSize = 20; // rows per page
  const result = [...dataFrame].slice(
    req.params.id * batchSize,
    req.params.id * batchSize + batchSize
  );
  res.send(
    result.map((e) => {
      return combineDatumWithID(e[1], e[0]);
    })
  );
});

app.get('/data/heads', (req, res) => {
  res.send(Object.keys(getDatumByID(getAllIds()[0])));
});


// ----------------------------------------- hierarchical clustering

app.get('/hc/nodes/:id', (req,res) => {
  res.send(hcDataProvider.getNode(req.params.id))
})

app.get('/hc/allchildIds/:id', (req,res) => {
  res.send(hcDataProvider.getAllIDs(req.params.id))
})
