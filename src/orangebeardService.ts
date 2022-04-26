import OrangebeardClient from "@orangebeard-io/javascript-client";
import { OrangebeardOptions } from "./types";
import fs from "fs";
import path from "path";

const util = require ('./util');

export class OrangebeardService {
  private _client: OrangebeardClient;
  private _testrunId: any;
  private _orangebeardOptions: OrangebeardOptions;
  private _outputDir: any;

  constructor(options: OrangebeardOptions, capabilities, config) {
    this._orangebeardOptions = options;
    this._outputDir = config.outputDir;
  }

  // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
  async onPrepare() {
    this._client = new OrangebeardClient(
      util.getClientSettings(this._orangebeardOptions)
    );

    this.cleanTestRunTempFiles();

    await this._client.startLaunch(
      util.getStartTestRun(this._orangebeardOptions)
    ).promise;
    this._testrunId = this._client.launchUuid;

    fs.open(
      `${this._outputDir}${path.sep}orangebeard-testrun-${this._testrunId}.tmp`,
      "w",
      (e) => {
        if (e) {
          throw e;
        }
      }
    );
  }

  onComplete() {
    this._client.finishLaunch(Object.keys(this._client.map)[0], {});
    fs.unlink(
      `${this._outputDir}${path.sep}orangebeard-testrun-${this._testrunId}.tmp`,
      (e) => {
        if (e) {
          throw e;
        }
      }
    );
  }

  private cleanTestRunTempFiles() {
    fs.readdir(this._outputDir, (error, files) => {
      if (error) {
        throw error;
      }
      files
        .filter((name) => /orangebeard-testrun-.+\.tmp$/.test(name))
        .forEach((f) => {
          console.warn(`Existing tmp file found! Deleting ${f}`);
          fs.unlink(`${this._outputDir}${path.sep}${f}`, (e) => {
            if (e) throw e;
          });
        });
    });
  }
}
