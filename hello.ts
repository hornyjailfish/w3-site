import { Hono } from "https://deno.land/x/hono@v3.5.5/mod.ts";
import { html } from "https://deno.land/x/hono@v3.5.5/helper.ts";
import {
  logger,
  serveStatic,
} from "https://deno.land/x/hono@v3.5.5/middleware.ts";

const app = new Hono();

app.use("*", logger());
app.use("/static/*", serveStatic({ root: "./" }));

app.get("/", serveStatic({ path: "./index.html" }));
app.get("/content", serveStatic({ path: "./static/content.html" }));
app.get("/left", serveStatic({ path: "./static/leftbar.html" }));
app.post("/right", serveStatic({ path: "./static/rightbar.html" }));
app.post("/search", (c) => {
  if (c.req.header("HX-Request")) {
    const input = c.req.queries("q");
    return c.text(input?.values(), 300);
  }
  return c.text("not found", 404);
  // logger(input);
});
app.showRoutes();
app.get("*", serveStatic({ path: "./static/404.html" }));
Deno.serve(app.fetch);
