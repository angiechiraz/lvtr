import React from "react";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store } from "../../redux/app-redux";
const unirand = require("unirand");
unirand.seed(store.getState().seed); // keeping the seed consistent

// create elevator objects
// if direction = 0 elevator is not moving, direction = 1 elevator is moving up, -1 moving down
// positions are 0-99, 0 is Lobby
var shaftA = [{ direction: 0 }, { position: 0 }, { passengers: 0 }];
var shaftB = [{ direction: 0 }, { position: 0 }, { passengers: 0 }];
var shaftC = [{ direction: 0 }, { position: 0 }, { passengers: 0 }];

// create function to take calls as input and output elevator actions
// calls are objects {time: ___, origin: __, destination: __, passengers: ___}
function makeElevatorActions(calls) {
  // declare elevator action time series
  // should contain objects {time: ____, bank: ____, destination: ____}
  var actions = [];

  for (var index = 0; index < calls.length; index++) {}
}

// function to choose which elevator responds to the call
function chooseElevator(callOrigin, callDir) {
  let posAequalsPosB = shaftA.position == shaftB.position;
  let posAequalsPosC = shaftA.position == shaftC.position;
  let posBequalsPosC = shaftB.position == shaftC.position;

  let dirAequalsdirB = shaftA.direction == shaftB.direction;
  let dirAequalsdirC = shaftA.direction == shaftC.direction;
  let dirBequalsdirC = shaftB.direction == shaftC.direction;

  let distanceA = shaftA.position - callOrigin;
  let distanceB = shaftB.position - callOrigin;
  let distanceC = shaftC.position - callOrigin;

  // invalid floor input
  if (callOrigin < 0 || callOrigin > 99) return -1;
  // if all the elevators are equidistant from the call origin
  else if (posAequalsPosB && posBequalsPosC) {
    if (dirAequalsdirB && dirBequalsdirC) return chooseRandomElevator();
    else if (dirAequalsdirB) {
      /* NOTE: I chose to prioritize an elevator not already moving over an elevator moving in the same direction as the call
            - they will not have any passengers and the distance is all the same here */
      if (shaftA.direction == 0) return chooseBetween(1, 2);
      else if (shaftC.direction == 0) return 3;
      else if (shaftA.direction == callDir) return chooseBetween(1, 2);
      else return 3;
    } else if (dirAequalsdirC) {
      if (shaftA.direction == 0) return chooseBetween(1, 3);
      else if (shaftB.direction == 0) return 2;
      else if (shaftA.direction == callDir) return chooseBetween(1, 3);
      else return 2;
    } else if (dirBequalsdirC) {
      if (shaftB.direction == 0) return chooseBetween(2, 3);
      else if (shaftA.direction == 0) return 1;
      else if (shaftB.direction == callDir) return chooseBetween(2, 3);
      else return 1;
    }
    // if elevators A and B are equidistant from the call origin
  } else if (posAequalsPosB) {
  }
}

function chooseRandomElevator() {
  return Math.round(unirand.uniform(1, 3).random());
}

function chooseBetween(a, b) {
  return unirand.uniform(1, 2).random();
}

const Results = props => {
  return (
    <div>
      {/* <div style={{ flexDirection: "column", }}> */}
      <p>Avg wait time:</p>
      <p>Avg ride time:</p>
      <p>Avg total time:</p>
      {/* </div> */}
      <div className="row">
        <LvtrButton
          label={"Random assignment"}
          handleClick={() => props.startSim()}
        />
        <LvtrButton label={"Custom assignment"} />
      </div>
    </div>
  );
};

export default Results;
