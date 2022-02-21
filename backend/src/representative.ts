import DeltaE = require('delta-e');
import * as SSIM from 'ssim.js';
import * as fs from 'fs';
import * as jpeg from 'jpeg-js';
import ColorThief from 'colorthief';
import { ImageData } from 'ssim.js/dist/types';

//Find the representative image by using the image color

export class LAB {
  constructor(public L: number, public A: number, public B: number) {}

  /**
   * Convert RGB values to LAB values
   * @param rgb Array containing RGB values of an image
   * @returns Array containing the LAB values
   */
  public static rgb2lab(rgb: number[]): LAB {
    let r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x: number,
      y: number,
      z: number;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return new LAB(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
}

/**
 * Compute average image color of images and convert the RGB values to LAB to allow comparison
 * @param imgPathArray Array containing the paths to images
 * @returns LABArray containing the average LAB color values of the images
 */
async function computeAverageImageColor(
  imgPathArray: string[]
): Promise<LAB[]> {
  return await Promise.all(
    imgPathArray.map(async (imgPath: string) => {
      const colorValue = await ColorThief.getColor(imgPath);
      return LAB.rgb2lab(colorValue);
    })
  );
}

/**
 * Compare the LAB color values of the images using the delta-e2000 algorithm
 * @param LABArray Array containing the average LAB color values of the images
 * @returns DeltaArray containing the delta-e2000 values of the compared images
 */
function createDistanceMatrixDE(LABArray: LAB[]): number[][] {
  const DeltaArray: number[][] = [];
  for (let i = 0; i < LABArray.length; i++) {
    DeltaArray[i] = [];
    for (let j = 0; j < LABArray.length; j++) {
      DeltaArray[i][j] = DeltaE.getDeltaE00(LABArray[i], LABArray[j]);
    }
  }
  return DeltaArray;
}

/**
 * Determine the average of the delta-e2000 values to determine the lowest delta-e indicating the closest overall match between images
 * @param DeltaArray Array containing the delta-e2000 values of the compared images
 * @returns Array containing the delta-e2000 average of the images
 */
function computeDeltaEAverage(DeltaArray: number[][]): number[] {
  return DeltaArray.map((subArray) => {
    return (
      subArray.reduce((partialSum, a) => partialSum + a, 0) / subArray.length
    );
  });
}

//Find the representative image by using the structural similarity of an image

/**
 * Load image data from image path
 * @param filenames filenames/path
 * @param callback called after each image has been loaded with the image values as argument
 */
function loadImagesJPG(
  filenames: string[],
  callback: (img: jpeg.UintArrRet[]) => void
) {
  const images: jpeg.UintArrRet[] = [];
  function loaded(img: jpeg.UintArrRet) {
    images.push(img);
    if (images.length == filenames.length) callback(images);
  }

  function load(filePath: string, callback: (img: jpeg.UintArrRet) => void) {
    const jpegData: Buffer = fs.readFileSync(filePath);
    const rawImageData: jpeg.UintArrRet = jpeg.decode(jpegData, {
      useTArray: true,
    });
    callback(rawImageData);
  }

  for (const filename of filenames) {
    load(filename, loaded);
  }
}

/**
 * Compare the images using the structural similarity index measure (SSIM)
 * @param imgArrayBW Array containing the paths to images
 * @returns Array containing the mean ssim values of the compared images
 */
function createDistanceMatrixSSIM(imgArrayBW: string[]): number[][] {
  const mssimArray: number[][] = [];
  loadImagesJPG(imgArrayBW, (images: jpeg.UintArrRet[]) => {
    for (let i = 0; i < images.length; i++) {
      mssimArray[i] = [];
      for (let j = 0; j < images.length; j++) {
        mssimArray[i][j] = SSIM.ssim(
          imageDataFromUintArrRet(images[i]),
          imageDataFromUintArrRet(images[j])
        ).mssim;
      }
    }
  });
  return mssimArray;
}

/**
 * Converts jpeg.UintArrRet images to ImageData type
 */
function imageDataFromUintArrRet(input: jpeg.UintArrRet): ImageData {
  return {
    data: Uint8ClampedArray.from(input.data),
    height: input.height,
    width: input.width,
  };
}

/**
 * Determine the average of the mean ssim values to determine the highest ssim indicating the closest overall match between images
 * @param mssimArray Array containing the mean ssim (MSSIM) values of the compared images
 * @returns Array containing the average ssim values
 */
function computeSSIMAverage(mssimArray: number[][]): number[] {
  return mssimArray.map((subArray) => {
    return (
      subArray.reduce((partialSum, a) => partialSum + a, 0) / subArray.length
    );
  });
}

/**
 * Exported function containing all helper functions to find a BW image representative
 * @param imgArrayBW Array containing the image paths
 * @param numberOfRep Number of representatives
 * @returns path to BW image with the highest overall match
 */
export function bwImageRepresentative(
  imgArrayBW: string[],
  numberOfRep: number
): string[] {
  const avgArray = computeSSIMAverage(createDistanceMatrixSSIM(imgArrayBW));
  return getTopRepresentatives(imgArrayBW, avgArray, true, numberOfRep);
}

/**
 * Exported function containing all helper functions to find a colored image representative
 * @param imgArray Array containing the image paths
 * @param numberOfRep Number of representatives
 * @returns path to colored image with the highest overall match
 */
export async function coloredImageRepresentative(
  imgArray: string[],
  numberOfRep: number
): Promise<string[]> {
  const LABArray = await computeAverageImageColor(imgArray);
  const deltaArray = createDistanceMatrixDE(LABArray);
  const avgArray = computeDeltaEAverage(deltaArray);
  return getTopRepresentatives(imgArray, avgArray, false, numberOfRep);
}

/**
 * Determines the best suited image representative by choosing the lowest delta-e or the highest ssim value
 * @param imgArray Array containing the image paths
 * @param averageArray Array containing the average delta-e/ssim values of the images
 * @param topRep flag to set whether the lowest delta-e or the highest ssim is chosen
 * (best match for Delta-E: set topRep 'false' & best match for SSIM: set topRep 'true';
 * to determine the lowest match the other way around)
 * @param numOfRep Number of representatives
 * @returns Array containing paths to images with the highest overall match
 */
function getTopRepresentatives(
  imgArray: string[],
  averageArray: number[],
  topRep: boolean,
  numOfRep: number
): string[] {
  if (topRep) {
    return getTopN(imgArray, averageArray, numOfRep);
  } else {
    return getBotN(imgArray, averageArray, numOfRep);
  }
}

function getTopN(
  imgArray: string[],
  averageArray: number[],
  numOfRep: number
): string[] {
  const resultArr: string[] = [];
  const averageArrayCopy = averageArray.slice();
  const topNArray = averageArrayCopy
    .sort(function (a, b) {
      return b - a;
    })
    .slice(0, numOfRep);
  for (const element of topNArray) {
    resultArr.push(imgArray[averageArray.indexOf(element)]);
  }
  return resultArr;
}

function getBotN(
  imgArray: string[],
  averageArray: number[],
  numOfRep: number
): string[] {
  const resultArr: string[] = [];
  const averageArrayCopy = averageArray.slice();
  const topNArray = averageArrayCopy
    .sort(function (a, b) {
      return a - b;
    })
    .slice(0, numOfRep);
  for (const element of topNArray) {
    resultArr.push(imgArray[averageArray.indexOf(element)]);
  }
  return resultArr;
}
