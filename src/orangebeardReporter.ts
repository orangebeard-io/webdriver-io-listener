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
import * as fs from "fs";
import {
  Attribute,
  CUCUMBERTYPES,
  ITEMTYPES,
  LOGLEVELS,
  MIMETYPES,
  OrangebeardOptions,
  STATUSES,
  TestItem,
} from "./types";
import strip from "strip-color";

const util = require("./util");

const errorHandler = (err: object) => {
  if (err) {
    console.log(err);
  }
};

export class OrangebeardReporter extends WDIOReporter {
  private _client: OrangebeardClient;
  private _testrunId: any;
  private _syncedAllItems: boolean;
  private _context: RunnerContext = new RunnerContext();
  private _clientItemPromises: Promise<any>[] = [];

  getLaunchIdFromFile = (dir) => {
    var filename = fs
      .readdirSync(dir)
      .filter((fn) => fn.startsWith("orangebeard-testrun-"))[0];
    return filename.match(/orangebeard-testrun-(.*)\.tmp/)[1];
  };

  constructor(options: OrangebeardOptions) {
    super(options);
    this._client = new OrangebeardClient(util.getClientSettings(options));
  }

  get isSynchronised() {
    return this._syncedAllItems;
  }

  set isSynchronised(val: boolean) {
    this._syncedAllItems = val;
  }

  onRunnerStart(runner: RunnerStats) {
    this._testrunId = this._client.startLaunch({
      id: this.getLaunchIdFromFile(runner.config.outputDir),
    }).tempId;
  }

  onSuiteStart(suite: SuiteStats) {
    const parentItem = this._context.getCurrentSuite();
    const parentId = parentItem ? parentItem.id : null;
    const isCucumberFeature = suite.type === CUCUMBERTYPES.FEATURE;
    var attributes: Attribute[];
    if (isCucumberFeature && suite.tags.length > 0) {
      attributes = util.parseTags(suite.tags);
    }

    const newItem = {
      name: suite.title,
      description: suite.description,
      attributes: attributes,
      parentId: parentId,
    };

    if (parentId) {
      this.startTest(newItem);
    } else {
      this.startSuite(newItem);
    }
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

    const newItem = {
      name: test.title,
      parentId: parentId,
    };

    if (step) {
      this.startStep(newItem);
    } else {
      this.startTest(newItem);
    }
  }

  onTestPass(test: TestStats) {
    if (this._context.getCurrentStep()) {
      this._context.updateCurrentStep({ status: STATUSES.PASSED });
    } else {
      this._context.updateCurrentTest({ status: STATUSES.PASSED });
    }

    this.finishTest();
  }

  onTestFail(test: TestStats) {
    if (this._context.getCurrentStep()) {
      this._context.updateCurrentStep({ status: STATUSES.FAILED });
    }
    this._context.updateCurrentTest({ status: STATUSES.FAILED });
    this._context.updateCurrentSuite({ status: STATUSES.FAILED });

    this._client.updateLaunch(this._testrunId, { status: STATUSES.FAILED });

    const testItem =
        this._context.getCurrentStep() || this._context.getCurrentTest();

    test.errors.forEach((error: Error) => {
      this._client.sendLog(testItem.id, {
        level: LOGLEVELS.ERROR,
        message: strip(error.stack),
      });
    });

    this.finishTest();
  }

  onTestSkip(test: TestStats) {
    this._context.updateCurrentTest({ status: STATUSES.SKIPPED });
    this.finishTest();
  }

  onTestEnd(test: TestStats) {
    //NOOP
  }

  startSuite(suite: TestItem) {
    const newSuite = this._client.startTestItem(
      {
        type: ITEMTYPES.SUITE,
        name: suite.name,
        description: suite.description,
        attributes: suite.attributes,
      },
      this._testrunId,
      suite.parentId
    );
    newSuite.promise.catch(errorHandler);
    this._clientItemPromises.push(newSuite.promise);

    this._context.addSuite({
      id: newSuite.tempId,
      name: suite.name,
      parentId: suite.parentId,
    });
  }

  startTest(test: TestItem) {
    const newTest = this._client.startTestItem(
      {
        type: ITEMTYPES.TEST,
        name: test.name,
        description: test.description,
      },
      this._testrunId,
      test.parentId
    );
    newTest.promise.catch(errorHandler);
    this._clientItemPromises.push(newTest.promise);

    this._context.addTest({
      id: newTest.tempId,
      name: test.name,
      parentId: test.parentId,
    });
  }

  startStep(step: TestItem) {
    const newStep = this._client.startTestItem(
      {
        type: ITEMTYPES.STEP,
        name: step.name,
        description: step.description,
        hasStats: false,
      },
      this._testrunId,
      step.parentId
    );
    newStep.promise.catch(errorHandler);
    this._clientItemPromises.push(newStep.promise);

    this._context.addStep({
      id: newStep.tempId,
      name: step.name,
      parentId: step.parentId,
    });
  }

  finishTest() {
    const isStep = this._context.getCurrentStep() != undefined;

    const { id, status } =
      this._context.getCurrentStep() || this._context.getCurrentTest();

    const item = this._client.finishTestItem(id, {
      status: status,
    });

    item.promise.catch(errorHandler);

    this._clientItemPromises.push(item.promise);

    if (isStep) {
      this._context.removeCurrentStep();
    } else {
      this._context.removeCurrentTest();
    }
  }

  onSuiteEnd(suite: SuiteStats) {
    //finish all steps
    while (this._context.getCurrentStep()) {
      this._context.updateCurrentStep({ status: STATUSES.CANCELLED });
      this.finishTest();
    }

    const { id, status } =
      this._context.getCurrentTest() || this._context.getCurrentSuite();
    const item = this._client.finishTestItem(id, {
      status: status,
    });
    item.promise.catch(errorHandler);
    this._clientItemPromises.push(item.promise);

    if (this._context.getCurrentTest()) {
      this._context.removeCurrentTest();
    } else {
      this._context.removeCurrentSuite();
    }
  }

  async onRunnerEnd(): Promise<void> {
    try {
      await Promise.all(this._clientItemPromises);
    } catch (e) {
      console.error(e);
    } finally {
      this._syncedAllItems = true;
    }
  }

  onHookStart(hook: HookStats) {}
  onHookEnd(hook: HookStats) {}

  onBeforeCommand(cmd: BeforeCommandArgs) {}

  onAfterCommand(cmd: AfterCommandArgs) {
    const hasScreenshot =
      /screenshot$/i.test(cmd.command) && !!cmd.result.value;
    const testItem =
      this._context.getCurrentStep() || this._context.getCurrentTest();
    if (hasScreenshot && testItem) {
      const screenshotLog = {
        message: "Take Screenshot",
        level: LOGLEVELS.INFO,
        file: {
          name: "screenshot",
          type: MIMETYPES.PNG,
          content: cmd.result.value,
        },
      };
      this.sendLog(testItem.id, screenshotLog);
    }
  }

  sendLog(tempId: string, { level, message = "", file }): void {
    const logItem = this._client.sendLog(
      tempId,
      {
        message,
        level,
      },
      file
    );
    this._clientItemPromises.push(logItem.promise);
  }
}
