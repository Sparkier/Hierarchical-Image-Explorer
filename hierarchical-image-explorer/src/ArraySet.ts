/**
 * Set implementation that is somewhat capable of working with non-primitive objects
 */
export class ArraySet<T extends object> {
  private stringSet = new Set<string>();

  constructor(array: T[] = []) {
    array.forEach((e) => this.add(e));
  }

  /**
   * Add a value to the set
   * @param value value to add
   * @returns the set with the new value
   */
  add(value: T) {
    this.stringSet.add(JSON.stringify(value));
    return this;
  }

  /**
   * Checks if a value is in the set
   * @param value value to check
   * @returns true if value is in set false else
   */
  has(value: T) {
    return this.stringSet.has(JSON.stringify(value));
  }

  /**
   * Delete a value from the set
   * @param value value to delete
   * @returns set without the value
   */
  delete(value: T) {
    this.stringSet.delete(JSON.stringify(value));
    return this;
  }

  /**
   * Check the size of the set
   * @returns size of the set
   */
  size() {
    return this.stringSet.size;
  }

  /**
   * Converts the set to an array
   * @returns array containing the set values
   */
  toArray(): T[] {
    const array: T[] = [];
    this.stringSet.forEach((e) => {
      const deserializedObject = JSON.parse(e) as T;
      array.push(deserializedObject);
    });
    return array;
  }
}
