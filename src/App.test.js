import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

// test('renders learn react link', () => {
//   const { getByText } = render(<App />);
//   const linkElement = getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });
const assert = require("assert");
const unirand = require("unirand");

it("should return true", () => {
  assert.equal(true, true);
});

it("seed with random number generator", () => {
  unirand.seed("lvtr");
  const first = unirand.random();
  const second = unirand.random();
  assert.equal(first, second);
});
