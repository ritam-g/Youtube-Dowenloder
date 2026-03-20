const express = require("express");
const cors = require("cors");
const downloadRouter = require("./routes/download.route");
const path = require('path')

const app = express()

app.use(express.json())
app.use(cors({
    origin: '*' // Allow any deployed frontend (like Vercel) to reach this local server
}))
app.use(express.static("./public"))

app.use('/api', downloadRouter)

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})
module.exports = app
