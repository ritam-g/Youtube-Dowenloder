const { Router } = require("express");
const {
  downloadUrlController,
  downloadVideoController
} = require("../controller/download.controller");

const downloadRouter = Router();

downloadRouter.post("/info", downloadUrlController);
downloadRouter.get("/download", downloadVideoController);

module.exports = downloadRouter;