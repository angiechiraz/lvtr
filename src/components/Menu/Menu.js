import React from "react";
import elevator from "../../assets/elevator.png";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store, setApproach } from "../../redux/app-redux";

var numbers = require("numbers");
const unirand = require("unirand");

function generateData() {
  //  generate number of calls for each floor for 1 min, uniform dist
  //  **ASSUMING average of 10 calls per minute, doesn't really matter (*triple check?), for a half hour
  unirand.seed("lvtr");
  var timeSeries = []; // [0: {{floor: , desitnation, numPassengers: }, {}}, 1: {{floor: , desitnation, numPassengers: }, {}},...]
  //var totalCalls = unirand.uniform(0,72000);
  unirand
    .uniform(0, 10)
    .distribution(99)
    .then(nCalls => {
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

          var destinations = numbers.random.sample(
            2,
            100,
            Math.round(nCalls[i])
          );
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

      console.log(timeSeries);
    });
}

const Menu = props => {
  // generateData();
  return (
    <div>
      <img src={elevator} className="elevator" alt="logo" />
      <div className="row">
        <LvtrButton
          label={"Random assignment"}
          handleClick={() => {
            store.dispatch(setApproach("random"));
            props.startSim("loading");
          }}
        />
        <LvtrButton
          label={"Custom assignment"}
          handleClick={() => {
            store.dispatch(setApproach("custom"));
            props.startSim("loading");
          }}
        />
      </div>
    </div>
  );
};

export default Menu;
