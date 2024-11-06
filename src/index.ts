import { setupApplication } from "./server";
import config from "./config/config";

import { init as initializeMongoDB } from "./config/mongodb";

(async function () {
  initializeMongoDB();
  const result = await setupApplication().catch(console.error);

  if (result) {
    const { httpServer } = result;
    httpServer.listen(config.app.port, () => {
      console.log(`Server is running on port ${config.app.port}`);
    });
  } else {
    console.error("Failed to setup application");
  }
})();
