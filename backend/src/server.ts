import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import * as csv from 'fast-csv';
import path from 'path';
import HierarchicalClusterDataProvider from './hierarchicalClusterDataProvider';
import { HIEConfiguration } from './configuration';
import { DataProvider2D } from './2dDataProvider';
import { HexagonAggregator } from './hexagonAggregator';

export type mnistDatum = {
  file_path: string;
  label: string;
};

type mnistDatumWithID = {
  image_id: string;
  file_path: string;
  label: string;
};

// parse commandline arguments
let port = 25679;
let configParameter = '';

let nextAction = '';
process.argv.forEach((arg) => {
  if (arg === '--port' || arg === '-p') nextAction = 'setPort';
  else if (arg === '--config' || arg === '-c') nextAction = 'setConfig';
  else if (nextAction === 'setPort') {
    port = parseInt(arg);
    if (isNaN(port)) throw new Error('Invalid Port');
    nextAction = '';
  } else if (nextAction === 'setConfig') {
    configParameter = arg;
    nextAction = '';
  }
});

if (configParameter === '')
  throw new Error(
    'Please provide a configuration argument with -c or --config'
  );

console.log('Loading configuration from ' + configParameter);
console.log('Port is ' + port);
const confData = JSON.parse(
  fs.readFileSync(configParameter, 'utf-8')
) as HIEConfiguration;
const hieConfig = confData;

const dataFrame: Map<string, mnistDatum> = new Map();
let dataProvider2D: DataProvider2D | null = null;
let hexagonAggregator: HexagonAggregator | null = null;
const app = express();
//const hcDataProvider: HierarchicalClusterDataProvider =
//  new HierarchicalClusterDataProvider(hieConfig.cluster);

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
      dataProvider2D = new DataProvider2D(hieConfig.points2d, dataFrame);
      hexagonAggregator = new HexagonAggregator(dataProvider2D);
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

function getImagePathByID(id: string) {
  const filePath = getPathFromId(id);
  // relative path?
  return path.join(
    confData.imgDataRoot.startsWith('.') ? __dirname : '',
    confData.imgDataRoot,
    filePath
  );
}

// endpoints
app.get('/', (req, res) => {
  res.send('Server is running and listening on port ' + port);
});

app.get('/data/images/:id', (req, res) => {
  res.sendFile(getImagePathByID(req.params.id));
});

app.get('/data/annotations/:id', (req, res) => {
  res.send(getDatumByID(req.params.id));
});

app.get('/data/allids', (req, res) => {
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

//  -------------------------------------------------------------------

app.get('/data/quantized', (req, res) => {
  const columns = parseInt('' + req.query.columns);
  if (isNaN(columns)) throw new Error('Illegal URL parameter content: rows');
  const topleftX = parseInt('' + req.query.topleftX);
  if (isNaN(topleftX))
    throw new Error('Illegal URL parameter content: topleftX');
  const topleftY = parseInt('' + req.query.topleftY);
  if (isNaN(topleftY))
    throw new Error('Illegal URL parameter content: topleftY');
  const bottomrightX = parseInt('' + req.query.bottomrightX);
  if (isNaN(bottomrightX))
    throw new Error('Illegal URL parameter content: bottomrightX');
  const bottomrightY = parseInt('' + req.query.bottomrightY);
  if (isNaN(bottomrightY))
    throw new Error('Illegal URL parameter content: bottomrightY');

  res.send(
    hexagonAggregator?.quantise(
      columns,
      { x: topleftX, y: topleftY },
      { x: bottomrightX, y: bottomrightY }
    )
  );
});

// // ----------------------------------------- hierarchical clustering

// app.get('/hc/nodes/:id', (req, res) => {
//   res.send(hcDataProvider.getNode(Number.parseInt(req.params.id)));
// });

// app.get('/hc/allchildids/:id', (req, res) => {
//   res.send(hcDataProvider.getAllIDs(Number.parseInt(req.params.id)));
// });

// app.get('/hc/root', (req, res) => {
//   res.send(hcDataProvider.root);
// });

// app.get('/hc/parent/:id', (req, res) => {
//   res.send(hcDataProvider.getParent(Number.parseInt(req.params.id)));
// });

// // for testing random image
// app.get('/hc/repimage/:id', (req, res) => {
//   const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
//   res.sendFile(
//     getImagePathByID(dataIDS[Math.floor(Math.random() * dataIDS.length)])
//   );
// });

// // for testing random image
// app.get('/hc/repimage/close/:id/:rank', (req, res) => {
//   const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
//   res.sendFile(
//     getImagePathByID(dataIDS[Math.floor(Math.random() * dataIDS.length)])
//   );
// });

// // for testing random image
// app.get('/hc/repimage/distant/:id/:rank', (req, res) => {
//   const dataIDS = hcDataProvider.getAllIDs(Number.parseInt(req.params.id));
//   res.sendFile(
//     getImagePathByID(dataIDS[Math.floor(Math.random() * dataIDS.length)])
//   );
// });

// app.get('/hc/clusterinfo/size/:id', (req, res) => {
//   res.send(
//     hcDataProvider.getAllIDs(Number.parseInt(req.params.id)).length.toString()
//   );
// });

// app.get('/hc/clusterinfo/level/:id', (req, res) => {
//   res.send(
//     hcDataProvider
//       .getHierarchicalLevel(Number.parseInt(req.params.id))
//       .toString()
//   );
// });

// 2d ------------------------------------------------------------------------

app.get('/2d/all', (req, res) => {
  res.send(dataProvider2D?.getAllPoints());
});

app.get('/2d/single/:id', (req, res) => {
  res.send(dataProvider2D?.getPointByID(req.params.id));
});
