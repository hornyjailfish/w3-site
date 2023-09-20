import { Hono, HonoRequest } from "https://deno.land/x/hono@v3.5.5/mod.ts";
import { html } from "https://deno.land/x/hono@v3.5.5/helper.ts";
import {
  cors,
  logger,
  serveStatic,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";

import search from "./search.tsx";
const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.use("/css/*", serveStatic({ root: "./" }));
app.use("/red/*",cors({
  origin:"localhost:1880",
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE'],
  maxAge: 600,
}));
app.get("/red/temp", async (c) => {
  const res = await fetch("http://127.0.0.1:1880/sensor/temp",{
    method: "GET",
    // body: `{
    //   msg: {
    //     payload: {
    //       target: "test"
    //     },
    //   },
    // }` as BodyInit
    
  })
  return c.html(await res.text(),res.status);
  // return c.json({msg:{
  //   payload: 1
  // }});
});

app.on("POST","/red/state", async (c) => {
  let state = await c.req.json()
  if (state.time !== 0) {
    
  }
  console.log(state);
  // let res = await c.req.body?.getReader().read().then((status)=>{

    // console.log(text);
  
  return c.json({status:"accepted", name: state.name},202)
});
app.post("/red/status/:room", async (c) => {
  // TODO: либо сделать объект { room: target } либо делать это в nodered
  const room = c.req.param("room");
  console.log(room)

  const body = JSON.stringify({

    target: `${room}`,
    msg : "test"
    })
  const res = await fetch("http://127.0.0.1:1880/switch",{
    method: "POST",
    body:  body
  })
  return c.html(await res.text(),res.status);
  // return c.json({msg:{
  //   payload: 1
  // }});
});

app.get("/", serveStatic({ path: "./index.html" }));
app.get("/content", serveStatic({ path: "./static/content.html" }));
app.get("/left", serveStatic({ path: "./static/leftbar.html" }));
// app.post("/right", serveStatic({ path: "./static/rightbar.html" }));
// serveStatic({ path: "./static/rightbar.html" });
app.route("/search", search);

app.use("*", logger());
app.showRoutes();
app.onError((e,c)=>{
  
  console.error(e); 
  // app.get("*", serveStatic({ path: "./static/404.html" }));
  return c.html(`<div class=" w3-card-4 w3-red w3-opacity"><h1>${e}</h1></div>`,400);
});

Deno.serve(app.fetch);
