/** @jsx jsx */
/** @jsxFrag Fragment */

import { MeiliSearch } from "https://esm.sh/meilisearch";

import {
  html,
  jsx,
  memo,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";
import { Hono } from "https://deno.land/x/hono@v3.5.5/mod.ts";
import { MeiliSearchError } from "https://esm.sh/meilisearch@0.34.2";
import { MeiliSearchApiError } from "https://esm.sh/meilisearch@0.34.2";
import { Context } from "https://deno.land/x/hono@v3.5.5/mod.ts";


const search = new Hono();

let index: any;
let search_query = "" ;
let search_results: any ;
let page = 1 ;

try {
  const master_key = Deno.env.get("MEILI_MASTER_KEY");
  const search_client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: master_key,
  });

  // TODO: это временное решение подгружать данные из файла
  const decoder = new TextDecoder("utf-8");
  const fd = await Deno.readFile("./static/test_data.json");
  const str = decoder.decode(fd);
  const db = JSON.parse(str);
  
  if (!search_client) {
    // search.fire();
    throw new MeiliSearchError("Can't create search client",503)
}
  const health = await search_client.health();
  if (!health){
    throw new MeiliSearchApiError("MeiliSearch not available right now!",100);
  }
  // if (search_client.health().status === "") {}
  // An index is where the documents are stored.
  // const task = JSON.parse(response);
    index = await search_client.index("rent");
    const response = await index.addDocuments(db, { primaryKey: "uid" });
    const status = await search_client.getTask(response.taskUid);
  // const e = error;
  // search.all("*",async (_,next)=> {await next()})
  search.use("*", async (c,next) => {
      if (c.req.header("HX-Request")) {
        search_query = c.req.query("q") as string;
        page = Number(c.req.query("page"));
        if (isNaN(page)) {
          page = 1;
        }
      }
    if (!index) {
      throw new MeiliSearchApiError();
    }
// BUG: might be recursive page 1 
    search_results = await index.search(search_query,{hitsPerPage:80, page : page});

  // INFO: result format

  //   {
  //    hits: [
  //   ],
  //    query
  //    processingTimeMs
  //    hitsPerPage
  //    page
  //    totalPages
  //    totalHits 
  //   }

      let Result = ()=>html``;
      let Header = memo(()=>html``);
      if (search_results.totalHits === 0 ) {
        Header = memo(() => {
          return (html`
            <h3> nothing found</h3>
          `);
        });
      } 
      else {
        if (page===1) {
          Header = memo(() => {
            return (html`
                    <div class="w3-container">
                      <h1 class="w3-left-align">${search_results.query}</h1> 
                      <p class="w3-right-align">наидено ${search_results.totalHits} шт. за ${search_results.processingTimeMs} мс.</p>
                    </div>
            `)
          });
        }

        // if (search_results.totalPages>1 && page<=search_results.totalPages) {
          // result.hits;
          Result = () => {
            const items = [];
            for (const key in search_results.hits) {
                const { uid,id,название:name} = search_results.hits[key];
                // INFO: temp rent item schema 
                //  {
                //    uid,
                //    id,
                //    название,
                //  }
                //
                if (+key === search_results.hitsPerPage-1) {
                  items.push(
                    html`
                      <li class="w3-hover-yellow w3-card-4 w3-panel"  
                      onclick="/locate/${uid}"  
                      hx-get="/search?q=${search_query}&page=${search_results.page+1} " 
                      hx-trigger="intersect once"
                      hx-swap="afterend">
                      <header><h3>${name}</h3></header>
                      <p class="w3-right">${id}</p>
                    </li>`);
                }
                else {
                  items.push(
                    html`<li class="w3-hover-yellow w3-card-4 w3-panel"  
                      hx-get="/locate/${uid} ">
                      <header><h3>${name}</h3></header>
                      <p class="w3-right">${id}</p>
                    </li>`)
                }
              }
              console.error(search_results)
            return (html`
                ${items}
                `);
          };
      }
      return c.html(
      <div>
        <Header/>
        <ul class="w3-ul w3-panel">
          <Result />
        </ul>
      </div>
      );
    
  });

}
catch(e: any){
  // INFO: meilisearch error format some errors have name in it
  //   {
  //   "message": "Index `movies` not found.",
  //   "code": "index_not_found",
  //   "type": "invalid_request",
  //   "link": "https://docs.meilisearch.com/errors#index_not_found",
  //   "httpStatus: 404
  //  }
  search.onError((e: any,c: Context)=>{
    console.error(e);
    switch (e.constructor) {
      case MeiliSearchError:
        return c.json(e,503);
      case MeiliSearchApiError:
        return c.json(e,e.httpStatus);
      default:
        return c.json(e,500);
    }
  })
}
finally {
search.onError((e: any,c: Context)=>{
      console.error(e);
      return c.text(e.message,404)
});
}
export default search;


