import { Hono } from "hono/mod.ts";
import { logger, serveStatic } from "hono/middleware.ts";
import { inspectRoutes, showRoutes } from "hono/helper.ts";
import { DISCONNECT, MqttClient, Protocol } from 'https://raw.githubusercontent.com/skymethod/denoflare/denoflare-mqtt-v0.0.2/common/mqtt/mod_deno.ts';

import search from "./search.tsx";
import nodered from "./rednode.tsx";

import mqtt_client from 'https://esm.sh/u8-mqtt/esm/deno/index.js'
import { warn } from "https://cdn.skypack.dev/-/geotiff@v2.1.3-XiUuyJgTAAAacz3e80uR/dist=es2019,mode=types/dist-node/logging.js";

const hostname = '192.168.1.111';
const port = 1883;

let my_mqtt = mqtt_client()
  .with_tcp(port, hostname)
  .with_autoreconnect()

await my_mqtt.connect()

const topic = "/devices/wb-mr6cu_97/controls/+/meta";

my_mqtt.subscribe_topic(
  topic,
  (pkt, params, ctx) => {
		let payload = pkt.payload;
		if (payload) {
			const bufer = new TextDecoder().decode(payload);
			console.log(pkt.topic, bufer);
		}
  })

// await my_mqtt.json_send(
//   'u8-mqtt/demo-simple/live',
//   { note: 'from Deno example',
//     live: new Date().toISOString() })
//


const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.use("/public/*", serveStatic({ root: "./" }));
app.use("/css/*", serveStatic({ root: "./" }));

// app.route("/red", nodered);
app.route("/search", search);
// app.route("/svg", content);

app.get("/", serveStatic({ path: "./index.html" }));
// app.get("/content", serveStatic({ path: "./static/walls.svg" }));

app.get("/topbar", serveStatic({ path: "./static/header.html" }));
// app.get("/left", serveStatic({ path: "./static/leftbar.html" }));
app.get("/left", async (c,next) =>{
	return c.html("")
});
// app.post("/right", serveStatic({ path: "./static/rightbar.html" }));
// serveStatic({ path: "./static/rightbar.html" });

app.onError((e, c) => {
	console.error(e);
	// app.get("*", serveStatic({ path: "./static/404.html" }));
	return c.html(
		`<div hx-target="this" class="w3-center w3-card-4 w3-red"><h1>${e}</h1></div>`,
		400,
	);
});

showRoutes(app);
inspectRoutes(app);
app.all(logger());
Deno.serve({ port: 3000 }, app.fetch);
