const { Router } = require("express");
const { processVideoController } = require("../controller/download.controller");

const downloadRouter = Router();

downloadRouter.post("/video", processVideoController);

module.exports = downloadRouter;