export class TaskLog {
  constructor(public readonly groupName: string) {}
  private _fails: string[] = [];
  log = console.log;
  warn = console.warn;
  error = console.error;
  info = console.info;
  debug = console.debug;
  assert(isTrue: boolean, msg: string) {
    if (!isTrue) {
      this._fails.push(msg);
    }
    console.assert(isTrue, msg);
  }
  finish() {
    if (this._fails.length === 0) {
      console.log(`✅ ~ all [${this.groupName}] test passed!`);
    } else {
      console.error(`⛔ [${this.groupName}] has ${this._fails.length} test failed.`);
    }
  }
}
