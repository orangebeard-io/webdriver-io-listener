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
  import {
    Attribute,
    CUCUMBERTYPES,
    ITEMTYPES,
    LogItem,
    LOGLEVELS,
    OrangebeardOptions,
    STATUSES,
  } from "./types";
  
  const OrangebeardClient = require("@orangebeard-io/javascript-client");
  const util = require("./util");
  
  /**
   * Basic error handler for promises. Just prints errors.
   *
   * @param {Object} err Promise's error
   */
  const errorHandler = (err: object) => {
    if (err) {
      console.log(err);
    }
  };
  
  export class OrangebeardReporter extends WDIOReporter {
    private _orangebeardClient;
    private _latestScreenshot?: string;
    private _options: OrangebeardOptions;
    private _testrun: RunnerContext = new RunnerContext();
    private customLaunchStatus: string;
    private syncReporting: boolean;
  
    constructor(options: OrangebeardOptions = {}, client: OrangebeardClient) {
      super(options);
      this._orangebeardClient - client
      
    }
  
    get isSynchronized(): boolean {
      return this.syncReporting;
    }
  
    set isSynchronized(val: boolean) {
      this.syncReporting = val;
    }
  
    onRunnerStart(runner: RunnerStats) {
      //   console.log(`Start runner: ${runner.sanitizedCapabilities}`)
      // //Start run
      // this._options.attributes = this._options.attributes
      //   ? [this._options.attributes, runner.sanitizedCapabilities].join(";")
      //   : runner.sanitizedCapabilities;
      
    }
  
    onSuiteStart(suite: SuiteStats) {
      console.log(`Start suite: ${suite.title}`)
      //Start Suite (or test)
      const parentItem = this._testrun.getCurrentSuite();
      const parentId = parentItem ? parentItem.id : null;
      const { title: name } = suite;
      const isCucumberFeature = suite.type === CUCUMBERTYPES.FEATURE;
      var attributes: Attribute[];
      if (isCucumberFeature && suite.tags.length > 0) {
        attributes = util.parseTags(suite.tags);
      }
      const item = this._orangebeardClient.startTestItem(
        {
          type: parentId ? ITEMTYPES.TEST : ITEMTYPES.SUITE,
          name: name,
          description: suite.description,
          attributes: attributes,
        },
        this._testrun.getRun().tempId,
        parentId
      );
  
      item.promise.catch(errorHandler);
      if (parentId) {
        this._testrun.addTest({ id: item.tempId, name: name });
      } else {
        this._testrun.addSuite({ id: item.tempId, name: name });
      }
    }
  
    onTestStart(test: TestStats) {
      //Start step
      const { id: parentId } = this._testrun.getCurrentSuite();
      const { title: name } = test;
      const item = this._orangebeardClient.startTestItem(
        {
          type: ITEMTYPES.STEP,
          name: name,
          hasStats: false
        },
        this._testrun.getRun().tempId,
        parentId
      );
  
      item.promise.catch(errorHandler);
      this._testrun.addTest({ id: item.tempId, name: name });
    }
  
    onTestPass(test: TestStats) {
      this.finishTest(test);
    }
    onTestFail(test: TestStats) {
      //log failure
      const testItem = this._testrun.getCurrentTest();
      test.errors.forEach((error: Error, idx) => {
        this._orangebeardClient.sendLog(testItem.id, {
          level: LOGLEVELS.ERROR,
          message: error.stack,
        });
        if (idx === test.errors.length - 1) {
          const lastError = `\`\`\`error\n${error.stack}\n\`\`\``;
          this._testrun.updateCurrentTest({
            description: testItem.description
              ? `${testItem.description}\n${lastError}`
              : lastError,
          });
        }
      });
      this.finishTest(test);
    }
    onTestSkip(test: TestStats) {
      this.finishTest(test);
    }
  
    onTestEnd(test: TestStats) {
      //NOOP
    }
  
    finishTest(test: TestStats) {
      //Determine status etc and finish
      const { id, attributes, description, status } =
        this._testrun.getCurrentTest();
  
      const item = this._orangebeardClient.finishTestItem(id, {
        status: test.state,
        ...(attributes && { attributes }),
        ...(description && { description }),
        ...(status && { status }),
      });
      item.promise.catch(errorHandler);
      this._testrun.removeTest(id);
    }
  
    onSuiteEnd(suite: SuiteStats) {
      const { id, name } = this._testrun.getCurrentSuite();
      const { status, attributes, description } =
        this._testrun.getAdditionalSuiteData(name);
  
      const item = this._orangebeardClient.finishTestItem(id, {
        ...(status && { status }),
        ...(attributes && { attributes }),
        ...(description && { description }),
      });
      item.promise.catch(errorHandler);
      this._testrun.removeSuite(id);
    }
  
    async onRunnerEnd(): Promise<void> {
      try {
        await this._orangebeardClient.getPromiseFinishAllItems(
          this._testrun.getRun().tempId
        );
        const item = await this._orangebeardClient.finishLaunch(
          this._testrun.getRun().tempId,
          {
            ...(this.customLaunchStatus && { status: this.customLaunchStatus }),
          }
        );
        item.promise.catch(errorHandler);
        this._testrun.getRun().tempId = null;
        this.customLaunchStatus = null;
      } catch (e) {
        console.error(e);
      } finally {
        this.isSynchronized = true;
      }
    }
  
    onHookStart(hook: HookStats) {}
    onHookEnd(hook: HookStats) {}
  
    onBeforeCommand(cmd: BeforeCommandArgs) {}
    onAfterCommand(cmd: AfterCommandArgs) {}
  
    isScreenshotCommand(command: CommandArgs) {
      const isScreenshot = /\/session\/[^/]*(\/element\/[^/]*)?\/screenshot/;
      return (
        // WebDriver protocol
        (command.endpoint && isScreenshot.test(command.endpoint)) ||
        // DevTools protocol
        command.command === "takeScreenshot"
      );
    }
  
    attachScreenshot() {
      if (this._latestScreenshot) {
        //log screenshot from string
        //this._allure.addAttachment('Screenshot', Buffer.from(this._lastScreenshot, 'base64'))
        this._latestScreenshot = undefined;
      }
    }
  
    getAttributes({ tags }: SuiteStats) {
      const labels: { name: string; value: string }[] = [];
      if (tags) {
        (tags as Tag[]).forEach((tag: Tag) => {
          const label = tag.name.replace(/[@]/, "").split("=");
          if (label.length === 2) {
            labels.push({ name: label[0], value: label[1] });
          }
        });
      }
      return labels;
    }
  
    sendLog(tempId: string, { level, message = "", file }: LogItem): void {
      this._orangebeardClient.sendLog(
        tempId,
        {
          message,
          level,
        },
        file
      );
    }
  }
  