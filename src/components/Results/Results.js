import React from "react";
import "../../App.css";
import LvtrButton from "../LvtrButton/LvtrButton";

// create elevator objects
var bank1 = [{ moving: false }, { direction: null }, { position: "0" }];
var bank2 = [{ moving: false }, { direction: null }, { position: "0" }];
var bank3 = [{ moving: false }, { direction: null }, { position: "0" }];

// create function to take calls as input and output elevator actions
// calls are objects {time: ___, origin: __, destination: __}
function generateActions(calls) {
  // declare elevator action time series
  // should contain objects {time: ____, bank: ____, destination: ____}
  var actions = [];

  for (var index = 0; index < calls.length; index++) {}
}

const Results = props => {
  return (
    <div>
      {/* <div style={{ flexDirection: "column", }}> */}
      <p>Avg wait time:</p>
      <p>Avg ride time:</p>
      <p>Avg total time:</p>
      {/* </div> */}
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

export default Results;
