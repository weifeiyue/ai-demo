const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const file = Bun.file(`.${path}`);
    console.log(`Request for ${path}, checking file: ${await file.exists()}`);
    if (await file.exists()) {
      return new Response(file);
    }

    // 其他路由
    if (path === "/") {
      return new Response(await Bun.file("./index.html").text(), {
        headers: { "Content-Type": "text/html" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
})

console.log(`Server running at ${server.url}`);