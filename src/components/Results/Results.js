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
function chooseElevator(callOrigin, direction) {
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
  if (floor < 0 || floor > 99) return -1;
  // if all the elevators have the same position
  else if (posAequalsPosB && posBequalsPosC) {
    if (dirAequalsdirB && dirBequalsdirC) return chooseRandomElevator();
  } else if (shaft1equalsShaft2) {
    if (Math.abs(distance3) < Math.abs(distance1)) return 3;
    else return chooseBetween(1, 2);
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
