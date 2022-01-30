// ES6 import syntax does not work since no type data is available
import { ColorThief } from 'colorthief';
import { DeltaE } from 'delta-e';
import * as SSIM from 'ssim.js';
import * as fs from 'fs';
import * as jpeg from 'jpeg-js';

//for testing purposes
const imgArray: string[] = [
  'test_images/000000009342.jpg',
  'test_images/000000009343.jpg',
  'test_images/000000009344.jpg',
  'test_images/000000009345.jpg',
  'test_images/000000009346.jpg',
  'test_images/000000009347.jpg',
  'test_images/000000009348.jpg',
  'test_images/000000009349.jpg',
  'test_images/000000009350.jpg',
  'test_images/000000009351.jpg',
];

const imgArrayBW: string[] = [
  'mnist_images/2.jpg',
  'mnist_images/5.jpg',
  'mnist_images/7.jpg',
  'mnist_images/8.jpg',
  'mnist_images/9.jpg',
  'mnist_images/11.jpg',
  'mnist_images/12.jpg',
  'mnist_images/15.jpg',
  'mnist_images/18.jpg',
  'mnist_images/21.jpg',
  'mnist_images/22.jpg',
  'mnist_images/23.jpg',
];

//Find the representative image by using the image color

export class LAB {
  constructor(public L: number, public A: number, public B: number) {}
}

export class ImageRep {
  /**
   * Convert RGB values to LAB values
   * @param rgb Array containing RGB values of an image
   * @returns Array containing the LAB values
   */
  private static rgb2lab(rgb: number[]): number[] {
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
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }

  /**
   * Determine average image color of images and convert the RGB values to LAB to allow comparison
   * @param imgPathArray Array containing the paths to images
   * @returns LABArray containing the LAB color values of the images
   */
  private static async convertLAB(imgPathArray: string[]): Promise<LAB[]> {
    const LABArray: LAB[] = [];
    for (let i = 0; i < imgPathArray.length; i++) {
      const colorValue = await ColorThief.getColor(imgPathArray[i]);
      const colorValueLAB = this.rgb2lab(colorValue);
      LABArray.push(
        new LAB(colorValueLAB[0], colorValueLAB[1], colorValueLAB[2])
      );
    }
    return LABArray;
  }

  /**
   * Compare the LAB color values of the images using the delta-e2000 algorithm
   * @param LABArray Array conatining the LAB color values of an image
   * @returns DeltaArray containing the delta-e2000 values of the compared images
   */
  private static comparison(LABArray: LAB[]): number[][] {
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
   * @returns Path to image representative
   */
  private static DeltaAverage(DeltaArray: number[][]): string {
    const averageArray: number[] = [];
    for (const subArray of DeltaArray) {
      let sum = 0;
      for (const delta of subArray) {
        sum += delta;
      }
      averageArray.push(sum / subArray.length);
    }
    const representative =
      imgArray[averageArray.indexOf(Math.min(...averageArray))];
    return representative;
  }

  public static async coloredImageRepresentative() {
    try {
      const LABArray = await this.convertLAB(imgArray);
      const deltaArray = this.comparison(LABArray);
      this.DeltaAverage(deltaArray);
    } catch (e) {
      console.log(e);
    }
  }
  //Find the representative image by using the structural similarity of an image

  /**
   * Load image data from image path
   * @param filenames filenames/path
   * @param callback
   */
  private static loadImagesJPG(filenames: string[], callback: Function) {
    const images: any[] = [];

    function loaded(img: any) {
      images.push(img);
      if (images.length == filenames.length) callback(images);
    }

    function load(filePath: string, callback: Function) {
      const jpegData = fs.readFileSync(filePath);
      const rawImageData = jpeg.decode(jpegData);
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
  private static compareImages(imgArrayBW: string[]): number[][] {
    const mssimArray: number[][] = [];
    this.loadImagesJPG(imgArrayBW, (images: any) => {
      for (let i = 0; i < images.length; i++) {
        mssimArray[i] = [];
        for (let j = 0; j < images.length; j++) {
          mssimArray[i][j] = SSIM.ssim(images[i], images[j]).mssim;
        }
      }
    });
    return mssimArray;
  }

  /**
   * Determine the average of the mean ssim values to determine the highest ssim indicating the closest overall match between images
   * @param mssimArray Array containing the mean ssim values of the compared images
   * @returns Path to image representative
   */
  private static mssimAverage(mssimArray: number[][]): string {
    const averageArray: number[] = [];
    for (const subArray of mssimArray) {
      let sum = 0;
      for (const delta of subArray) {
        sum += Math.abs(delta);
      }
      averageArray.push((sum - 1) / subArray.length);
    }
    const representative =
      imgArrayBW[averageArray.indexOf(Math.max(...averageArray))];
    return representative;
  }

  public static BWImageRepresentative() {
    try {
      this.mssimAverage(this.compareImages(imgArrayBW));
    } catch (e) {
      console.log(e);
    }
  }
}
