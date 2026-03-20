const { Router } = require("express");
const { processVideoController, downloadVideoController } = require("../controller/download.controller");

const downloadRouter = Router();

downloadRouter.post("/video", processVideoController);
downloadRouter.get("/download", downloadVideoController);

module.exports = downloadRouter;