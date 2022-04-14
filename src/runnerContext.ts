import { AdditionalData, AdditionalSuitesData, TestItem} from "./types";

export class RunnerContext {
    private suites: TestItem[] = []
    private tests: TestItem[] = []

    public addSuite(data: TestItem): void {
        this.suites.push(data)
    }

    public updateCurrentSuite(suiteInfo: Partial<TestItem>): void {
        const latestSuite = this.suites.length - 1;
        this.suites[latestSuite] = { ...this.suites[latestSuite], ...suiteInfo }
    }
    
    public getCurrentSuite(): TestItem {
        return this.suites[this.suites.length - 1] || null;
    }

    public getItemById(id: string): any {
        const items: any[] = []
        items.concat(this.tests, this.suites)
        return items.filter(item => item.id == id)[0] || null
    }
    
    public removeSuite(suiteId: string): void {
        this.suites = this.suites.filter(({ id }) => suiteId !== id);
    }
    
    public addTest(test: TestItem): void {
        this.tests.push(test);
    }
    
    public updateCurrentTest(testInfo: Partial<TestItem>): void {
        const latestTest = this.tests.length - 1;
        this.tests[latestTest] = { ...this.tests[latestTest], ...testInfo }
    }
    
    public getCurrentTest(): TestItem {
        return this.tests[this.tests.length - 1] || null
    }
    
    public removeTest(testId: string): void {
        this.tests = this.tests.filter(({ id }) => testId !== id)
    }
}