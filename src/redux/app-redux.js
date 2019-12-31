import { createStore } from "redux";

const initialState = {
  status: "menu"
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "setStatus":
      return { ...state, status: action.value };

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

export { setStatus };
