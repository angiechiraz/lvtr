import { createStore, bindActionCreators } from "redux";

const initialState = {
  status: "menu",
  seed: "LVTR",
  avgWait: 0,
  avgRide: 0,
  avgTotal: 0,
  approach: "custom"
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "setStatus":
      return { ...state, status: action.value };

    case "setSeed":
      return { ...state, seed: action.value };

    case "setAvgWait":
      return { ...state, avgWait: action.value };

    case "setAvgRide":
      return { ...state, avgRide: action.value };

    case "setAvgTotal":
      return { ...state, avgTotal: action.value };

    case "setApproach":
      return { ...state, approach: action.value };

    default:
      return state;
  }
};

const store = createStore(reducer);
export { store };

const setStatus = status => {
  return {
    type: "setStatus",
    value: status
  };
};

const setSeed = seed => {
  return {
    type: "setSeed",
    value: seed
  };
};

const setAvgWait = avgWait => {
  return {
    type: "setAvgWait",
    value: avgWait
  };
};

const setAvgRide = avgRide => {
  return {
    type: "setAvgRide",
    value: avgRide
  };
};

const setAvgTotal = avgTotal => {
  return {
    type: "setAvgTotal",
    value: avgTotal
  };
};

const setApproach = approach => {
  return {
    type: "setApproach",
    value: approach
  };
};

export { setStatus, setSeed, setAvgWait, setAvgRide, setAvgTotal, setApproach };
