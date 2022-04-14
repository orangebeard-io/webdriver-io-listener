import OrangebeardClient from "@orangebeard-io/javascript-client";
import { OrangebeardOptions, STATUSES } from "./types";
import fs from "fs";

const util = require("./util");

export class OrangebeardService {
  private _client: OrangebeardClient;
  private _testrunId: any;
  private _orangebeardOptions: OrangebeardOptions;

  constructor(options: OrangebeardOptions, capabilities, config) {
    this._orangebeardOptions = options;
  }

  // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
  async onPrepare() {
    console.log("Service called, create client here");
    this._client = new OrangebeardClient(
      util.getClientSettings(this._orangebeardOptions)
    );

    console.log(
      "Start the test run in orangebeard (store launch-uuid on disk)"
    );
    await this._client.startLaunch(util.getStartTestRun(this._orangebeardOptions)).promise
    this._testrunId = this._client.launchUuid
    
    fs.open(`orangebeard-testrun-${this._testrunId}.tmp`, "w", (e) => {
      if (e) {
        throw e;
      }
    });
  }

  onComplete() {
    // Finish testrun
    console.log("Finish the test run in orangebeard (remove client from disk)");
    this._client.finishLaunch(Object.keys(this._client.map)[0], { status: STATUSES.PASSED });
    fs.unlink(`orangebeard-testrun-${this._testrunId}.tmp`, (e) => {
      if (e) {
        throw e;
      }
    });
  }
}
