/**
 * Collection of methods for backend interaction
 * Sends Promises only
 */
import { SERVER_ADDRESS } from '../config';

export default class BackendService {
  private static serverAddress: string = SERVER_ADDRESS;

  /**
   * Fetches a given endpoint and returns the result as JSON
   * @param endpoint endpoint address
   * @returns JSON containing results from a given endpoint
   */
  private static async getEndpointJSON(endpoint: string): Promise<unknown> {
    const response = await fetch(this.serverAddress + endpoint);
    return response.json();
  }

  /**
   * Returns the image url for a given image id
   * @param dataID image id
   * @returns url of image
   */
  public static getImageUrl(dataID: string): string {
    return `${this.serverAddress}data/images/${dataID}`;
  }

  /**
   * Fetches the complete arquero table
   * @returns arquero table
   */
  public static async getDataArquero(): Promise<string> {
    return (await this.getEndpointJSON('data/aquero/all')) as Promise<string>;
  }
}
