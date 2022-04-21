import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import * as csv from 'fast-csv';
import path from 'path';
import HierarchicalClusterDataProvider from './hierarchicalClusterDataProvider';
import { HIEConfiguration } from './configuration';


type mnistDatum = {
  file_path: string;
  label: number;
};

type mnistDatumWithID = {
  image_id: string;
  file_path: string;
  label: number;
};

// parse commandline arguments
if (process.argv.length !== 3) {
  throw new Error('Missing arguments please use yarn run start <config_path>');
}
const configParameter = process.argv[2];

console.log('Loading configuration from ' + configParameter);
const confData = JSON.parse(
  fs.readFileSync(configParameter, 'utf-8')
) as HIEConfiguration;
const hieConfig = confData;

const port = 25679;

const dataFrame: Map<string, mnistDatum> = new Map();
const app = express();
const hcDataProvider: HierarchicalClusterDataProvider =
  new HierarchicalClusterDataProvider(hieConfig.cluster);

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
  fs.createReadStream(hieConfig.swg)
    .pipe(csv.parse({ headers: true }))
    .on('error', (e) => console.log(e))
    .on('data', (row) =>
      dataFrame.set(row.image_id, {
        file_path: row.file_path,
        label: row.label,
      })
    )
    .on('end', (rowCount: number) => {
      if (dataFrame.size == 0) throw new Error('Dataset empty');
      console.log('CSV read with ' + rowCount + ' rows');
    });
  // setup hierarchical clustering data
}

// functions
function getPathFromId(id: string): string {
  return getDatumByID(id).file_path;
}

function combineDatumWithID(datum: mnistDatum, id: string): mnistDatumWithID {
  return { image_id: id, file_path: datum.file_path, label: datum.label };
}

function getDatumByID(id: string): mnistDatumWithID {
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
  const absolutPath = path.join(__dirname, '../', file_path);
  res.sendFile(absolutPath);
});

app.get('/data/annotations/:id', (req, res) => {
  res.send(getDatumByID(req.params.id));
});

app.get('/data/allids', (req, res) => {
  res.send(getAllIds());
});

app.get('/data/label/:id', (req, res) => {
  const filteredResult = [...dataFrame.entries()].filter(
    (d) => d[1].label === Number.parseInt(req.params.id)
  );
  res.send(filteredResult.map((row) => row[0]));
});

app.get('/annotations/pages/:id', (req, res) => {
  const batchSize = 20; // rows per page
  const result = [...dataFrame].slice(
    Number.parseInt(req.params.id) * batchSize,
    Number.parseInt(req.params.id) * batchSize + batchSize
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

app.get('/hc/nodes/:id', (req, res) => {
  res.send(hcDataProvider.getNode(Number.parseInt(req.params.id)));
});

app.get('/hc/allchildids/:id', (req, res) => {
  res.send(hcDataProvider.getAllIDs(Number.parseInt(req.params.id)));
});

app.get('/hc/root', (req, res) => {
  res.send(hcDataProvider.root);
});

app.get('/hc/parent/:id', (req, res) => {
  res.send(hcDataProvider.getParent(Number.parseInt(req.params.id)));
});

// for testing random image
app.get('/hc/repimage/:id', (req, res) => {
  const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
  const file_path = getPathFromId(
    dataIDS[Math.floor(Math.random() * dataIDS.length)]
  );
  const absolutPath = path.join(__dirname, '../', file_path);
  res.sendFile(absolutPath);
});

// for testing random image
app.get('/hc/repimage/close/:id/:rank', (req, res) => {
  const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
  const file_path = getPathFromId(
    dataIDS[Math.floor(Math.random() * dataIDS.length)]
  );
  const absolutPath = path.join(__dirname, '../', file_path);
  res.sendFile(absolutPath);
});

// for testing random image
app.get('/hc/repimage/distant/:id/:rank', (req, res) => {
  const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
  const file_path = getPathFromId(
    dataIDS[Math.floor(Math.random() * dataIDS.length)]
  );
  const absolutPath = path.join(__dirname, '../', file_path);
  res.sendFile(absolutPath);
});

app.get('/hc/clusterinfo/size/:id', (req, res) => {
  res.send(
    hcDataProvider.getAllIDs(Number.parseInt(req.params.id)).length.toString()
  );
});

app.get('/hc/clusterinfo/level/:id', (req, res) => {
  res.send(
    hcDataProvider
      .getHierarchicalLevel(Number.parseInt(req.params.id))
      .toString()
  );
});
