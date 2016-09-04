var webdriver = require('selenium-webdriver'),
    Q = require('q'),
    phantomjs = require('phantomjs-bin');

var safariAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) ' +
  'AppleWebKit/537.73.11 (KHTML, like Gecko) Version/7.0.1 Safari/537.73.11';

var CSA_HOME_URL = 'https://www.commsecadviserservices.com.au/';
var CSA_PORTFOLIO_SUMMARY_URL = 'https://www.commsecadviserservices.com.au/Private/MyPortfolio/Statements/StatementsPortfolioSummary.aspx';

module.exports = CSA;
function CSA(options) {
  this.options = options;
  options = options || {};
  options.browserName = options.browserName || 'phantomjs';
  options.userAgent = options.userAgent || safariAgent;
  this.flow = webdriver.promise.controlFlow();
}

CSA.prototype.execute = function (fn, cb) {
  var promise = this.flow.execute(fn, cb);
  if (cb) Q(promise).nodeify(cb);
};

CSA.prototype.init = function init(cb) {
  var self = this;

  self.driver = new webdriver.Builder()
  .withCapabilities({
     browserName: self.options.browserName,
     'phantomjs.binary.path': phantomjs.path,
     'phantomjs.page.settings.userAgent': self.options.userAgent
  })
  .build();

  for (var i in self.driver) {
    if (typeof self.driver[i] === 'function' && !(i in self)) {
      self[i] = self.driver[i].bind(self.driver);
    }
  }

  if (cb) this.execute(cb.bind(null, null, this));
  return this;
};

CSA.prototype.quit = function (cb) {
  this.driver.quit();
  if (cb) this.execute(cb);
  return this;
};

CSA.prototype.login = function (username, password, cb) {
  var driver = this;

  driver.get(CSA_HOME_URL);
  driver.sleep(500);
  driver.wait(function () {
    return driver.isVisible('#ctl00_AdviserLoginControl_txtACUserName');
  }, 20000, 'cant find username');
  driver.findElement(webdriver.By.id(
    'ctl00_AdviserLoginControl_txtACUserName'))
    .sendKeys(username);
  driver.findElement(webdriver.By.id(
    'ctl00_AdviserLoginControl_txtACPassword'))
    .sendKeys(password);
  driver.findElement(webdriver.By.id('ctl00_AdviserLoginControl_btnACLogIn_implementation_field')).click();

  // Wait till logged in
  driver.wait(function () {
    return driver.isElementPresent(
      webdriver.By.css('#ctl00_AdviserLoginControl_lblDisplayAccountName_field'));
  }, 20000, 'error waiting to logging in');

  if (cb) this.execute(cb);
  return this;
};

CSA.prototype.portfolioSummary = function (cb) {
  var driver = this;
  driver.get(CSA_PORTFOLIO_SUMMARY_URL);

  var summary = {
    balance: null,
    marketValue: null,
    totalCost: null,
    profitLoss: null,
    changePct: null
  };

  // Wait till can see portfolio balance
  driver.wait(function () {
    return driver.isElementPresent(
      webdriver.By.css('#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_lblPortfolioValue_field'));
  }, 20000, 'error waiting for portfolio element to appear');

  // Wait until balance is populated
  driver.wait(function () {
    return driver.findElement(webdriver.By.id(
      'ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_lblPortfolioValue_field')).then(
      function (el) {
        return el.getInnerHtml().then(function (html) {
          return html.trim().length > 0;
        });
      }
    );
  }, 20000, 'error waiting for portfolio balance');

  var values = {
    '#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_lblPortfolioValue_field':
      'balance',
    '#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_gvCASSharePortfolio_Underlying_ctl03_lblProfitLoss_field':
      'profitLoss',
    '#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_gvCASSharePortfolio_Underlying_ctl03_lblTotalCost_field': 'totalCost',
    '#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_gvCASSharePortfolio_Underlying_ctl03_lblMarketValue_field': 'marketValue',
    '#ctl00_BodyPlaceHolder_StatementsPortfolioSummaryView1_gvCASSharePortfolio_Underlying_ctl03_lblChange_field': 'changePct'
  };

  for (var selector in values) {
    (function (selector, fieldName) {
      driver.getSelectorValue(selector).then(function (html) {
        summary[fieldName] = parseFloat(html.replace(/,/, ''));
      });
    })(selector, values[selector]);
  }

  if (cb) this.execute(cb.bind(null, null, summary));
  return this;
};

CSA.prototype.setAttribute = function (selector, attr, value) {
  var driver = this.driver;
  return driver.executeScript(function (selector, attr, value) {
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    els.forEach(function (el) {
      el[attr] = value;
    });
  }, selector, attr, value);
}

CSA.prototype.getSelectorValue = function (selector) {
  var flow = this.flow,
      driver = this.driver;

  return flow.execute(function () {
    return driver.findElement(webdriver.By.css(selector)).then(
      function (el) {
        return el.getInnerHtml().then(function (html) {
          return html.trim();
        });
      }
    );
  });
};

CSA.prototype.sleep = function (ms) {
  var flow = this.flow;
  return flow.execute(function () {
    return webdriver.promise.delayed(ms);
  });
};

CSA.prototype.isVisible = function(selector) {
  var driver = this.driver;
  return driver.executeScript(function (selector) {
    var visible = false;
    var el = document.querySelector(selector);
    if (el) visible = !(el.offsetWidth <= 0 && el.offsetHeight <= 0);
    return visible;
  }, selector);
};
