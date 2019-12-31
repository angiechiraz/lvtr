import React from "react";
import elevator from "./assets/elevator.png";
import "./App.css";
var numbers = require("numbers");
const unirand = require("unirand");

function App() {
  function generateData() {
    //  generate number of calls for each floor for 1 min hour, uniform dist
    //  **ASSUMING average of 10 calls per minute, doesn't really matter (*triple check?), for a half hour
    // TRY https://www.npmjs.com/package/unirand
    unirand.seed("lvtr");
    var nCalls = unirand.uniform(0, 10).distribution(99);
    console.log(nCalls);

    //  generate number of passengers per call for each floor
    var nPassengersPerCall = new Array(99);
    var timeSeries = []; // [0: {{floor: , desitnation, numPassengers: }, {}}, 1: {{floor: , desitnation, numPassengers: }, {}},...]
    for (var i = 2; i < 101; i++) {
      //  **CHECK I'm just using mean of .7 and sd of .5, what do we want
      if (nCalls[i] > 0) {
        nPassengersPerCall[i] = numbers.random.distribution.logNormal(
          Math.round(nCalls[i]),
          0.7,
          0.5
        );
        nPassengersPerCall[i] = nPassengersPerCall[i].map(function(
          each_element
        ) {
          return Number(Math.min(Math.round(each_element), 5));
        });
        var destinations = numbers.random.sample(2, 100, Math.round(nCalls[i]));
        var passengersAndDestinations = nPassengersPerCall[i].map(function(
          e,
          f
        ) {
          return {
            time: Math.round(Math.random() * 30), // random time in the half hour b/c unif. dist.
            floor: i,
            numPassengers: e,
            destination: Math.round(destinations[f])
          };
        });
        nPassengersPerCall[i] = passengersAndDestinations;
        for (var min = 0; min < nPassengersPerCall[i].length; min++) {
          timeSeries.push(passengersAndDestinations[min]);
        }
      } else {
        nPassengersPerCall[i] = [];
      }
    }
    //console.log(nPassengersPerCall);
    console.log(timeSeries);
  }

  generateData();

  return (
    <div className="App">
      <header className="App-header">
        <img src={elevator} className="App-logo" alt="logo" />
        <p className="loading">
          <code>Generating data...</code>
        </p>
      </header>
    </div>
  );
}

export default App;