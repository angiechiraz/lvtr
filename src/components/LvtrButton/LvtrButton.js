import React from "react";
import "./button.css";
import "../../App.css";

const LvtrButton = props => {
  return (
    <button className="button" onClick={props.handleClick}>
      <code style={{ color: "white" }}>{props.label}</code>
    </button>
  );
};

export default LvtrButton;
