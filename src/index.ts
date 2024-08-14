import { init } from "./app/index.js";

async function initialize() {
  const app = await init();
  app.listen(4000, () => {
    console.log("Server is Running at Port:4000 ");
  });
}

initialize();
