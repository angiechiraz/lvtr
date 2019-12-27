import React from "react";
import elevator from "./assets/elevator.png";
import "./App.css";
var numbers = require("numbers");

function App() {
  function generateData() {
    //  generate number of calls for each floor, uniform dist
    //  **ASSUMING average of 1 call per minute, doesn't really matter, for a half hour
    var nCalls = numbers.random.sample(0, 30, 99);

    //  generate number of passengers per call, lognormal dist min 0 max 5
    //  **CHECK I'm just using mean and sd of 1, what do we want
    var nPassengersPerCall = new Array(99);
    for (var i = 2; i < 101; i++) {
      nPassengersPerCall[i] = numbers.random.distribution.logNormal(
        Math.round(nCalls[i]),
        1,
        1
      );
      nPassengersPerCall[i] = nPassengersPerCall[i].map(function(each_element) {
        return Number(Math.min(Math.round(each_element), 5));
      });
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
