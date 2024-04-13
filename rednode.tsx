/** @jsx jsx */
/** @jsxFrag Fragment */

import { cors,  jsx } from "https://deno.land/x/hono/middleware.ts";
import { Hono } from "https://deno.land/x/hono/mod.ts";

type Variables = {
	status: Data;
};

const app = new Hono<{ Variables: Variables }>();

app.use(
	"/*",
	cors({
		origin: [
			"localhost:1880/switch/-1.6",
			"localhost:1880/switch/1.6",
			"localhost:1880/switch/2.6",
		],
		allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
		allowMethods: ["POST", "GET", "PUT", "DELETE"],
		maxAge: 600,
	}),
);

// app.post("/switch/:room", async (c)=>{
//   const  target = c.req.param("room")
//   const res = await fetch("http://127.0.0.1:1880/switch/"+target,{
//     method: "POST",
//     body: `toggle` as BodyInit
//   });
//   const data = await res.json();
//   const Room = memo(()=> {
//   return html`
//   <li hx-post="/red/switch/${data.name}" hx-trigger="click" hx-swap="outerHTML"
//       class="w3-section w3-bottombar w3-border-pale-blue
//         ${data.status == 0? "w3-hover-border-red": "w3-hover-border-green"}
//         ${data.time == 0? data.status == 0? "w3-red": "w3-green": "w3-pale-blue"}"
//       id="${data.name}sidebar">
//     <h3  class="w3-right">Щ ${data.name}</h3>
//     <b class="w3-tag w3-margin w3-round-large  w3-cell ${data.status == 0? "w3-red": "w3-green"}">${data.state}</b>
//     <p className="w3-opacity w3-cell w3-container">${data.time == 0? "": data.time}</p>
//   </li>
//       `});
//   // return c.json({msg:{
//   //   payload: 1
//   // }});
//   return c.html(<Room />,200);
// });
//
type Data = {
	name?: string;
	state?: string;
	status?: string | number;
	time?: string | number;
}

function isAnyFieldUndefined(obj: Data): boolean {
	return Object.values(obj).some((value) => value === undefined);
}

app.post("/switch/:room", async (c) => {
	const target = c.req.param("room");

	const { state, status, time } = c.req.query();
	let data: Data = {
		name: target,
		state: state,
		status: status,
		time: time,
	};
	// if (isAnyFieldUndefined(data)) {
	//   const res = await fetch("http://127.0.0.1:1880/status/"+target,{
	//     method: "GET",
	//     headers: {
	//       'Content-Type': 'text/event-stream',
	//       'Cache-Control': 'no-cache',
	//       'Connection': 'keep-alive',
	//       'Access-Control-Allow-Origin': '*',
	//     },
	//   });
	//   data = await res.text();
	// }
	// console.log(data);
	const Room = ({ status, name, state, time }: Data) => {
		return html`
  <div hx-post="/red/switch/${name}" hx-trigger="click" hx-swap="outerHTML" sse-connect="http://127.0.0.1:1880/switch/${target}" sse-swap="outerHTML"
      class="w3-container w3-half w3-section w3-bottombar w3-border-pale-blue
        ${status == 0 ? "w3-hover-border-red" : "w3-hover-border-green"}
        ${time == 0 ? status == 0 ? "w3-red" : "w3-green" : "w3-pale-blue"}"
      id="${name}sidebar">
      <div className="w3-row-padding w3-cell w3-container">
          <p className="w3-half w3-opacity w3-container">${
			time == 0 ? "" : time
		}</p>
          <h3 class="w3-col">Щ ${name}</h3>
          <b class="w3-tag w3-row-padding w3-round-large ${
			status == 0 ? "w3-red" : "w3-green"
		}">${state}</b>
      </div>
  </div>
      `;
	};

	return c.html(<Room {...data} />, 200);
});
export default app;
