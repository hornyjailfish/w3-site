/** @jsx jsx */
/** @jsxFrag Fragment */

import { MeiliSearch } from "https://esm.sh/meilisearch";

import {
  Fragment,
  html,
  jsx,
  memo,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";
import { Hono } from "https://deno.land/x/hono@v3.5.5/mod.ts";

// INFO: just string trim util function

// function trim(str: string, ch: string): string {
//   let start = 0,
//     end = str.length;
//   while (start < end && str[start] === ch) {
//     ++start;
//   }
//   while (end > start && str[end - 1] === ch) {
//     --end;
//   }
//   return (start > 0 || end < str.length) ? str.substring(start, end) : str;
// }

// TODO: это временное решение подгружать данные из файла
const decoder = new TextDecoder("utf-8");
const fd = await Deno.readFile("./test_data.json");
const str = decoder.decode(fd);
const db = JSON.parse(str);

const master_key = Deno.env.get("MEILI_MASTER_KEY");
const search_client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: master_key,
});

// An index is where the documents are stored.
const index = search_client.index("rent");
let response = await index.addDocuments(db, { primaryKey: "uid" });

// const task = JSON.parse(response);
const status = await search_client.getTask(response.taskUid);

let search_query = "";
const search = new Hono();
search.get("*", async (c, next) => {
  if (c.req.header("HX-Request")) {
    search_query = c.req.query("q") as string;
    console.log(search_query);
  }
  console.log(status);

  const result = await index.search(search_query);
  console.log(result);
  let Result;
  if (result.estimatedTotalHits === 0) {
    Result = () => {
      return (html`
  <h4 >nothing found</h4>
`);
    };
  } else {
    if (result.estimatedTotalHits > result.limit) {
      // TODO: add pagination or infinite loading whatever
      const page_count = Math.ceil(result.estimatedTotalHits / result.limit);
      console.log(page_count, " pages");
    }
    // TODO: add array of results to html

    // result.hits;
    Result = () => {
      return (html`
  <li class="w3-hover-yellow w3-card-4">
    <h3>${search_query}</h3>
  </li>`);
    };
  }
  // <div
  //   class="w3-container w3-animate-right w3-rest w3-light-blue w3-sidebar w3-border-left "
  //   id="right-sidebar"
  //   style="right:0"
  // >
  // </div>,
  // <div class="w3-margin-top  w3-green w3-card w3-border-gray " // id=""
  //   // style="right:0"
  // >

  return c.html(
    <ul class="w3-ul w3-panel">
      <Result />
    </ul>,
  );
});
export default search;
