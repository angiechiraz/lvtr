import React from "react";
import elevator from "../../assets/elevator.png";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";
import { store, setApproach } from "../../redux/app-redux";

const Menu = props => {
  return (
    <div>
      <img src={elevator} className="elevator" alt="logo" />
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

export default Menu;
