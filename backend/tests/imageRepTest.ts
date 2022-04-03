import {bwImageRepresentative, coloredImageRepresentative} from '../src/representative'
//const colorRep = require("../representative")  


//for testing purposes
const imgArray: string[] = [
  'tests/img/000000009342.jpg',
  'tests/img/000000009343.jpg',
  'tests/img/000000009344.jpg',
  'tests/img/000000009345.jpg',
  'tests/img/000000009346.jpg',
  'tests/img/000000009347.jpg',
  'tests/img/000000009348.jpg',
  'tests/img/000000009349.jpg',
  'tests/img/000000009350.jpg',
  'tests/img/000000009351.jpg',
];

const imgArrayBW: string[] = [
  'tests/img/8.jpg',
  'tests/img/15.jpg',
  'tests/img/23.jpg',
  'tests/img/45.jpg',
  'tests/img/53.jpg',
  'tests/img/59.jpg',
  'tests/img/102.jpg',
  'tests/img/120.jpg',
  'tests/img/127.jpg',
  'tests/img/129.jpg',
  'tests/img/132.jpg',
  'tests/img/152.jpg',
];

async function testBof(){
  try{
  const repSSIM = bwImageRepresentative(imgArrayBW, 1);
  const repDeltaE = await coloredImageRepresentative(imgArray, 1)
  console.log(`BW: ${repSSIM} \r\nDeltaE: ${repDeltaE}`)
  }
  catch(e){
    console.log(e)
  }
}

testBof()