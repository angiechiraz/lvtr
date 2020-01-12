import React from "react";
import elevatorImg from "../../assets/elevator.png";
import "../../App.css";
import {
  store,
  setAvgWait,
  setAvgRide,
  setStatus,
  setAvgTotal
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
// declare elevator action time series
// should contain objects {time: ____, shaft: ____, destination: ____}
var actions = [];

// create function to take calls as input and output elevator actions
// calls are objects {time: ___, origin: __, destination: __, passengers: ___, pickUpTime: ___}
/* constraints: 
   takes 1 sec for elevator to move 1 floor
   takes 5 secs to open elevator door to pick up/ drop off, but 30 secs on lobby floor
   max 10 people per elevator */
function makeElevatorActions(calls, changeStatus) {
  let allCallsAnswered = false;
  let t = 0;
  let callIndex = 0;
  var waitTimes = [];
  var rideTimes = [];
  var transitionTimes = [];

  // loop until all passengers have arrived at their desintation
  while (!allCallsAnswered) {
    // if there are any calls left in the time series, check if any are happening at current time
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

    // handle all elevator updates for the given second
    elevators.forEach(function(elevator) {
      // if the elevator has an assigned call
      if (elevator.pendingRequests.length > 0) {
        // if the elevator only has one pending call, there is no question of what is priority
        if (elevator.pendingRequests.length === 1) {
          // debugging
          if (
            elevator.currentDirection === 0 &&
            elevator.pendingRequests[0].dropOffTime === null &&
            elevator.position !== elevator.pendingRequests[0].origin
          )
            console.log(
              "error: elevator was never set in motion for an assigned call"
            );

          // if the elevator is not currently letting passengers enter or exit, update its position
          // takes 30 seconds for passengers to enter or exit shaft on lobby floor, 5 seconds on any other floor
          const pickupTransition =
            elevator.pendingRequests[0].origin === 0 ? 30 : 5;
          const dropoffTransition =
            elevator.pendingRequests[0].destination === 0 ? 30 : 5;
          if (
            elevator.pendingRequests[0].pickUpTime === null ||
            (elevator.pendingRequests[0].pickUpTime !== null &&
              t - elevator.pendingRequests[0].pickUpTime > pickupTransition) ||
            (elevator.pendingRequests[0].dropOffTime !== null &&
              elevator.pendingRequests[0].dropOffTime < t - dropoffTransition)
          ) {
            elevator.position = elevator.position + elevator.currentDirection;
          }

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
              console.log("made it to pick up on floor " + elevator.position);

              // pick up passengers
              elevator.passengers = call.passengers;
              elevator.pendingRequests[0].pickUpTime = t; // for tracking ride time
              // start ride time tracking for these passengers
              for (var p = 0; p < call.passengers; p++) {
                // wait time for each passeneger was current time minus the time of the call
                waitTimes.push(t - call.time + call.miscTime);
                /* the pick up time needs to be accounted for when we calculate total time spent, and
                  since it's not part of wait time or ride time here, store it */
                transitionTimes.push(pickupTransition);
              }
              // if aren't already going in direction of call, change directions
              elevator.currentDirection = getCallDirection(
                call.origin,
                call.destination
              );
            }
          } else {
            if (elevator.position === call.destination) {
              if (elevator.pendingRequests[0].dropOffTime === null) {
                console.log("made it to destination!");
                elevator.pendingRequests[0].dropOffTime = t;
                // stop the elevator to drop off passengers
                elevator.direction = 0;
                elevator.currentDirection = 0;
              } else if (
                t - elevator.pendingRequests[0].dropOffTime ===
                dropoffTransition
              ) {
                // all passengers are off the shaft
                elevator.passengers = elevator.passengers - call.passengers;
                // record ride times
                for (var r = 0; r < call.passengers; r++) {
                  /* ride time for each passeneger is the current time minus the time the ride started (which is
                    the pick up time plus the time it takes the passenger to get on the elevator) */
                  rideTimes.push(t - (call.pickUpTime + pickupTransition));
                }
                // remove pending action from elevator
                elevator.pendingRequests.splice(0, 1);
              }
            }
          }
        } else {
          // handle multiple assigned calls
          let calls = elevator.pendingRequests;

          /* we only want to handle calls going in the currently assigned direction first, 
               even if this is not the current moving direction */
          var countCallsinDirection = calls.filter(
            call =>
              getCallDirection(call.origin, call.destination) ===
              elevator.direction
          ).length;

          // if all the pending calls in the previous direction were handled, set direction to the next (earliest made) pending request
          if (countCallsinDirection === 0) {
            console.log(
              "switching to handle calls that were previously in the unassigned direction"
            );
            let nextCall = elevator.pendingRequests[0];
            let nextCallDir = getCallDirection(
              nextCall.origin,
              nextCall.destination
            );
            let nextElevatorDirection = getCallDirection(
              elevator.position,
              nextCall.origin
            );
            elevator.direction = nextCallDir;
            elevator.currentDirection = nextElevatorDirection;
          }

          // count how many unpicked up calls we are at the origin of
          // var callsFromPosition = calls.filter(
          //   call =>
          //     call.pickUpTime === null &&
          //     elevator.position === call.origin &&
          //     getCallDirection(call.origin, call.destination) ===
          //       elevator.direction
          // );
          // // count how many calls we have already picked up that drop off here
          // var callsToPosition = calls.filter(
          //   call =>
          //     call.pickUpTime !== null &&
          //     call.dropOffTime === null &&
          //     elevator.position === call.destination &&
          //     getCallDirection(call.origin, call.destination) ===
          //       elevator.direction
          // );
          // // count how many calls we already picked up here but are still loading passengers
          // var callsLoading = calls.filter(
          //   call =>
          //     call.pickUpTime !== null &&
          //     elevator.position === call.origin &&
          //     getCallDirection(call.origin, call.destination) ===
          //       elevator.direction &&
          //     t < call.pickUpTime + (call.origin === 0 ? 30 : 5)
          // );
          // // count how many calls we already picked up but are still unloading passengers here
          // var callsUnloading = calls.filter(
          //   call =>
          //     call.dropOffTime !== null &&
          //     elevator.position === call.destination &&
          //     getCallDirection(call.origin, call.destination) ===
          //       elevator.direction &&
          //     t < call.dropOffTime + (call.destination === 0 ? 30 : 5)
          // );

          // if we don't have any people to pick up here or drop off, and no transitions underway, move position
          // if (
          //   callsFromPosition.length +
          //     callsToPosition.length +
          //     callsLoading.length +
          //     callsUnloading.length ===
          //   0
          // ) {
          //   elevator.position = elevator.position + elevator.currentDirection;
          // }

          /* update elevator position. for cases in which elevator is currently still dropping people off or 
            picking people up, the currentDirection should be set to zero */
          elevator.position = elevator.position + elevator.currentDirection;

          // count how many unpicked up calls we are now at the origin of
          var callsFromPosition = calls.filter(
            call =>
              call.pickUpTime === null &&
              elevator.position === call.origin &&
              getCallDirection(call.origin, call.destination) ===
                elevator.direction
          );
          // // count how many calls we have already picked up that drop off here
          var callsToPosition = calls.filter(
            call =>
              call.pickUpTime !== null &&
              call.dropOffTime === null &&
              elevator.position === call.destination &&
              getCallDirection(call.origin, call.destination) ===
                elevator.direction
          );
          // // count how many calls we already picked up here but are still loading passengers
          var callsLoading = calls.filter(
            call =>
              call.pickUpTime !== null &&
              elevator.position === call.origin &&
              t < call.pickUpTime + (call.origin === 0 ? 30 : 5)
          );
          // // count how many calls we are already at the destination of but are still unloading passengers here
          var callsUnloading = calls.filter(
            call =>
              call.dropOffTime !== null &&
              elevator.position === call.destination &&
              t < call.dropOffTime + (call.destination === 0 ? 30 : 5)
          );

          if (callsToPosition.length > 0) {
            /* drop off passengers who have this destination before picking up new ones, will affect # passengers */
            elevator.currentDirection = 0;
            calls.forEach(function(call, requestIndex) {
              // if it is in the assigned direction
              if (
                getCallDirection(call.origin, call.destination) ===
                elevator.direction
              ) {
                if (
                  call.pickUpTime !== null &&
                  call.destination === elevator.position &&
                  call.dropOffTime === null
                ) {
                  console.log("made it to destination!");
                  elevator.pendingRequests[requestIndex].dropOffTime = t;
                }
              }
            });
          }
          /* pick up passengers who have this origin, and edit pending action to record 
            how many people from that call actually got on the elevator*/
          if (callsFromPosition.length > 0) {
            elevator.currentDirection = 0;
            calls.forEach(function(call, requestIndex) {
              // if it is in the assigned direction
              if (
                getCallDirection(call.origin, call.destination) ===
                elevator.direction
              ) {
                if (
                  call.pickUpTime === null &&
                  call.origin === elevator.position
                ) {
                  console.log(
                    "made it to pickup at floor " + elevator.position
                  );
                  let request = elevator.pendingRequests[requestIndex];
                  request.pickUpTime = t;
                  let totalPassengers =
                    elevator.passengers + request.passengers;
                  //update amount of passengers being accounted for currently
                  if (totalPassengers > 10) {
                    let passengersWhoDontFit = totalPassengers - 10;
                    let passengersWhoMadeIt =
                      request.passengers - passengersWhoDontFit;
                    request.passengers = passengersWhoMadeIt;
                    request.neglectedPassengers = passengersWhoDontFit;
                    for (var n = 0; n < passengersWhoMadeIt; n++) {
                      waitTimes.push(t - request.time + request.miscTime);
                      transitionTimes.push(elevator.position === 0 ? 30 : 5);
                    }
                  } else {
                    for (var n = 0; n < totalPassengers; n++) {
                      waitTimes.push(t - request.time + request.miscTime);
                      transitionTimes.push(elevator.position === 0 ? 30 : 5);
                    }
                  }
                }
              }
            });
          }

          /* handle calls still being loaded - are we done loading? can we set current direction
            and make a call for any neglected passengers? */
          if (callsLoading.length > 0) {
            calls.forEach(function(call, requestIndex) {
              let transitionTime = elevator.position === 0 ? 30 : 5;
              if (
                call.pickUpTime !== null &&
                call.origin === elevator.position &&
                t - call.pickUpTime === transitionTime
              ) {
                elevator.currentDirection = getCallDirection(
                  call.origin,
                  call.destination
                );
                if (call.neglectedPassengers > 0) {
                }
              }
            });
          }

          /* handle calls still being unloaded - are we done unloading? can we set current 
            direction and record ride times? */
        }
      }
    });

    console.log(t);
    t++;
  }

  // store avg wait time and ride time
  console.log(actions);
  console.log(elevators);
  let avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
  let avgRide = rideTimes.reduce((a, b) => a + b, 0) / rideTimes.length;
  let avgTransition =
    transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length;
  console.log("avg wait: " + avgWait);
  console.log("avg ride: " + avgRide);
  console.log("avg transition: " + avgTransition);
  store.dispatch(setAvgWait(avgWait));
  store.dispatch(setAvgRide(avgRide));
  store.dispatch(setAvgTotal(avgWait + avgRide + avgTransition));
  store.dispatch(setStatus("results"));
  changeStatus("results");
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
  // if no actions have been made yet, use first random number the seed provides, otherwise get the next one
  let random = actions.length === 0 ? unirand.random() : unirand.next();
  return 1 + Math.floor(random * 3);
}

function chooseBetween(a, b) {
  // if no actions have been made yet, use first random number the seed provides, otherwise get the next one
  let random = actions.length === 0 ? unirand.random() : unirand.next();
  if (random < 0.5) return a;
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

const resetElevatorsandActions = () => {
  actions = [];
  elevators.forEach(function(elevator) {
    elevator.position = 0;
  });
};

const Loading = props => {
  let callTimeSeries = [
    {
      time: 0,
      origin: 99,
      destination: 0,
      passengers: 8,
      pickUpTime: null,
      dropOffTime: null,
      neglectedPassengers: 0, // use later on for passengers who used to be part of this call that didn't make it on the elevator,
      miscTime: 0 // use to account for unanticipated wait time, i.e. if people had to call multiple times
    },
    {
      time: 20,
      origin: 0,
      destination: 68,
      passengers: 8,
      pickUpTime: null,
      dropOffTime: null,
      modified: false,
      neglectedPassengers: 0,
      miscTime: 0
    }
  ];
  resetElevatorsandActions(); //reset in case someone is simulating again from this screen
  makeElevatorActions(callTimeSeries, props.changeStatus);
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
};

export default Loading;
