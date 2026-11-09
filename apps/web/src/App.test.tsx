import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders the preview heading", () => {
  expect(renderToStaticMarkup(<App />)).toContain("<h1>BunkBuddy</h1>");
});
