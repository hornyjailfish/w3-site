import { Hono, HonoRequest } from "https://deno.land/x/hono@v3.5.5/mod.ts";
import { html } from "https://deno.land/x/hono@v3.5.5/helper.ts";
import {
  cors,
  Fragment,
  logger,
  serveStatic,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";


// // @deno-types="npm:@types/svgdom"
// import { createSVGWindow } from "https://esm.sh/svgdom";

import search from "./search.tsx";
import nodered from "./rednode.tsx"; 
import content from "./svg.tsx";
// declare global {
//   interface Window {
//     var DOMParser: typeof DOMParser;
//   }
// };
// const window = createSVGWindow();
// const document = window.document;


 
const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.use("/public/*", serveStatic({ root: "./" }));
app.use("/css/*", serveStatic({ root: "./" }));

app.route("/red", nodered);
app.route("/search", search);
app.route("/content", content);

app.get("/", serveStatic({ path: "./index.html" }));
// app.get("/content", serveStatic({ path: "./static/walls.svg" }));

app.get("/left", serveStatic({ path: "./static/leftbar.html" }));
// app.post("/right", serveStatic({ path: "./static/rightbar.html" }));
// serveStatic({ path: "./static/rightbar.html" });

app.use("*", logger());
app.showRoutes();
app.onError((e, c) => {
  console.error(e);
  // app.get("*", serveStatic({ path: "./static/404.html" }));
  return c.html(
    `<div class="w3-center w3-card-4 w3-red w3-opacity"><h1>${e}</h1></div>`,
    400,
  );
});

Deno.serve(app.fetch);
