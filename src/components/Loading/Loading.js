import React from "react";
import elevatorImg from "../../assets/elevator.png";
import "../../App.css";
import {
  store,
  setAvgWait,
  setAvgRide,
  setStatus
} from "../../redux/app-redux";
const unirand = require("unirand");
unirand.seed(store.getState().seed); // keeping the seed consistent

/* create elevator objects
 direction = 0 means elevator is not answering any calls, 
 direction = 1 means elevator is heading to answer a call where passengers are trying to go up,
 direction = -1 means it is heading to answer a call where passengers are trying to go down.
 currentDirection is the direction it is currently moving. i.e. it could be moving up to pick up a downward call
 positions are 0-99, 0 is Lobby
 passengers = # of passengers elevator is CURRENTLY holding, not number of passengers it will be holding after it fulfills it's next call(s) */
var elevators = [
  {
    // shaft A
    direction: 0,
    currentDirection: 0,
    position: 0,
    passengers: 0,
    pendingRequests: []
  },
  {
    // shaft B
    direction: 0,
    currentDirection: 0,
    position: 0,
    passengers: 0,
    pendingRequests: []
  },
  {
    // shaft C
    direction: 0,
    currentDirection: 0,
    position: 0,
    passengers: 0,
    pendingRequests: []
  }
];

// create function to take calls as input and output elevator actions
// calls are objects {time: ___, origin: __, destination: __, passengers: ___, pickUpTime: ___}
/* constraints: 
   takes 1 sec for elevator to move 1 floor
   takes 5 secs to open elevator door to pick up/ drop off, but 30 secs on lobby floor
   max 10 people per elevator */
function makeElevatorActions(calls) {
  // declare elevator action time series
  // should contain objects {time: ____, shaft: ____, destination: ____}
  var actions = [];
  let allCallsAnswered = false;
  let t = 0;
  let callIndex = 0;
  var waitTimes = [];
  var rideTimes = [];

  // loop until all passengers have arrived at their desintation
  while (!allCallsAnswered) {
    // handle all updates for the given second
    elevators.forEach(function(elevator, index) {
      // if the elevator has an assigned call
      if (elevator.pendingRequests.length > 0) {
        if (elevator.currentDirection === 0)
          console.log(
            "error: elevator was never set in motion for an assigned call"
          );
        // if the elevator is not currently letting passengers enter or exit, update its position
        if (
          elevator.pendingRequests[0].pickUpTime === null ||
          (elevator.pendingRequests[0].pickUpTime != null &&
            t - elevator.pendingRequests[0].pickUpTime >
              (elevator.pendingRequests[0].origin === 0 ? 30 : 5))
        ) {
          elevators[index].position =
            elevator.position + elevator.currentDirection;
        }
        // if it only has one
        if (elevator.pendingRequests.length === 1) {
          let call = elevator.pendingRequests[0];
          if (
            call.pickUpTime === null &&
            elevator.position !== call.origin &&
            elevator.currentDirection !==
              getCallDirection(elevator.position, call.origin)
          )
            console.log(
              "error: elevator not going in direction of call origin"
            );
          if (call.pickUpTime === null) {
            if (elevator.position === call.origin) {
              console.log("made it to pick up!");

              // pick up passengers
              elevators[index].passengers = call.passengers;
              elevator.pendingRequests[0].pickUpTime = t; // for tracking ride time
              // start ride time tracking for these passengers
              for (var p = 0; p < call.passengers; p++) {
                // wait time for each passeneger was current time minus the time of the call
                waitTimes.push(t - call.time);
              }
              // if aren't already going in direction of call, change directions
              elevators[index].currentDirection = getCallDirection(
                call.origin,
                call.destination
              );
            }
          } else {
            if (elevator.position === call.destination) {
              console.log("made it to destination!");

              // drop off passengers
              elevators[index].passengers =
                elevators[index].passengers - call.passengers;
              // record ride times
              for (var r = 0; r < call.passengers; r++) {
                /* wait time for each passeneger was current time minus the time of the call
                  and the 5 seconds it takes passengers to exit */
                rideTimes.push(t + 5 - call.pickUpTime);
              }
              // remove pending action from elevator and stop moving
              elevators[index].pendingRequests.splice(0, 1);
              elevators[index].direction = 0;
              elevators[index].currentDirection = 0;
            }
          }
        } else {
          // handle multiple assigned calls
          // first handle only the ones in the assigned direction
          // *handle calls with too many passengers for elevator
        }
      }
    });

    // if there are any calls left in the time series, check if it is happening yet
    if (callIndex < calls.length) {
      // handle all calls happening at this time
      if (calls[callIndex].time === t) {
        do {
          let call = calls[callIndex];
          // assign elevator to respond to call
          let action = handleCall(call);
          actions.push(action);
          callIndex++;
        } while (callIndex < calls.length && calls[callIndex].time === t);
      }
    } else {
      if (
        // no elevators have unfinished calls
        elevators[0].pendingRequests.length +
          elevators[1].pendingRequests.length +
          elevators[2].pendingRequests.length ===
        0
      ) {
        console.log("all calls have been taken care of");
        allCallsAnswered = true;
      }
    }
    console.log(t);
    t++;
  }
  console.log(actions);
  console.log(elevators);
  let avgWait =
    waitTimes.reduce(function(a, b) {
      return a + b;
    }, 0) / waitTimes.length;
  let avgRide = rideTimes.reduce((a, b) => a + b, 0) / rideTimes.length;
  console.log("avg wait: " + avgWait);
  console.log("avg ride: " + avgRide);
  store.dispatch(setAvgWait(avgWait));
  store.dispatch(setAvgRide(avgRide));
  store.dispatch(setStatus("results"));
}

function handleCall(call) {
  let callDir = getCallDirection(call.origin, call.destination);
  console.log("call direction " + callDir);
  let elevatorShaft = null;
  if (store.getState().approach === "random") {
    elevatorShaft = chooseRandomElevator();
  } else elevatorShaft = chooseElevator(call.origin, callDir);

  // update the respective elevator object
  updateElevatorAssignments(elevatorShaft, callDir, call);

  // return action to update elevator action time series
  return {
    time: call.time,
    shaft: elevatorShaft,
    pickup: call.origin,
    destination: call.destination
  };
}

function getCallDirection(origin, destination) {
  if (origin === destination) return 0;
  if (origin < destination) return 1;
  else return -1;
}

function updateElevatorAssignments(elevatorShaft, callDir, call) {
  if (elevatorShaft == null) console.log("null elevator");
  else if (elevatorShaft < 1 || elevatorShaft > 3)
    console.log("elevator num out of bounds");
  else {
    let chosenElevator = elevators[elevatorShaft - 1];
    chosenElevator.pendingRequests.push(call);
    // if elevator isn't already heading to a call, assign it directions
    if (chosenElevator.pendingRequests.length === 1) {
      elevators[elevatorShaft - 1].currentDirection = getCallDirection(
        chosenElevator.position,
        call.origin
      );
      console.log(
        "current direction " + elevators[elevatorShaft - 1].currentDirection
      );
      /* direction elevator will need to deliver passengers once they are picked up...
  for nonrandom approach we only want it to pick up same direction calls*/
      elevators[elevatorShaft - 1].direction = callDir;
    }
  }
}

// function to choose which elevator responds to the call
function chooseElevator(callOrigin, callDir) {
  let posAequalsPosB = elevators[0].position === elevators[1].position;
  let posAequalsPosC = elevators[0].position === elevators[2].position;
  let posBequalsPosC = elevators[1].position === elevators[2].position;

  let dirAequalsdirB = elevators[0].direction === elevators[1].direction;
  let dirAequalsdirC = elevators[0].direction === elevators[2].direction;
  let dirBequalsdirC = elevators[1].direction === elevators[2].direction;

  let distanceA = elevators[0].position - callOrigin;
  let distanceB = elevators[1].position - callOrigin;
  let distanceC = elevators[2].position - callOrigin;

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
  let callTimeSeries = [
    { time: 10, origin: 0, destination: 10, passengers: 8, pickUpTime: null }
  ];
  makeElevatorActions(callTimeSeries);
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
