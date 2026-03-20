const express = require("express");
const cors = require("cors");
const downloadRouter = require("./routes/download.route");
const path = require('path')

const app = express()

app.use(express.json())
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5274",
        "http://localhost:3000",
        "https://tubeflow-downloader.onrender.com",
        "http://localhost"
    ]
}))
app.use(express.static("./public"))

app.use('/api', downloadRouter)

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})
module.exports = app
