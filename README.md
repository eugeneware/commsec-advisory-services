# commsec-advisory-services

Scrape portfolio information from CommsecAdvisoryServices.com.au

[![build status](https://secure.travis-ci.org/eugeneware/commsec-advisory-services.png)](http://travis-ci.org/eugeneware/commsec-advisory-services)

## Installation

This module is installed via npm:

``` bash
$ npm install commsec-advisory-services
```

## Example Usage

``` js
var CSA = require('commsec-advisor-services');
var cas = new CSA({ browserName: process.env.BROWSER || 'phantomjs' });
cas
  .init()
  .login('my username', 'my password')
  .portfolioSummary(function (err, summary) {
    if (err) throw err;
    console.log(summary);
    /*
      { balance: 305527.07,
        marketValue: 302584.65,
        totalCost: 299825.16,
        profitLoss: 2759.49,
        changePct: 0.9 }
    */
  })
  .quit();
```
