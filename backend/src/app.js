const express = require("express");
const cors = require("cors");
const downloadRouter = require("./routes/download.route");

const app = express()

app.use(express.json())
app.use(cors())



app.use('/api', downloadRouter)

module.exports = app