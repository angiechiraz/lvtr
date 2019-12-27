import React from "react";
import elevator from "./assets/elevator.png";
import "./App.css";
var numbers = require("numbers");

function App() {
  function generateData() {
    //  generate number of calls for each floor in a half hour, uniform dist
    //  **ASSUMING average of 1 call per minute, doesn't really matter (*triple check?), for a half hour
    var nCalls = numbers.random.sample(0, 30, 99);

    //  generate number of passengers per call for each floor
    var nPassengersPerCall = new Array(99);
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
        var destinations = numbers.random.sample(1, 100, Math.round(nCalls[i]));
        var passengersAndDestinations = nPassengersPerCall[i].map(function(
          e,
          f
        ) {
          return { numPassengers: e, destination: Math.round(destinations[f]) };
        });
        nPassengersPerCall[i] = passengersAndDestinations;
      } else {
        nPassengersPerCall[i] = [];
      }
    }
    console.log(nPassengersPerCall);
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
