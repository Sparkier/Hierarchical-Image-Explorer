const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const fs = require("fs")
const csv = require("fast-csv")
const path = require('path')

const imagePath = "/data/mnist/"

const port = 25679

console.log("server starting")

// app initiation
const app = express();
app.use(bodyParser.json())
app.use(cors());
app.use(express.urlencoded({ extended: true }));

console.log("server is alive!")

type mnistDatum = {
    image_id: string,
    file_path: string,
    label: number
}

// load data
let dataFrame: mnistDatum[] = []
fs.createReadStream("data/mnist/mnist_test_swg.csv")
    .pipe(csv.parse({ headers: true }))
    .on('error', e => console.log(e))
    .on('data', row => dataFrame.push(row))
    .on('end', rowCount => console.log("CSV read with " + rowCount + " rows"))

// functions
function getPathFromId(id): string {
    return getDatumByID(id).file_path
}

function getDatumByID(id): mnistDatum {
    if (dataFrame.length == 0) throw new Error("Dataframe empty")
    const resultSet = dataFrame.filter(elem => elem.image_id == id)
    if (resultSet.length == 0) throw new Error("Id not in dataframe")
    return resultSet[0]
}

function getAllIds(): string[] {
    let allIDs: string[] = []
    dataFrame.forEach(datum => {
        allIDs.push(datum.image_id)
    });
    return allIDs
}

// endpoints
app.get("/", (req, res) => {
    res.send("Server is running and listening on port " + port)
})

app.get("/data/images/:id", (req, res) => {
    let file_path = getPathFromId(req.params.id)
    let absolutPath = path.join(__dirname, "../") + file_path
    res.sendFile(absolutPath)
})

app.get("/data/annotations/:id", (req, res) => {
    res.send(getDatumByID(req.params.id))
})

app.get("/data/allIds", (req, res) => {
    res.send(getAllIds())
})

app.get("/annotations/pages/:id", (req, res) => {
    const batchSize = 20; // rows per page
    res.send(dataFrame.slice(req.params.id * batchSize, req.params.id * batchSize + batchSize))
})

app.get("/data/heads", (req, res) => {
    if (dataFrame.length > 0) {
        res.send(Object.keys(dataFrame[0]))
    }
    else throw new Error("Empty dataframe")
})

app.get("/test/:number", (req, res) => {
    res.send(req.params.number)
})

// start actual server
app.listen(port, () => {
    console.log("Server started! on port " + port)
})