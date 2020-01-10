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
          label={"Random assignment"}
          handleClick={() => props.startSim()}
        />
        <LvtrButton label={"Custom assignment"} />
      </div>
    </div>
  );
};

export default Menu;
