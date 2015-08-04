var expect = require('expect.js'),
    CSA = require('..');

describe('commsec-advisory-services', function() {
  it('should be able to scrape the CSA for core data', function(done) {
    this.timeout(0);

    var driver;
    var cas = new CSA({ browserName: process.env.BROWSER || 'phantomjs' });
    cas
      .init()
      .login(process.env.CSA_USERNAME, process.env.CSA_PASSWORD)
      .portfolioSummary(function (err, summary) {
        if (err) return done(err);
        expect(summary.balance).to.be.a('number');
        expect(summary.marketValue).to.be.a('number');
        expect(summary.totalCost).to.be.a('number');
        expect(summary.profitLoss).to.be.a('number');
        console.log(summary);
      })
      .quit();
  });
});
