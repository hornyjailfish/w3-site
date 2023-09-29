import { Hono, HonoRequest } from "https://deno.land/x/hono@v3.5.5/mod.ts";
import { html } from "https://deno.land/x/hono@v3.5.5/helper.ts";
import {
  cors,
  logger,
  serveStatic,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";

import search from "./search.tsx";
import nodered from "./rednode.tsx";
const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.use("/css/*", serveStatic({ root: "./" }));

// app.get("/red/status/*", async (c) => {
  // let state = await c.req.text()
  // if (state.time !== 0) {
  //
    // console.log(state);
  // }
  // let res = await c.req.body?.getReader().read().then((status)=>{

    // console.log(text);
  
  // return c.json({status:"accepted", name: state.name},202)
// });




// app.post("/red/switch/:room", async (c) => {
//   // TODO: либо сделать объект { room: target } либо делать это в nodered
//   let msg = "test";
//   if (c.req.method === "POST") {
//     msg = "toggle"
//   }
//   const room = c.req.param("room");
//
//   const body = JSON.stringify({
//     target: `${room}`,
//     msg : `${msg}`
//     })
//
//   const res = await app.request("http://127.0.0.1:1880/switch",{
//     method: "POST",
//     body:  body
//   })
//   return c.html(await res.text(),res.status);
//   // return c.json({msg:{
//   //   payload: 1
//   // }});
// });
app.route("/red", nodered);
app.route("/search", search);

app.get("/", serveStatic({ path: "./index.html" }));
app.get("/content", serveStatic({ path: "./static/content.html" }));
app.get("/left", serveStatic({ path: "./static/leftbar.html" }));
// app.post("/right", serveStatic({ path: "./static/rightbar.html" }));
// serveStatic({ path: "./static/rightbar.html" });

app.use("*", logger());
app.showRoutes();
app.onError((e,c)=>{
  
  console.error(e); 
  // app.get("*", serveStatic({ path: "./static/404.html" }));
  return c.html(`<div class=" w3-card-4 w3-red w3-opacity"><h1>${e}</h1></div>`,400);
});

Deno.serve(app.fetch);
