let fs = require('fs');
let makeCompanyRecord = function(str) {
  return str.toLocaleLowerCase().match(/.+/g);
};

let readCompanies = function(path) {
  return new Promise((resolve, reject) => {
    let handleIO = (err, data) => {
      if (err) reject(err);
      let companies = makeCompanyRecord(data);
      resolve(companies);
    }

    fs.readFile(path, 'utf8', handleIO);
  });
}

let targetCompanies = [];

readCompanies('./filters/companies.txt').then((companiesList) => {
  targetCompanies = companiesList;
});

let escapeInvalidSubStr = function(company) {
  company = company.toLocaleLowerCase();
  /*
     this will get ride of - San Francisco, CA
     or any location format that looks like this

     this is tighted to glassdoor's job listing naming scheme
     should make this more general
  */
  return company.replace(/ * -[^-]+/, '');
}

exports.isCompanyIncluded = (company) => {
  company = escapeInvalidSubStr(company);
  let companyRegExp = new RegExp(`\W+${company}\W+`);
  return targetCompanies.some((targetCompany) => {
    return company.toLowerCase().search(targetCompany) > -1;
  });
};

/*
   let company = 'cisco';
   let companyRegExp = new RegExp(`\W+${company}\W+`);
  'san francisco'.search(companyRegExp);
*/
