import { Console } from "console";
export class TaskLog extends Console {
  constructor(public readonly groupName: string) {
    super(process.stdout, process.stderr);
  }
  private _fails: string[] = [];
  assert(isTrue: boolean, msg: string) {
    if (!isTrue) {
      this._fails.push(msg);
    }
    super.assert(isTrue, msg);
  }
  finish() {
    if (this._fails.length === 0) {
      console.log(`✅ ~ all [${this.groupName}] test passed!`);
    } else {
      console.error(`⛔ [${this.groupName}] has ${this._fails.length} test failed.`);
    }
  }
}
