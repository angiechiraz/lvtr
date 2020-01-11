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

  // check if shaft is going in the opposite direction of the call
  let isAmovingOpposite = shaftA.direction == -1 * callDir;
  let isBmovingOpposite = shaftB.direction == -1 * callDir;
  let isCmovingOpposite = shaftC.direction == -1 * callDir;

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
    if (Math.abs(distanceA) < Math.abs(distanceC)) {
      // A and B are closer and at least one is not moving the wrong direction, go compare
      if (!isAmovingOpposite || !isBmovingOpposite)
        return compareAB(dirAequalsdirB, isAmovingOpposite, isBmovingOpposite);
      else if (!isCmovingOpposite) return 3; // C is only one in unopposing direction
    } else {
      // C is closest
      if (!isCmovingOpposite) return 3;
      // C is moving the wrong way
      else if (!isAmovingOpposite || !isBmovingOpposite) {
        // A and B are further but at least one is moving the right direction, go compare
        return compareAB(dirAequalsdirB, isAmovingOpposite, isBmovingOpposite);
      } else return chooseRandomElevator(); // all are in an opposing direction to the call, pick a random one
    }
  } else if (posBequalsPosC) {
    if (Math.abs(distanceB) < Math.abs(distanceA)) {
      if (!isBmovingOpposite || !isCmovingOpposite)
        return compareBC(dirBequalsdirC, isBmovingOpposite, isCmovingOpposite);
      else if (!isAmovingOpposite) return 1;
    } else {
      if (!isAmovingOpposite) return 1;
      else if (!isBmovingOpposite || !isCmovingOpposite)
        return compareBC(dirBequalsdirC, isBmovingOpposite, isCmovingOpposite);
      else return chooseRandomElevator();
    }
  } else if (posAequalsPosC) {
    if (Math.abs(distanceA) < Math.abs(distanceB)) {
      if (!isAmovingOpposite || !isCmovingOpposite)
        return compareAC(dirAequalsdirC, isAmovingOpposite, isCmovingOpposite);
      else if (!isBmovingOpposite) return 2;
    } else {
      if (!isBmovingOpposite) return 2;
      else if (!isAmovingOpposite || !isCmovingOpposite)
        return compareAC(dirAequalsdirC, isAmovingOpposite, isCmovingOpposite);
      else return chooseRandomElevator();
    }
  } else {
    // all are diff distances apart
    if (isAmovingOpposite) {
      if (isBmovingOpposite)
        if (isCmovingOpposite) {
          // all aren't moving in call direction
          return chooseRandomElevator();
        } // c is the only one moving in call direction
        else return 3;
      else {
        // B moving in call direction, A is not
        if (isCmovingOpposite) return 2;
        // B and C moving in call direction, choose closest
        else if (Math.abs(distanceB) < Math.abs(distanceC)) return 2;
        else return 3;
      }
    } else {
      // A is moving in call direction
      if (isBmovingOpposite) {
        if (isCmovingOpposite) {
          return 1;
        } else {
          // A and C moving in call direction, not B, choose closest
          if (Math.abs(distanceA) < Math.abs(distanceC)) return 1;
          else return 3;
        }
      } else {
        // A and B moving in call direction
        if (isCmovingOpposite) {
          if (Math.abs(distanceA) < Math.abs(distanceB)) return 1;
          else return 2;
        } else {
          // all moving in call direction, return the closest shaft
          if (Math.abs(distanceA) < Math.abs(distanceB)) {
            if (Math.abs(distanceA) < Math.abs(distanceC)) return 1;
            else return 3;
          } else {
            if (Math.abs(distanceB) < Math.abs(distanceC)) return 2;
            else return 3;
          }
        }
      }
    }
  }
}

function chooseRandomElevator() {
  return Math.round(unirand.uniform(1, 3).random());
}

function chooseBetween(a, b) {
  return unirand.uniform(1, 2).random();
}

// compare shafts A and B when they are equidistant to elevator and less distant than C
function compareAB(dirAequalsdirB, isAmovingOpposite, isBmovingOpposite) {
  if (!isAmovingOpposite) {
    // if neither are moving in the opposite direction of the call, choose either
    if (dirAequalsdirB) return chooseBetween(1, 2);
    else if (shaftA.direction == 0) return 1;
    // A has no passengers
    else if (shaftB.direction == 0) return 2;
    // B has no passengers
    else return 1; // B is in the opposite direction, return A
  } else if (!isBmovingOpposite) {
    // B is closer than C and is in unopposing direction
    return 2;
  }
}

function compareBC(dirBequalsdirC, isBmovingOpposite, isCmovingOpposite) {
  if (!isBmovingOpposite) {
    if (dirBequalsdirC) return chooseBetween(2, 3);
    else if (shaftB.direction == 0) return 2;
    else if (shaftC.direction == 0) return 3;
    else return 2; // C is moving in wrong direction, return B
  } else if (!isCmovingOpposite) {
    return 3;
  }
}

function compareAC(dirAequalsdirC, isAmovingOpposite, isCmovingOpposite) {
  if (!isAmovingOpposite) {
    if (dirAequalsdirC) return chooseBetween(1, 3);
    else if (shaftA.direction == 0) return 1;
    else if (shaftC.direction == 0) return 3;
    else return 1;
  } else if (!isCmovingOpposite) {
    return 3;
  }
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
