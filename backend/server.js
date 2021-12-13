const express = require("express")       
const bodyParser = require("body-parser")
const cors = require("cors")             
const fs = require("fs")
const csv = require("fast-csv")

const imagePath = "/data/mnist/"

const port = 25679
console.log("server starting")

// app initiation
const app = express();
app.use(bodyParser.json())
app.use(cors());
app.use(express.urlencoded({ extended: true }));

console.log("server is alive!")

// load data
var dataFrame = []
fs.createReadStream("data/mnist/mnist_test_swg.csv")
    .pipe(csv.parse({headers: true}))
    .on('error', e => console.log(e))
    .on('data', row => dataFrame.push(row))
    .on('end', rowCount => console.log("CSV read with " + rowCount + " rows"))

// functions
function pathFromId(id){
    return dataFrame.filter(elem => elem.image_id == id)[0].file_path
}

function getElemntByID(id){
    return dataFrame.filter(elem => elem.image_id == id)[0]
}

function getAllIds(){
    allIDs = []
    dataFrame.forEach(datum => {
        allIDs.push(datum.image_id)
    });
    return allIDs
}

// paths
app.get("/", (req,res) => {
    console.log("Request received")
    res.send("Server is running and listening on port " + port)
})

app.get("/data/images/:id", (req,res) => {
    path = pathFromId(req.params.id)
    absolutPath = __dirname + imagePath + path
    res.sendFile(absolutPath)
})

app.get("/data/annotations/:id", (req,res) => {
    res.send(getElemntByID(req.params.id))
})

app.get("/data/allIds", (req,res) => {
    res.send(getAllIds())
})

app.get("/annotations/pages/:id", (req,res) => {
    let batchSize = 20;
    console.log("Req Recieved")
    res.send(dataFrame.slice(req.params.id*batchSize,req.params.id*batchSize+20))
})

app.get("/data/heads", (req,res) => {
    res.send(Object.keys(dataFrame[0]))
})

app.get("/test/:number", (req,res) => {
    res.send(req.params.number)
})

// start actual server
app.listen(port, () => {
    console.log("Server started! on port " + port)
})