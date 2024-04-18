/** @jsx jsx */
/** @jsxFrag Fragment */

import MeiliSearch, { Health, Index, IndexObject, MeiliSearchCommunicationError, MeiliSearchError, SearchResponse } from "meilisearch";
import {  logger, useEffect, useState  } from "hono/middleware.ts";
import { jsx, FC, createContext,  useContext, Context } from "hono/middleware.ts";
// import { Context } from "hono/context.ts";
import { Variables } from "hono/types.ts";
import { ContextVariableMap, Hono } from "hono/mod.ts";
import { html, inspectRoutes, showRoutes, streamSSE } from "hono/helper.ts";


const master_key = Deno.env.get("MEILI_MASTER_KEY");
const search_client = new MeiliSearch({
	host: "http://127.0.0.1:7700",
	apiKey: master_key,
});
const index = search_client.index("rent");
type HealthStatus = {
	status: string;
}
// let search_health: Context<HealthStatus>;
let search_health: HealthStatus;
let health_changed: boolean = false;
search_health = { status: "unknown" };

async function checkHealth(clent: MeiliSearch) {
	let health = { status: "unknown" };
		try {
			health = await clent.health();
		} catch (err) {
			health = { status: "error" };
		}
		return health;
}



const search = new Hono();

search.use(
	async (c, next) => {
		// INFO: maybe i dont need recheck it on every /search req. everything handled by sse loop
		// const health = await checkHealth(search_client);
		// if (health.status == search_health.status) {
		// 	health_changed = false;
		// }
		// else {
		// 	search_health = health;
		// 	health_changed = true;
		// }
		return await next();
	}
);
search.get("/init", async (c,next) =>{
	if (c.req.header("Hx-Request")) {
		return c.html(`<div hx-ext="sse" sse-connect="/search/status" sse-swap="MeiliStatus" >
		</div>`)
	}
	return await next();
});

search.get("/form",(c,next) =>{
		const enabled = search_health.status == "available";
	// <button type="submit" id="search-button" class="w3-text-light-gray w3-button w3-light-blue w3-opacity m2"
	// hx-indicator="#indicator" data-loading-disable>
	// Go
	// <img id="indicator" class="htmx-indicator" data-loading-class-remove="w3-hide" data-loading
	// src="/static/three-dots.svg" width="40"/>
	// </button>
		return c.html(`
			<form id="search-form"  hx-indicator="#indicator" hx-get="/search" hx-target="#search-result" hx-trigger="submit" hx-swap="innerHTML"
			hx-on::after-request="w3_open()" class="search-bar ${enabled?"":"w3-disabled"}">
				<input  title="search" required type="search" name="q" id="search-input" class="w3-input w3-opacity w3-light-gray w3-rest"
				data-loading-disable placeholder="Search..">
				</input>
			</form>
			`)
});

search.get("/status", (c, next) => {
	// c.header("Cache-Control", "no-cache");
	// c.header("Content-Type", "text/event-stream");
	// c.header("Connection", "keep-alive");
	// return c.body(`data: ${health.status}\nevent: "MeiliStatus"\n\n`);
	// let stream = streamSSE(c,  async (stream) => {
	return streamSSE(c,  async (stream) => {
		let aborted = false;
		// INFO: htmx throws error if id not in the message
		let id = 0;
		stream.onAbort(() => {
				console.log("Aborted");
				aborted = true;
				id = 0;
				stream.close();
			});
		while(!aborted) {

			const health = await checkHealth(search_client);
			const msg = html`<div style="w3-text-red w3-tooltip">◦<span class="w3-text" style="position:absolute;left:0;bottom:0px">Meilisearch service unavailable</span></div>`
			if (health.status == search_health.status) {
				health_changed = false;
			}
			else {
				search_health = health;
				health_changed = true;
			}
			// if (health.status !== "available") {
			if(health_changed || id == 0) {
				await stream.writeSSE({
						event: "MeiliStatus",
						retry: 0,
						id: String(id++),
						data: health.status,
					});
				console.log("sended",health);
			}
			// }
			await stream.sleep(5000);
		}
		stream.close();
	},
	async (err,stream)=> {
		console.log(err);
		const message = `stream error`;
		await stream.writeSSE({
			data: message,
			event: "MeiliStatus",
		});
		stream.close();
	})
	// return stream;
});

// INFO: https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-error-constructor
//
// try {
// search.get("/load", async (c, next) => {
// 	try {
// 		// INFO: auto auth dont need it now
// 		c.set("master_key", master_key);
// 		if (health.status == "unknown" || health.status == "error") {
// 			health = await search_client.health() as Status;
// 			c.set("health", health);
// 			return await next();
// 		}
// 		// TODO: это временное? решение подгружать данные из файла
// 		const decoder = new TextDecoder("utf-8");
// 		const fd = await Deno.readFile("./static/test_data.json");
// 		const str = decoder.decode(fd);
// 		const db = JSON.parse(str);
// 		// TODO:init search index here
// 		//
// 		// console.log(health);
// 		// console.log(health)
// 		// return c.json(c.get("health"))
// 		// return c.redirect("/status");
// 	} catch (e) {
// 		console.error(e.name, "\n", e.message);
// 		// c.error = e
// 		// c.set("health", { status: "error" });
// 		return c.json(c.get("health"))
// 		// return await c.redirect("/search/status",301);
//
// 	}
// });
// search.get("/status", async (c, next) => {
// 	console.log(health);
// 	if (!health) {
// 		// return next()
// 		// return c.redirect("/search/init");
// 		c.set("health", { status: "unknown" });
// 		return c.redirect("/search/init");
// 	} else {
// 		streamSSE(c, async (stream) => {
// 			stream.onAbort(() => {
// 				// console.log("Aborted!");
// 			});
// 			await stream.writeSSE({
// 				data: health.status,
// 				event: "status_search",
// 			});
// 		}, async (err, stream) => {
// 			// stream.writeln("An error occurred!");
// 			console.error(err);
// 		});
// 		return next();
// 		const sse = streamSSE(c, async (stream) => {
// 			const health = c.var.health;
// 			const message = ` ${health.status}`;
// 			await stream.writeSSE({
// 				data: message,
// 				event: "search-status",
// 			});
// 		}, async (e, stream) => {
// 			console.log(e);
// 			await stream.writeSSE({
// 				data: "??",
// 				event: "search-status",
// 			});
// 		});
// 		console.log(sse);
// 		return sse;
// 	}
// });
// const health = c.get("health")
// // if (search_client.health().status === "") {}
// // An index is where the documents are stored.
// // const task = JSON.parse(response);
// const index = await search_client.index("rent");
// c.set("index", index);
// const response = await index.addDocuments(db, { primaryKey: "uid" });
// const status = await search_client.getTask(response.taskUid);

// search.use("*", async (c, next) => {
// 	if (c.req.header("HX-Request")) {
// 		search_query = c.req.query("q") as string;
// 		page = Number(c.req.query("page"));
// 		if (isNaN(page)) {
// 			page = 1;
// 		}
// 	}
// 	if (!index) {
// 		throw new MeiliSearchApiError(
// 			{
// 				code: "400",
// 				link: "",
// 				type: "MeiliSearchError",
// 				message: "Meili Not Ready",
// 			},
// 			100,
// 		);
// 	}
// 	index.updateSearchableAttributes(["id", "desc", "*"]);
// 	// BUG: might be recursive page 1
// 	search_results = await index.search(search_query, {
// 		showRankingScore: true,
// 		hitsPerPage: 80,
// 		page: page,
// 	});
// 	console.log(search_results);
// 	// INFO: result format
//
// 	//   {
// 	//    hits: [
// 	//   ],
// 	//    query
// 	//    processingTimeMs
// 	//    hitsPerPage
// 	//    page
// 	//    totalPages
// 	//    totalHits
// 	//   }
//
// 	let Result = () => html``;
// 	let Header = memo(() => html``);
// 	if (search_results.totalHits === 0) {
// 		Header = memo(() => {
// 			return html` <h3>nothing found</h3> `;
// 		});
// 	} else {
// 		if (page === 1) {
// 			Header = memo(() => {
// 				return html`
//            <div class="w3-container">
//              <h1 class="w3-left-align">${search_results.query}</h1>
//              <p class="w3-right-align">
//                наидено ${search_results.totalHits} шт. за
//                ${search_results.processingTimeMs} мс.
//              </p>
//            </div>
//          `;
// 			});
// 		}
//
// 		// if (search_results.totalPages>1 && page<=search_results.totalPages) {
// 		// result.hits;
// 		Result = () => {
// 			const items = [];
// 			for (const key in search_results.hits) {
// 				const { uid, id, desc: name } = search_results.hits[key];
// 				// INFO: temp rent item schema
// 				//  {
// 				//    uid,
// 				//    id,
// 				//    название,
// 				//  }
// 				//
// 				if (+key === search_results.hitsPerPage - 1) {
// 					items.push(
// 						html` <li
//                                class="w3-hover-yellow w3-card-4 w3-panel"
//                                onclick="/locate/${uid}"
//                                hx-get="/search?q=${search_query}&page=${
// 							search_results.page + 1
// 						} "
//                                hx-trigger="intersect once"
//                                hx-swap="afterend"
//                              >
//                                <header><h3>${name}</h3></header>
//                                <p class="w3-right">${id}</p>
//                          </li>`,
// 					);
// 				} else {
// 					items.push(
// 						html`<li
//                class="w3-hover-yellow w3-card-4 w3-panel"
//                hx-get="/locate/${uid} "
//              >
//                <header><h3>${name}</h3></header>
//                <p class="w3-right">${id}</p>
//              </li>`,
// 					);
// 				}
// 			}
// 			// console.error(search_results);
// 			return html` ${items} `;
// 		};
// 	}
// 	return c.html(
// 		<div>
// 			<Header />
// 			<ul class="w3-ul w3-panel">
// 				<Result />
// 			</ul>
// 		</div>,
// 	);
// });
// } catch (e: any) {
// INFO: meilisearch error format some errors have name in it
//   {
//   "message": "Index `movies` not found.",
//   "code": "index_not_found",
//   "type": "invalid_request",
//   "link": "https://docs.meilisearch.com/errors#index_not_found",
//   "httpStatus: 404
//  }
search.onError((e: Error, c ) => {
	console.error(e);
	// TODO: return errors in separate html object?
	switch (e.constructor) {
		case MeiliSearchCommunicationError:
			return c.json(e.name, 500);
		case MeiliSearchError:
			return c.json(e, 503);
		default:
			return c.json(e, 404);
	}
});

export default search;
