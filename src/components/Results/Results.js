import React from "react";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store, setApproach } from "../../redux/app-redux";

const Results = props => {
  let waitTimeText =
    store.getState().avgWait > 60
      ? Math.floor(store.getState().avgWait / 60) +
        " min " +
        (store.getState().avgWait.toFixed(0) % 60) +
        " sec"
      : (store.getState().avgWait.toFixed(0) % 60) + " sec";

  let rideTimeText =
    store.getState().avgRide > 60
      ? Math.floor(store.getState().avgRide / 60) +
        " min " +
        (store.getState().avgRide.toFixed(0) % 60) +
        " sec"
      : (store.getState().avgRide.toFixed(0) % 60) + " sec";

  let totalTimeText =
    store.getState().avgTotal > 60
      ? Math.floor(store.getState().avgTotal / 60) +
        " min " +
        (store.getState().avgTotal.toFixed(0) % 60) +
        " sec"
      : (store.getState().avgTotal.toFixed(0) % 60) + " sec";

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
