<h1 align="center">
  <a href="https://github.com/orangebeard-io/webdriver-io-listener">
    <img src="https://raw.githubusercontent.com/orangebeard-io/webdriver-io-listener/master/.github/logo.svg" alt="Orangebeard.io postman Listener" height="200">
  </a>
  <br>Orangebeard.io WDIO Listener<br>
</h1>

<h4 align="center">Orangebeard listener (a service and reporter) for <a href="https://webdriver.io/" target="_blank" rel="noopener">WebdriverIO</a></h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@orangebeard-io/wdio-orangebeard-reporter">
    <img src="https://img.shields.io/npm/v/@orangebeard-io/wdio-orangebeard-reporter.svg?style=flat-square"
      alt="NPM Version" />
  </a>
  <a href="https://github.com/orangebeard-io/webdriver-io-listener/actions">
    <img src="https://img.shields.io/github/workflow/status/orangebeard-io/webdriver-io-listener/release?style=flat-square"
      alt="Build Status" />
  </a>
  <a href="https://github.com/orangebeard-io/webdriver-io-listener/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/orangebeard-io/webdriver-io-listener?style=flat-square"
      alt="License" />
  </a>
</p>

<div align="center">
  <h4>
    <a href="https://orangebeard.io">Orangebeard</a> |
    <a href="#installation">Installation</a> |
    <a href="#configuration">Configuration</a>
  </h4>
</div>

## Installation

### Install the npm package

```shell
npm install @orangebeard-io/wdio-orangebeard-reporter
```

## Configuration

In your wdio config file(s), import the service and reporter and provide the necessary configuration

```JavaScript
import {OrangebeardService, OrangebeardReporter} from 'wdio-orangebeard-reporter'

const orangebeardConfig = {
  token: '00000000-0000-0000-00000000',
  endpoint: 'https://my.orangebeard.app',
  project: 'my_project',
  testset: 'WebdriverIO Test',	
  description: "A WDIO Test Run"
};
```

Then add the responder and service to the reporters and services array, providing the configuration object

```JavaScript
reporters: [[OrangebeardReporter, orangebeardConfig]],
services: [[OrangebeardService, orangebeardConfig]],
```

### Running

Now run your tests normally and get results in Orangebeard
