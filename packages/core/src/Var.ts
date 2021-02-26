export class Var {
  constructor(public id: number) {
    if (id < 0) {
      throw new RangeError("var id should not less then 0.");
    }
  }
  read(varList: unknown[]) {
    const { id } = this;
    if (id < 0) {
      return varList[varList.length + id];
    }
    return varList[id];
  }
}
