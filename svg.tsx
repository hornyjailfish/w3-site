/** @jsx jsx */
/** @jsxFrag Fragment */

import { html, jsx, memo } from "https://deno.land/x/hono@v3.5.5/middleware.ts";
import { Context, Hono } from "https://deno.land/x/hono@v3.5.5/mod.ts";

// // @deno-types="npm:@types/d3"
import * as d3 from "https://esm.sh/d3@7.8.5";
// // @deno-types="npm:@types/linkedom"
import { DOMParser, parseHTML } from "https://esm.sh/linkedom";

(globalThis as any).DOMParser = DOMParser;
const content = new Hono();
content.get("/*", async (c) => {
  const parser = new DOMParser();

  const wallsData = await d3.svg("http://localhost:8000/public/walls.svg");
  const outsideData = await d3.svg("http://localhost:8000/public/outside.svg");
  const outlinesData = await d3.svg("http://localhost:8000/public/outlines.svg");

  const SVG = `
        <svg name="mapRoot" width="100%" height = "100%" transformOrigin="center">
        ${outsideData}
        ${wallsData}
        ${outlinesData}
        </svg>
`;
    console.log(SVG);
  // Append the SVG element to the document body or any other container element

  return c.html(SVG);
});

export default content;
