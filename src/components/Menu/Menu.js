import React from "react";
import elevator from "../../assets/elevator.png";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";

const Menu = props => {
  return (
    <div>
      <img src={elevator} className="elevator" alt="logo" />
      <div className="row">
        <LvtrButton
          label={"Start simulation 1"}
          handleClick={() => props.startSim()}
        />
        <LvtrButton label={"Start simulation 2"} />
      </div>
    </div>
  );
};

export default Menu;
