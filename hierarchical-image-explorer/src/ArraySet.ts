/**
 * Set implementation that is somewhat capable of working with non-primitive objects
 */
export class ArraySet<T extends object> {
  private stringSet = new Set<string>()

  constructor(array:T[] = []){
    array.forEach(e => this.add(e))
  }

  
  add(value:T){
    this.stringSet.add(JSON.stringify(value))
    return this;
  }

  has(value:T){
    return this.stringSet.has(JSON.stringify(value))
  }

  delete(value:T){
    this.stringSet.delete(JSON.stringify(value))
    return this;
  }

  size(){
    return this.stringSet.size
  }
  
  toArray(): T[]{
    const array:T[] = []
    this.stringSet.forEach(e => {
      const deserializedObject = JSON.parse(e) as T
      array.push(deserializedObject)
    })
    return array;
  }
}