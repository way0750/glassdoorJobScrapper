let { isCompanyIncluded } = require('./filters/companies.js');
let fs = require('fs');

var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until;

var driver = new webdriver.Builder().forBrowser('chrome').build();

let goToPage = function(pageNum = 1) {
  var url = `https://www.glassdoor.com/Job/san-francisco-javascript-jobs-SRCH_IL.0,13_IC1147401_KO14,24_IP${pageNum}.htm?radius=10&fromAge=1`
  driver.get(url)
  driver.findElements(By.css('li.next')).then(() => {
    console.log('stop window from loading')
    driver.executeScript("return window.stop()");
  });
};

let getOpenings = function(pageNum = 1) {
  goToPage(pageNum);
  return driver.findElements(By.css('.jl'));
};

let getOpeningDetails = function(openings) {
  console.log('going to parsePage');
  openings = openings.map((opening) => {
    let company = opening.findElement(By.css('div.flexbox.empLoc div')).getText();
    let job = opening.findElement(By.css('.flexbox > div > a.jobLink')).getText();
    let link = opening.findElement(By.css('.logoWrap a')).getAttribute('href');
    return Promise.all([company, job, link]);
  });
  return Promise.all(openings);
};

let filterByCompanies = function(openingDetails) {
  return openingDetails.filter(([company, job, link]) => {
    // need to escape – South San Francisco, CA
    let searchResult = isCompanyIncluded(company.replace(/San Francisco, CA/, ''));
    return searchResult;
  });
};

let getNextButton = function() {
  return driver.findElements(By.css('.next'))
    .then((buttons) => {
      // sometimes when you get too much data from glassdoor, they ban you
      // you can tell when there is no next button
      if (!buttons.length) return Promise.resolve(null);

      let disabledBTN = buttons[0].findElements(By.css('span.disabled'));
      let clickableBTN = buttons[0].findElements(By.css('a'));

      return Promise.all([disabledBTN, clickableBTN])
        .then(([disabledBTN, clickableBTN]) => {
          let msg = disabledBTN.length ? 'this is the end' : 'clicking button!';
          console.log(msg);
          return disabledBTN.length ? null : buttons[0];
        });
    });
};

let formatData = (jobs) => {
  jobs = jobs.sort((str1, str2) => str1 <= str2);
  jobs = jobs.map((job) => job.join('\n'));
  // have to add \n\n else data will append the last character of file
  return jobs.join('\n\n') + '\n\n';
};

let fileName = new Date().toString() + '.txt';
let appendFile = (jobs) => {
  return new Promise((resolve, reject) => {
    fs.appendFile(fileName, formatData(jobs), (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
};

let parsePage = function(pageNum = 1) {
  return getOpenings(pageNum)
    .then(getOpeningDetails)
    .then(filterByCompanies)
    .then((newTargets) => {
      return appendFile(newTargets).then(() => {
        return getNextButton().then((nextButton) => {
          if(nextButton) return parsePage(pageNum + 1)
        });
      });
    });
};

parsePage().then((arr) => {
  console.log('got the data, closing now...');
  driver.close();
});
