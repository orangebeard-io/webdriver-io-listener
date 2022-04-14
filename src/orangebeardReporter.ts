import OrangebeardClient from "@orangebeard-io/javascript-client";
import WDIOReporter, {
  SuiteStats,
  Tag,
  HookStats,
  RunnerStats,
  TestStats,
  BeforeCommandArgs,
  AfterCommandArgs,
  CommandArgs,
} from "@wdio/reporter";
import { RunnerContext } from "./runnerContext";
import fs from "fs";
import {
  Attribute,
  CUCUMBERTYPES,
  ITEMTYPES,
  LOGLEVELS,
  MIMETYPES,
  OrangebeardOptions,
  STATUSES,
} from "./types";

const util = require("./util");

const errorHandler = (err: object) => {
  if (err) {
    console.log(err);
  }
};

export class OrangebeardReporter extends WDIOReporter {
  private _client: OrangebeardClient;
  private _testrunId: any;
  private syncReporting: boolean;
  private _context: RunnerContext = new RunnerContext();

  getLaunchIdFromFile = () => {
    var filename = fs
      .readdirSync(".")
      .filter((fn) => fn.startsWith("orangebeard-testrun-"))[0];
    return filename.match(/orangebeard-testrun-(.*)\.tmp/)[1];
  };
  
  constructor(options: OrangebeardOptions) {
    super(options);
    this._client = new OrangebeardClient(util.getClientSettings(options));
  }

  get isSynchronized(): boolean {
    return this.syncReporting;
  }

  set isSynchronized(val: boolean) {
    this.syncReporting = val;
  }

  onRunnerStart(runner: RunnerStats) {
    this._testrunId = this._client.startLaunch({
      id: this.getLaunchIdFromFile(),
    }).tempId;
  }

  onSuiteStart(suite: SuiteStats) {
    const parentItem = this._context.getCurrentSuite();
    const parentId = parentItem ? parentItem.id : null;
    const { title: name } = suite;
    const isCucumberFeature = suite.type === CUCUMBERTYPES.FEATURE;
    var attributes: Attribute[];
    if (isCucumberFeature && suite.tags.length > 0) {
      attributes = util.parseTags(suite.tags);
    }
    const item = this._client.startTestItem(
      {
        type: parentId ? ITEMTYPES.TEST : ITEMTYPES.SUITE,
        name: name,
        description: suite.description,
        attributes: attributes,
      },
      this._testrunId,
      parentId
    );

    item.promise.catch(errorHandler);

    this._context.addSuite({ id: item.tempId, name: name });
  }

  onTestStart(test: TestStats) {
    var step = true;
    const parentItem = this._context.getCurrentTest();

    const parentId = parentItem
      ? parentItem.id
      : this._context.getCurrentSuite().id;
    if (!parentItem) {
      step = false;
    }

    const { title: name } = test;
    const item = this._client.startTestItem(
      {
        type: step ? ITEMTYPES.STEP : ITEMTYPES.TEST,
        name: name,
        hasStats: false,
      },
      this._testrunId,
      parentId
    );

    item.promise.catch(errorHandler);
    this._context.addTest({ id: item.tempId, name: name });
  }

  onTestPass(test: TestStats) {
    this._context.updateCurrentTest({ status: STATUSES.PASSED });
    this.finishTest(test);
  }
  onTestFail(test: TestStats) {
    this._context.updateCurrentTest({ status: STATUSES.FAILED });
    this._context.updateCurrentSuite({ status: STATUSES.FAILED });

    const testItem = this._context.getCurrentTest();
    test.errors.forEach((error: Error, idx) => {
      this._client.sendLog(testItem.id, {
        level: LOGLEVELS.ERROR,
        message: error.stack,
      });
    });

    this.finishTest(test);
  }
  onTestSkip(test: TestStats) {
    this._context.updateCurrentTest({ status: STATUSES.SKIPPED });
    this.finishTest(test);
  }

  onTestEnd(test: TestStats) {
    //NOOP
  }

  finishTest(test: TestStats) {
    //console.log(`Finish test: ${test.title}`);
    const { id, status } = this._context.getCurrentTest();

    const item = this._client.finishTestItem(id, {
      status: status,
    });
    item.promise.catch(errorHandler);
    this._context.removeTest(id);
  }

  onSuiteEnd(suite: SuiteStats) {
    //console.log(`Finished suite: ${suite.title}`);
    const { id, status } = this._context.getCurrentSuite();

    const item = this._client.finishTestItem(id, {
      status: status || STATUSES.PASSED,
    });
    item.promise.catch(errorHandler);
    this._context.removeSuite(id);
  }

  async onRunnerEnd(): Promise<void> {
    //console.log(`Finish runner`);
  }

  onHookStart(hook: HookStats) {
    //console.log(`Start hook: ${hook.title}`);
  }
  onHookEnd(hook: HookStats) {
    //console.log(`Finish hook: ${hook.title}`);
  }

  onBeforeCommand(cmd: BeforeCommandArgs) {
    //console.log(`Before command: ${cmd.body}`);
  }
  
  onAfterCommand(cmd: AfterCommandArgs) {
    const hasScreenshot = /screenshot$/i.test(cmd.command) && !!cmd.result.value;
    const testItem = this._context.getCurrentTest();
    if (hasScreenshot /*&& this.options.attachPicturesToLogs*/ && testItem) {
      const logRQ = {
        message: 'Screenshot',
        level: LOGLEVELS.INFO,
        file: {
          name: 'screenshot',
          type: MIMETYPES.PNG,
          content: cmd.result.value,
        },
      };
      this.sendLog(testItem.id, logRQ);
    }
  }

  sendLog(tempId: string, { level, message = '', file }): void {
    this._client.sendLog(
      tempId,
      {
        message,
        level,
      },
      file,
    );
  }
}
