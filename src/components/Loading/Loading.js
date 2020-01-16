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
import { wait } from "@testing-library/react";
const unirand = require("unirand");
unirand.seed(store.getState().seed); // keeping the seed consistent

var callTimeSeries = [];
var elevators = []; // array of 3 elevator objects
var actions = []; // elevator actions the function will output
var waitTimes = [];
var rideTimes = [];
var transitionTimes = [];

/* generate call times series data for input*/
// asynchronous because the unirand lognormal function is asynchronous
async function generateData(changeStatus) {
  // reset data
  resetElevatorsandActions();
  for (var t = 0; t < 1000; t += 30) {
    let firstRandom = t === 0 ? unirand.random() : unirand.next();
    let origin = Math.floor(firstRandom * 100); // calls are evenly dist among floors
    let destination = Math.floor(unirand.next() * 100); // destination can't be same as origin
    /* number of passengers follows lognormal dist between (0,5], using mean of 1.4 and sd of .5 based on expectation of reality */
    await unirand
      .lognormal(1.4, 0.5)
      .next()
      .then(val => {
        callTimeSeries.push({
          time: t,
          origin: origin,
          destination: destination,
          passengers: Math.max(Math.min(Math.floor(val), 5), 1),
          pickUpTime: null,
          dropOffTime: null,
          neglectedPassengers: 0, // use later on for passengers who used to be part of this call but didn't make it on the elevator due to lack of space
          miscTime: 0 // use to account for unanticipated wait time, i.e. if people had to call multiple times because they didn't make the first call
        });
        if (t === 990) {
          // the last time increment
          console.log(callTimeSeries);
          makeElevatorActions(callTimeSeries, changeStatus); // after we have call time series, send to elevator action making function
        }
      });
  }
}

// function to take calls as input and output elevator actions
function makeElevatorActions(calls, changeStatus) {
  let allCallsAnswered = false;
  var t = 0; // time is in seconds
  let callIndex = 0;

  // loop until all passengers have arrived at their desintation
  while (!allCallsAnswered) {
    // if there are any calls left in the time series, check if any are happening at current time
    if (t > 20000) {
      console.log("stuck"); // escape check in case passengers were never delivered long after call
      allCallsAnswered = true;
    } else if (callIndex < calls.length) {
      if (calls[callIndex].time < t)
        console.log("ERROR: time series in not in time order");
      // handle all calls happening at present time
      else if (calls[callIndex].time === t) {
        do {
          let call = calls[callIndex];
          let action = handleCall(call); // assign elevator to respond to call
          actions.push(action); // record assignment
          callIndex++;
        } while (callIndex < calls.length && calls[callIndex].time === t);
      }
    } else {
      if (
        // we have no more incomoing calls, check if elevators have unfinished calls
        elevators[0].pendingRequests.length +
          elevators[1].pendingRequests.length +
          elevators[2].pendingRequests.length ===
        0
      ) {
        console.log("all calls have been delivered!");
        allCallsAnswered = true;
      }
    }

    // handle all elevator updates for the given second
    elevators.forEach(function(elevator, shaftIndex) {
      if (elevator.pendingRequests.length > 0) {
        /* if the elevator only has one pending call, don't need to worry about possibility of > 10 passengers 
          or situations we should pick up or drop off people from another pending call in our direction */
        if (elevator.pendingRequests.length === 1) {
          // debugging
          if (
            elevator.currentDirection === 0 &&
            elevator.pendingRequests[0].dropOffTime !== null &&
            t >
              elevator.pendingRequests[0].dropOffTime +
                (elevator.position === 0 ? 30 : 5)
          ) {
            console.log(
              "passengers were not dropped off even though drop off time has been assigned and transition time passed"
            );
            allCallsAnswered = true; // break
          }

          // if the elevator is not currently letting passengers enter or exit, update its position
          const pickupTransition =
            elevator.pendingRequests[0].origin === 0 ? 30 : 5; // takes 30 seconds for passengers to enter or exit shaft on lobby floor, 5 sec otherwise
          const dropoffTransition =
            elevator.pendingRequests[0].destination === 0 ? 30 : 5;
          let currentCall = elevator.pendingRequests[0];
          if (
            // the elevator should move so long as it's not dropping off or picking up passengers
            currentCall.pickUpTime === null ||
            (currentCall.pickUpTime !== null &&
              t - currentCall.pickUpTime > pickupTransition) ||
            (currentCall.dropOffTime !== null &&
              currentCall.dropOffTime < t - dropoffTransition)
          ) {
            if (
              elevator.position + elevator.currentDirection < 0 || // check if we are out of floor bounds
              elevator.position + elevator.currentDirection > 99
            ) {
              console.log("OUT OF BOUNDS elevator shaftIndex " + shaftIndex);
              console.log("time is " + t);
              allCallsAnswered = true; // break
            } else
              elevator.position = elevator.position + elevator.currentDirection;
          }

          if (
            currentCall.pickUpTime === null &&
            elevator.position !== currentCall.origin &&
            elevator.currentDirection !==
              getCallDirection(elevator.position, currentCall.origin)
          ) {
            console.log("ERROR: not going in direction of origin");
            allCallsAnswered = true;
          } else if (
            currentCall.pickUpTime !== null &&
            t < currentCall.pickUpTime + pickupTransition &&
            elevator.currentDirection !==
              getCallDirection(elevator.position, currentCall.destination)
          ) {
            console.log("ERROR: not going towards only destination");
            allCallsAnswered = true;
          }

          // if we arrived at pickup floor, begin transition
          if (
            currentCall.pickUpTime === null &&
            elevator.position === currentCall.origin
          ) {
            elevator.passengers = currentCall.passengers;
            currentCall.pickUpTime = t; // for tracking ride time
            for (var p = 0; p < currentCall.passengers; p++) {
              // wait time for each passeneger was current time minus the time of the call
              let wait = t - currentCall.time + currentCall.miscTime;
              waitTimes.push(wait);
              /* the pick up time needs to be accounted for when we calculate total time spent, and
                  since it's not part of wait time or ride time here, store it */
              transitionTimes.push(pickupTransition);
            }
            // set direction to call
            elevator.currentDirection = getCallDirection(
              currentCall.origin,
              currentCall.destination
            );
          } else {
            // handle arrival at desination or wait for passengers to get off / doors to open
            if (
              currentCall.pickUpTime !== null &&
              elevator.position === currentCall.destination
            ) {
              if (currentCall.dropOffTime === null) {
                currentCall.dropOffTime = t;
                // stop the elevator to drop off passengers
                elevator.direction = 0;
                elevator.currentDirection = 0;
              } else if (t - currentCall.dropOffTime === dropoffTransition) {
                // all passengers are off the shaft
                elevator.passengers =
                  elevator.passengers - currentCall.passengers;
                // record ride times
                for (var r = 0; r < currentCall.passengers; r++) {
                  // ride time for each passeneger is the current time minus the time the ride started
                  rideTimes.push(
                    t - (currentCall.pickUpTime + pickupTransition)
                  );
                }
                // remove pending action from elevator
                elevator.pendingRequests.splice(0, 1);
              }
            }
          }
        } else {
          // handle when an elevator has multiple calls assigned to it
          let pendingCalls = elevator.pendingRequests;

          /* update elevator position. for cases in which elevator is currently still dropping people off or 
            picking people up, the currentDirection is set to zero anyway */
          let nextPosition = elevator.position + elevator.currentDirection;
          if (nextPosition < 0 || nextPosition > 99) {
            console.log(
              "OUT OF BOUNDS due to elevator " + shaftIndex + " at time " + t
            );
            allCallsAnswered = true;
          } else elevator.position = nextPosition;
          // count how many unpicked up calls we are now at the origin of
          var callsFromPosition = pendingCalls.filter(
            call =>
              call.pickUpTime === null &&
              elevator.position === call.origin &&
              getCallDirection(call.origin, call.destination) ===
                elevator.direction
          );
          // // count how many calls we have already picked up that drop off here
          var callsToPosition = pendingCalls.filter(
            call =>
              call.pickUpTime !== null &&
              call.dropOffTime === null &&
              elevator.position === call.destination
          );
          // // count how many calls we already picked up here but are still loading passengers
          var callsLoading = pendingCalls.filter(
            call =>
              call.pickUpTime !== null &&
              elevator.position === call.origin &&
              t <= call.pickUpTime + (call.origin === 0 ? 30 : 5)
          );
          //  count how many calls are already at their destination but are still unloading passengers here
          var callsUnloading = pendingCalls.filter(
            /* if drop off time is not null, we know it's unloading at current floor and it's not done since it isn't deleted */
            call => call.dropOffTime !== null
          );

          /* before anything, drop off passengers with current destination before picking up new ones. this will make room
             for other calls we may have calls to start loading */
          if (callsToPosition.length > 0) {
            elevator.currentDirection = 0;
            pendingCalls.forEach(function(call, requestIndex) {
              if (
                call.pickUpTime !== null &&
                call.destination === elevator.position &&
                call.dropOffTime === null
              ) {
                if (shaftIndex === 0) {
                  console.log(
                    shaftIndex + " made it to destination " + call.destination
                  );
                  if (call.destination === 76) {
                    console.log(
                      "YOOOOOOO! THE DIRECTION CURRENTLY IS " +
                        elevator.currentDirection +
                        " with intended direction " +
                        elevator.direction
                    );
                  }
                }
                elevator.pendingRequests[requestIndex].dropOffTime = t;
              }
            });
          }

          /* pick up passengers who have this origin, and edit pending action to record 
            how many people from that call actually got on the elevator*/
          if (callsFromPosition.length > 0) {
            elevator.currentDirection = 0;
            pendingCalls.forEach(function(call, requestIndex) {
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
                    shaftIndex +
                      "made it to pickup at floor " +
                      elevator.position
                  );

                  if (call.destination === 99 && call.origin === 35) {
                    console.log(elevator);
                    console.log(
                      "time is " + t + " and direction is " + elevator.direction
                    );
                  }
                  if (shaftIndex === 0) {
                    console.log(
                      shaftIndex + " made it to destination " + call.destination
                    );
                    if (elevator.position === 76) {
                      console.log(
                        "YOOOOOOO! THE DIRECTION CURRENTLY IS " +
                          elevator.currentDirection +
                          " with intended direction " +
                          elevator.direction
                      );
                    }
                  }
                  let request = elevator.pendingRequests[requestIndex];
                  request.pickUpTime = t;
                  if (elevator.position === 99 && shaftIndex === 0) {
                    console.log("AT FLOOR 99 FOR FIRST ELEVATOR");
                    allCallsAnswered = true;
                  }
                  let totalPassengers =
                    elevator.passengers + request.passengers;
                  //update amount of passengers being accounted for currently
                  if (totalPassengers > 10) {
                    let passengersWhoDontFit = totalPassengers - 10;
                    console.log(passengersWhoDontFit + " didn't make the cut");
                    let passengersWhoMadeIt =
                      request.passengers - passengersWhoDontFit;
                    request.passengers = passengersWhoMadeIt;
                    request.neglectedPassengers = passengersWhoDontFit;
                    elevator.passengers = 10;
                    for (var n = 0; n < passengersWhoMadeIt; n++) {
                      waitTimes.push(t - request.time + request.miscTime);
                      transitionTimes.push(elevator.position === 0 ? 30 : 5);
                    }
                  } else {
                    elevator.passengers = totalPassengers;
                    for (var m = 0; m < totalPassengers; m++) {
                      waitTimes.push(t - request.time + request.miscTime);
                      transitionTimes.push(elevator.position === 0 ? 30 : 5);
                    }
                  }
                }
              }
            });
          }

          /* handle calls still being loaded - are we done loading? can we set current direction
            and make a call for any neglected passengers? in the same loop, handle calls still being unloaded -
             are we done unloading? can we set current direction and record ride times? */
          if (callsLoading.length + callsUnloading.length > 0) {
            if (shaftIndex === 0) {
              if (elevator.position === 76) {
                console.log(
                  "YOOOOOOO! THE DIRECTION CURRENTLY IS " +
                    elevator.currentDirection +
                    " with intended direction " +
                    elevator.direction +
                    " on floor " +
                    elevator.position
                );
              }
            }
            let callIndicestoUnload = [];
            pendingCalls.forEach(function(call, requestIndex) {
              let transitionTime = elevator.position === 0 ? 30 : 5;
              if (call.pickUpTime !== null && call.dropOffTime === null) {
                if (call.origin === elevator.position) {
                  if (t - call.pickUpTime === transitionTime) {
                    // set elevator back in motion
                    elevator.currentDirection = getCallDirection(
                      call.origin,
                      call.destination
                    );
                    elevator.direction = elevator.currentDirection;
                    // elevator.currentDirection = elevator.direction;

                    if (call.neglectedPassengers > 0) {
                      /* make a call with # leftover passengers, with idential origin, dest, current time, 
                    and account for time they already waited */
                      let action = handleCall({
                        time: t,
                        origin: call.origin,
                        destination: call.destination,
                        passengers: call.neglectedPassengers,
                        pickUpTime: null,
                        dropOffTime: null,
                        neglectedPassengers: 0,
                        miscTime: t - call.time
                      });
                      actions.push(action);
                    }
                  }
                } else {
                  // if we already picked up passengers but aren't going towards their destination, throw error
                  if (
                    elevator.currentDirection !== 0 &&
                    elevator.currentDirection !==
                      getCallDirection(elevator.position, call.destination)
                  ) {
                    elevator.currentDirection = getCallDirection(
                      elevator.position,
                      call.destination
                    );
                    console.log("GOTTEM");
                    allCallsAnswered = true;
                  }
                }
              } else if (call.dropOffTime !== null) {
                if (t - call.dropOffTime === transitionTime) {
                  // passengers from this call have exited
                  elevator.passengers = elevator.passengers - call.passengers;

                  let pickupTransition = call.origin === 0 ? 30 : 5;
                  for (var r = 0; r < call.passengers; r++) {
                    // ride time for each passeneger is the current time minus the time the ride started
                    rideTimes.push(t - (call.pickUpTime + pickupTransition));
                  }
                  callIndicestoUnload.push(requestIndex);
                }
              }
            });
            if (callIndicestoUnload.length > 0) {
              if (callIndicestoUnload.length === 1) {
                elevator.pendingRequests.splice(callIndicestoUnload[0], 1);
              } else {
                callIndicestoUnload.sort();
                for (
                  var removedIndex = 0;
                  removedIndex < callIndicestoUnload.length;
                  removedIndex++
                ) {
                  // we need to account for index shift if we edited the array already
                  elevator.pendingRequests.splice(
                    callIndicestoUnload[0 - removedIndex],
                    1
                  );
                }
              }
            }
            /* if an unload was completed, set elevator direction towards next destination or pickup */
            if (
              callIndicestoUnload.length > 0 &&
              elevator.pendingRequests.length > 0
            )
              if (shaftIndex === 0 && elevator.postiion === 76) {
                console.log(
                  "YOOOOOOO! THE DIRECTION CURRENTLY IS " +
                    elevator.currentDirection +
                    " with call direction " +
                    elevator.direction
                );
              }
            resetElevatorDirection(shaftIndex, pendingCalls);
          }
        }
      }
    });

    // console.log(t);
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

function resetElevatorDirection(shaftIndex, calls) {
  let elevator = elevators[shaftIndex];
  // if elevator has passengers, get them to their destination
  if (elevator.passengers > 0) {
    for (var alreadyTaken = 0; alreadyTaken < calls.length; alreadyTaken++) {
      if (calls[alreadyTaken].pickUpTime !== 0) {
        elevator.currentDirection = getCallDirection(
          elevator.position,
          calls[alreadyTaken].destination
        );
        elevator.direction = getCallDirection(
          calls[alreadyTaken].origin,
          calls[alreadyTaken].destination
        );

        if (shaftIndex === 0 && elevator.postiion === 76) {
          console.log(
            "YOOOOOOO! THE DIRECTION CURRENTLY IS " + elevator.currentDirection
          );
        }
        break;
      }
    }
  } else {
    // otherwise go to next in pending pickup
    elevator.direction = getCallDirection(
      calls[0].origin,
      calls[0].destination
    );
    elevator.currentDirection = getCallDirection(
      elevator.position,
      calls[0].origin
    );
    if (shaftIndex === 0 && elevator.postiion === 76) {
      console.log(
        "YOOOOOOO! THE DIRECTION CURRENTLY IS " + elevator.currentDirection
      );
    }
  }
}

function handleCall(call) {
  let callDir = getCallDirection(call.origin, call.destination);
  let elevatorShaft = null;
  if (store.getState().approach === "random") {
    elevatorShaft = chooseRandomElevator();
  } else elevatorShaft = chooseElevator(call.origin, callDir);

  // update the respective elevator object
  updateElevatorAssignments(elevatorShaft, callDir, call);
  let pos = elevators[0].position;
  console.log(
    "call direction " +
      callDir +
      " for shaft" +
      elevatorShaft +
      "minus 1 on floor " +
      pos +
      " at time " +
      call.time +
      " with destinaton " +
      call.destination +
      " and origin " +
      call.origin
  );
  // return action to update elevator action time series
  return {
    time: call.time,
    shaft: elevatorShaft,
    pickup: call.origin,
    destination: call.destination,
    passengers: call.passengers
  };
}

function getCallDirection(origin, destination) {
  if (origin === destination) return 0;
  if (origin < destination) return 1;
  else return -1;
}

function updateElevatorAssignments(elevatorShaft, callDir, call) {
  console.log("for elevator " + elevatorShaft);
  if (elevatorShaft == null) console.log("null elevator");
  else if (elevatorShaft < 1 || elevatorShaft > 3)
    console.log("elevator num out of bounds");
  else {
    let chosenElevator = elevators[elevatorShaft - 1];
    chosenElevator.pendingRequests.push(call);
    // if elevator wasn't already heading to a call, assign it directions
    if (chosenElevator.pendingRequests.length === 1) {
      elevators[elevatorShaft - 1].currentDirection = getCallDirection(
        chosenElevator.position,
        call.origin
      );

      console.log(
        "elevator shaft " +
          elevatorShaft +
          " minus 1 did change direction for call at origin " +
          call.origin +
          ". now going in current direction " +
          chosenElevator.currentDirection
      );
      /* direction elevator will need to deliver passengers once they are picked up...
  for nonrandom approach we only want it to pick up same direction calls*/
      elevators[elevatorShaft - 1].direction = callDir;
    } else {
      console.log(
        "elevator shaft " +
          elevatorShaft +
          " minus 1 didnt change direction. still going in current direction " +
          chosenElevator.currentDirection
      );
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

const resetElevatorsandActions = () => {
  actions = [];
  callTimeSeries = [];
  waitTimes = [];
  transitionTimes = [];
  rideTimes = [];
  /* direction = 0 means elevator is not answering any calls, 
    direction = 1 means elevator is heading to answer a call where passengers are trying to go up,
    direction = -1 means it is heading to answer a call where passengers are trying to go down.
    currentDirection is the direction it is currently moving. i.e. it could be moving up to pick up a downward call
    positions are 0-99, 0 is Lobby
    passengers = # of passengers elevator is CURRENTLY holding, not number of passengers it will be holding after it fulfills it's next call(s) */
  elevators = [
    {
      direction: 0,
      currentDirection: 0,
      position: 0,
      passengers: 0,
      pendingRequests: []
    },
    {
      direction: 0,
      currentDirection: 0,
      position: 0,
      passengers: 0,
      pendingRequests: []
    },
    {
      direction: 0,
      currentDirection: 0,
      position: 0,
      passengers: 0,
      pendingRequests: []
    }
  ];
};

const Loading = props => {
  setTimeout(() => generateData(props.changeStatus), 100);
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
