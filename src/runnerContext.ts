import { TestItem } from "./types";

export class RunnerContext {
  private suites: TestItem[] = [];
  private tests: TestItem[] = [];
  private steps: TestItem[] = [];

  public addSuite(data: TestItem): void {
    this.suites.push(data);
  }

  public getCurrentSuite(): TestItem {
    return this.suites[this.suites.length - 1] || null;
  }

  public updateCurrentSuite(suiteInfo: Partial<TestItem>): void {
    const latestSuite = this.suites.length - 1;
    this.suites[latestSuite] = { ...this.suites[latestSuite], ...suiteInfo };
  }

  public removeCurrentSuite(): void {
    this.suites.pop();
  }

  public addTest(test: TestItem): void {
    this.tests.push(test);
  }

  public updateCurrentTest(testInfo: Partial<TestItem>): void {
    const latestTest = this.tests.length - 1;
    this.tests[latestTest] = { ...this.tests[latestTest], ...testInfo };
  }

  public getCurrentTest(): TestItem {
    return this.tests[this.tests.length - 1] || null;
  }

  public removeCurrentTest(): void {
    this.tests.pop();
  }

  public addStep(step: TestItem): void {
    this.steps.push(step);
  }

  public updateCurrentStep(stepInfo: Partial<TestItem>): void {
    const latestStep = this.steps.length - 1;
    this.steps[latestStep] = { ...this.steps[latestStep], ...stepInfo };
  }

  public updateStepWithId(id: string, stepInfo: Partial<TestItem>): void {
    const stepIndex = this.steps.findIndex(s => s.id == id)
    this.steps[stepIndex] = { ...this.steps[stepIndex], ...stepInfo };
  }

  public getCurrentStep(): TestItem {
    return this.steps[this.steps.length - 1] || null;
  }

  public getStepWithId(id: string): TestItem {
    return this.steps.find(s => s.id == id);
  }

  public removeCurrentStep(): void {
    this.steps.pop();
  }

  public removeStepWithId(id: string) {
    this.steps.splice(this.steps.findIndex(s => s.id == id), 1)
  }

  public getItemById(id: string): TestItem {
    const allItems = this.steps.concat(this.tests, this.suites);
    return allItems.find(item => item.id == id);
  }
}
