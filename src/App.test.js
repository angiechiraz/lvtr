// import React from "react";
// import { render } from "@testing-library/react";
// import App from "./App";

// test('renders learn react link', () => {
//   const { getByText } = render(<App />);
//   const linkElement = getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

import { store } from "./redux/app-redux";

const assert = require("assert");
const unirand = require("unirand");
unirand.seed(store.getState().seed);

it("should return true", () => {
  assert.equal(true, true);
});

it("first random number from PRNG is the same with seed", () => {
  const first = unirand.random();
  const second = unirand.random();
  assert.equal(first, second);
});

it("next random number generator is different from first", () => {
  const first = unirand.random();
  const second = unirand.next();
  assert.notEqual(first, second);
});
