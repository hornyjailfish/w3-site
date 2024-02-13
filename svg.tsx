/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono } from "https://deno.land/x/hono@v3.5.5/mod.ts";

const content = new Hono();
content.get("/*", async (c) => {
    // const parser = new DOMParser();
    // const url = new URL(c.req.url);
    // const root = url.protocol + "//" + url.host;
    // const wallsData = await d3.svg(root + "/public/walls.svg");
    // const outsideData = await d3.svg(root + "/public/outside.svg");
    // const outlinesData = await d3.svg(root + "/public/shops.svg");
    {/* <div name="mapRoot" width="100%" height = "100%" transformOrigin="center"> */}
    {/* </div> */}

    const SVG = `
        <script src="/public/map.js" type=module></script>
`;

    return c.html(SVG);
});

export default content;
