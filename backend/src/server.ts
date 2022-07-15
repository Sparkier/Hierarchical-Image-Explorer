import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import type { HIEConfiguration } from './types';
import * as aq from "arquero";

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

// read tables and create a combined arquero table
const swgCSVString = fs.readFileSync(hieConfig.swg).toString()
const points2dCSVString = fs.readFileSync(hieConfig.points2d).toString()

const swgQuero = aq.fromCSV(swgCSVString);
const dimRedQuero = aq.fromCSV(points2dCSVString); 

// unify and drop image_id
let unifiedTable = dimRedQuero.join(swgQuero, ["id", "image_id"], [aq.all(), aq.not("image_id")]);
console.log(`Table loaded with ${unifiedTable.numRows()} rows`)

const app = express();

startServer();
function startServer() {
  console.log('server starting');

  app.use(bodyParser.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));

  // start actual server
  app.listen(port, () => {
    console.log('Server started! on port ' + port);
  });
}

function getAbsolutPath(filePath: string) {
  // relative path?
  return path.join(
    confData.imgDataRoot.startsWith('.') ? __dirname : '',
    confData.imgDataRoot,
    filePath
  );
}

function getColumnByID(id: string){
  return unifiedTable.filter(aq.escape((d:{id:string}) => d.id == id))
}

// endpoints
app.get('/', (_req, res) => {
  res.send('Server is running and listening on port ' + port);
});

app.get('/data/images/:id', (req, res) => {
  const filePath = getColumnByID(req.params.id).get('file_path',0)
  res.sendFile(getAbsolutPath(filePath))
});

app.get('/data/aquero/all', (_req, res) =>{
  res.send(unifiedTable.select(aq.not("file_path")));
})