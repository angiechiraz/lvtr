import React from "react";
import elevatorImg from "../../assets/elevator.png";
import "../../App.css";
import { store } from "../../redux/app-redux";
const unirand = require("unirand");
unirand.seed(store.getState().seed); // keeping the seed consistent

/* create elevator objects
 direction = 0 means elevator is not answering any calls, 
 direction = 1 means elevator is heading to answer a call where passengers are trying to go up,
 direction = -1 means it is heading to answer a call where passengers are trying to go down.
 positions are 0-99, 0 is Lobby
 passengers = # of passengers elevator is CURRENTLY holding, not number of passengers it will be holding after it fulfills it's next call(s) */
var elevators = [
  { direction: 0, position: 0, passengers: 0 }, // shaft A
  { direction: 0, position: 0, passengers: 0 }, // shaft B
  { direction: 0, position: 0, passengers: 0 } // shaft C
];

// create function to take calls as input and output elevator actions
// calls are objects {time: ___, origin: __, destination: __, passengers: ___}
function makeElevatorActions(calls) {
  // declare elevator action time series
  // should contain objects {time: ____, shaft: ____, destination: ____}
  var actions = [];

  for (var index = 0; index < calls.length; index++) {
    let call = calls[index];
    if (
      call.origin < 0 ||
      call.origin > 99 ||
      call.destination < 0 ||
      call.destination > 99
    )
      console.log("call floor origin or destination out of bounds");
    else {
      let callDir = getCallDirction(call.origin, call.destination);
      let elevatorNum = null;
      if (store.getState().approach === "random") {
        elevatorNum = chooseRandomElevator();
      } else elevatorNum = chooseElevator(call.origin, callDir);
      // update elevator action time series
      actions.push({
        time: call.time,
        shaft: elevatorNum,
        destination: call.destination
      });
      // update the respective elevator object
      updateElevator(elevatorNum, callDir, call.passengers);
    }
  }
  console.log(actions);
}

function getCallDirction(origin, destination) {
  // assuming it's impossible for a user to request an elevator bringing them to the floor they are already on
  if (origin < destination) return 1;
  else return -1;
}

function updateElevator(elevatorNum, callDir, passengers) {
  if (elevatorNum == null) console.log("null elevator");
  else if (elevatorNum < 1 || elevatorNum > 3)
    console.log("elevator num out of bounds");
  else {
    let chosenElevator = elevators[elevatorNum - 1];
    chosenElevator.direction = callDir;
  }

  // let currentNumPassengers = chosenElevator.passengers;
  // // if number of passengers will exceed
  // if (currentNumPassengers + passengers > 10) {
  // } else
  //   chosenElevator.passengers = elevators[elevator - 1].passengers + passengers;
}

// function to choose which elevator responds to the call
function chooseElevator(callOrigin, callDir) {
  let posAequalsPosB = elevators[0].position === elevators[1].position;
  let posAequalsPosC = elevators[0].position === elevators[2].position;
  let posBequalsPosC = elevators[1].position === elevators[2].position;

  let dirAequalsdirB = elevators[0].direction === elevators[1].direction;
  let dirAequalsdirC = elevators[0].direction === elevators[2].direction;
  let dirBequalsdirC = elevators[1].direction === elevators[2].direction;
  console.log(dirAequalsdirC);

  let distanceA = elevators[0].position - callOrigin;
  let distanceB = elevators[1].position - callOrigin;
  let distanceC = elevators[2].position - callOrigin;
  console.log(distanceC);

  // check if shaft is going in the opposite direction of the call
  let isAmovingOpposite = elevators[0].direction === -1 * callDir;
  let isBmovingOpposite = elevators[1].direction === -1 * callDir;
  let isCmovingOpposite = elevators[2].direction === -1 * callDir;

  // invalid floor input
  if (callOrigin < 0 || callOrigin > 99) {
    console.log("call floor out of bounds");
  } else if (posAequalsPosB && posBequalsPosC) {
    // if all the elevators are equidistant from the call origin
    if (dirAequalsdirB && dirBequalsdirC) return chooseRandomElevator();
    else if (dirAequalsdirB) {
      /* NOTE: I chose to prioritize an elevator not already moving over an elevator moving in the same direction as the call
            - they will not have any passengers and the distance is all the same here */
      if (elevators[0].direction === 0) return chooseBetween(1, 2);
      else if (elevators[2].direction === 0) return 3;
      else if (elevators[0].direction === callDir) return chooseBetween(1, 2);
      else return 3;
    } else if (dirAequalsdirC) {
      if (elevators[0].direction === 0) return chooseBetween(1, 3);
      else if (elevators[1].direction === 0) return 2;
      else if (elevators[0].direction === callDir) return chooseBetween(1, 3);
      else return 2;
    } else if (dirBequalsdirC) {
      if (elevators[1].direction === 0) return chooseBetween(2, 3);
      else if (elevators[0].direction === 0) return 1;
      else if (elevators[1].direction === callDir) return chooseBetween(2, 3);
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
  // get next random number between 1 and 3, 1 representing shaft A, 2 is shaft B, 3 is shaft C
  return 1 + Math.floor(unirand.next() * 3);
}

function chooseBetween(a, b) {
  if (unirand.next() < 0.5) return a;
  else return b;
}

// compare shafts A and B when they are equidistant to elevator and less distant than C
function compareAB(dirAequalsdirB, isAmovingOpposite, isBmovingOpposite) {
  if (!isAmovingOpposite) {
    // if neither are moving in the opposite direction of the call, choose either
    if (dirAequalsdirB) return chooseBetween(1, 2);
    else if (elevators[0].direction === 0) return 1;
    // A has no passengers
    else if (elevators[1].direction === 0) return 2;
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
    else if (elevators[1].direction === 0) return 2;
    else if (elevators[2].direction === 0) return 3;
    else return 2; // C is moving in wrong direction, return B
  } else if (!isCmovingOpposite) {
    return 3;
  }
}

function compareAC(dirAequalsdirC, isAmovingOpposite, isCmovingOpposite) {
  if (!isAmovingOpposite) {
    if (dirAequalsdirC) return chooseBetween(1, 3);
    else if (elevators[0].direction === 0) return 1;
    else if (elevators[2].direction === 0) return 3;
    else return 1;
  } else if (!isCmovingOpposite) {
    return 3;
  }
}

function Loading() {
  makeElevatorActions([
    { time: 0, origin: 6, destination: 10, passengers: 8 },
    { time: 0, origin: 11, destination: 6, passengers: 3 },
    { time: 2, origin: 100, destination: 10, passengers: 8 }
  ]);
  return (
    <div>
      <img src={elevatorImg} className="elevator-moving" alt="logo" />
      <p className="loading">
        <code>
          {store.getState().approach === "random"
            ? "Random "
            : "Nearest unopposing direction "}
          elevator assignment...
        </code>
      </p>
    </div>
  );
}

export default Loading;
