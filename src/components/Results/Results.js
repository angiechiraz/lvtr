import React from "react";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store, setApproach } from "../../redux/app-redux";

function formatTime(num) {
  return num > 60
    ? Math.floor(num / 60) + " min " + (num.toFixed(0) % 60) + " sec"
    : (num.toFixed(0) % 60) + " sec";
}

const Results = props => {
  let waitTimeText = formatTime(store.getState().avgWait);
  let rideTimeText = formatTime(store.getState().avgRide);
  let totalTimeText = formatTime(store.getState().avgTotal);
  return (
    <div>
      <p>
        Avg wait time:
        <span> {waitTimeText}</span>
      </p>
      <p>
        Avg ride time: <span> {rideTimeText}</span>
      </p>
      <p>
        Avg total time: <span> {totalTimeText}</span>
      </p>
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

export default Results;
