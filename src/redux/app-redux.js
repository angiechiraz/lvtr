import { createStore } from "redux";

const initialState = {
  status: "menu",
  seed: "LVTR"
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "setStatus":
      return { ...state, status: action.value };

    case "setSeed":
      return { ...state, seed: action.value };

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

export { setStatus, setSeed };
