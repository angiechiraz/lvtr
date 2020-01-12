import React from "react";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store, setApproach } from "../../redux/app-redux";

const Results = props => {
  return (
    <div>
      <p>
        Avg wait time:<span> {store.getState().avgWait} sec</span>
      </p>
      <p>
        Avg ride time: <span> {store.getState().avgRide} sec</span>
      </p>
      <p>
        Avg total time: <span> {store.getState().avgTotal} sec</span>
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
