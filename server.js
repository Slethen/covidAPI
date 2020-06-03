var config = require('./config');
var express = require("express");
var app = express();
var request = require("request");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("quick.db");
var cors = require('cors')

app.use(cors());

var getall = setInterval(async () => {
  let response;
  try {
    response = await axios.get("https://www.worldometers.info/coronavirus/");
    if (response.status !== 200) {
      console.log("ERROR");
    }
  } catch (err) {
    return null;
  }

  // to store parsed data
  const result = {};

  // get HTML and parse death rates
  const html = cheerio.load(response.data);
  html(".maincounter-number").filter((i, el) => {
    let count = el.children[0].next.children[0].data || "0";
    count = parseInt(count.replace(/,/g, "") || "0", 10);
    // first one is
    if (i === 0) {
      result.cases = count;
    } else if (i === 1) {
      result.deaths = count;
    } else {
      result.recovered = count;
    }
  });

  db.set("all", result);
  console.log("Updated The Cases", result);
}, scraperFreq);

// var to switch between today & yesterday data
daySwitch = 1;

var getcountries = setInterval(async () => {
  let response;
  try {
    response = await axios.get("https://www.worldometers.info/coronavirus/");
    if (response.status !== 200) {
      console.log("Error", response.status);
    }
  } catch (err) {
    return null;
  }

  // select today or yesterday
  if (daySwitch == 1) {
    day = "today"; dbName = "countries";
  }
  if (daySwitch == 2) {
    day = "yesterday2"; dbName = "twoDay";
  } else {
    day = "yesterday"; dbName = "yesterday";
  }

  // to store parsed data
  const result = [];

  // get HTML and parse death rates
  const html = cheerio.load(response.data);
  const countriesTable = html("table#main_table_countries_" + day);
  const countriesTableCells = countriesTable
    .children("tbody")
    .children("tr:not(.row_continent)")
    .children("td");

  // count worldometers table columns
  const colCount = html('table#main_table_countries_' + day + ' th').length;
  
  const totalColumns = colCount;
  const countryColIndex = 1;
  const casesColIndex = 2;
  const todayCasesColIndex = 3;
  const deathsColIndex = 4;
  const todayDeathsColIndex = 5;
  const curedColIndex = 6;
  const activeColIndex = 9;
  const criticalColIndex = 9;
  const casesPerOneMillionColIndex = 10;
  const deathsPerOneMillionColIndex = 11;
  const testsColIndex = 12;
  const testsPerOneMillionColIndex = 13;

  // minus totalColumns to skip last row, which is total
  for (let i = 0; i < countriesTableCells.length - totalColumns; i += 1) {
    const cell = countriesTableCells[i];
    
    // get country
    if (i % totalColumns === countryColIndex) {
      let country =
        cell.children[0].data ||
        cell.children[0].children[0].data ||
        // country name with link has another level
        cell.children[0].children[0].children[0].data ||
        cell.children[0].children[0].children[0].children[0].data ||
        "";
      country = country.replace(/ /g, "_") || "0";
      country = country.trim();
      if (country.length === 0) {
        // parse with hyperlink
        country = cell.children[0].next.children[0] && cell.children[0].next.children[0].data || "";
      }
      result.push({ country: country.trim() || "" });
    }
    // get cases
    if (i % totalColumns === casesColIndex) {
      let cases = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].cases = parseInt(
        cases.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get today cases
    if (i % totalColumns === todayCasesColIndex) {
      let cases = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].todayCases = parseInt(
        cases.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get deaths
    if (i % totalColumns === deathsColIndex) {
      let deaths = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].deaths = parseInt(
        deaths.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get today deaths
    if (i % totalColumns === todayDeathsColIndex) {
      let deaths = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].todayDeaths = parseInt(
        deaths.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get cured
    if (i % totalColumns === curedColIndex) {
      let cured = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].recovered = parseInt(
        cured.trim().replace(/,/g, "") || 0,
        10
      );
    }
    // get active
    if (i % totalColumns === activeColIndex) {
      let cured =cell.children.length != 0? cell.children[0].data : "";
      result[result.length - 1].active = parseInt(
        cured.trim().replace(/,/g, "") || 0,
        10
      );
    }
    // get critical
    if (i % totalColumns === criticalColIndex) {
      let critical = cell.children.length != 0 ? cell.children[0].data : "";
      result[result.length - 1].critical = parseInt(
        critical.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get total cases per one million population
    if (i % totalColumns === casesPerOneMillionColIndex) {
      let casesPerOneMillion = cell.children.length != 0? cell.children[0].data : "";
      result[result.length - 1].casesPerOneMillion = parseInt(
        casesPerOneMillion.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get total deaths per one million population
    if (i % totalColumns === deathsPerOneMillionColIndex) {
      let deathsPerOneMillion = cell.children.length != 0? cell.children[0].data : "";
      result[result.length - 1].deathsPerOneMillion = parseInt(
        deathsPerOneMillion.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get total tests
    if (i % totalColumns === testsColIndex) {
      let tests = cell.children.length != 0? cell.children[0].data : "";
      result[result.length - 1].tests = parseInt(
        tests.trim().replace(/,/g, "") || "0",
        10
      );
    }
    // get tests per one million population
    if (i % totalColumns === testsPerOneMillionColIndex) {
      let testsPerOneMillion = cell.children.length != 0? cell.children[0].data : "";
      result[result.length - 1].testsPerOneMillion = parseInt(
        testsPerOneMillion.replace(/,/g, "") || "0",
        10
      );
      console.log(testsPerOneMillion);
    }
  }

  db.set(dbName, result);
  console.log("Updated " + day + " Countries", result);

  // increase var until greater then 1 then reset
  if (daySwitch > 2) {
    daySwitch = 2;
  } else {
    ++daySwitch;
  }

}, scraperFreq);

app.get("/", async function(request, response) {
  response.writeHead(301,
    {Location: 'https://covid-19.uk.com/api'}
  );
  response.end();
});

var listener = app.listen(config.port, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

app.get("/all/", async function(req, res) {
  let all = await db.fetch("all");
  res.send(all);
});

app.get("/countries/", async function(req, res) {
  let countries = await db.fetch("countries");
  res.send(countries);
});

app.get("/countries/:country", async function(req, res) {
  let countries = await db.fetch("countries");
  let country = countries.find(
  	e => {
        	if(e.country.toLowerCase().localeCompare(req.params.country.toLowerCase()) === 0)
        	{
            return true;
          }
  	});
  if (!country) {
    res.send("Country not found");
    return;
  }
  res.send(country);
});

app.get("/yesterday/", async function(req, res) {
  let yesterday = await db.fetch("yesterday");
  res.send(yesterday);
});

app.get("/yesterday/:country", async function(req, res) {
  let yesterday = await db.fetch("yesterday");
  let country = yesterday.find(
  	e => {
        	if(e.country.toLowerCase().localeCompare(req.params.country.toLowerCase()) === 0)
        	{
            return true;
          }
  	});
  if (!country) {
    res.send("Country not found");
    return;
  }
  res.send(country);
});

app.get("/twoDay/", async function(req, res) {
  let twoDay = await db.fetch("twoDay");
  res.send(twoDay);
});

app.get("/twoDay/:country", async function(req, res) {
  let twoDay = await db.fetch("twoDay");
  let country = twoDay.find(
  	e => {
        	if(e.country.toLowerCase().localeCompare(req.params.country.toLowerCase()) === 0)
        	{
            return true;
          }
  	});
  if (!country) {
    res.send("Country not found");
    return;
  }
  res.send(country);
});