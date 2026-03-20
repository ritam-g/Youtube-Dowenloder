const express = require("express");
const cors = require("cors");
const downloadRouter = require("./routes/download.route");
const path = require('path')

const app = express()

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});
app.use(cors({
    origin: ["https://youtube-dowenloder.vercel.app", "http://localhost:5173","https://tubeflow-backend.onrender.com"],
    credentials: true
}))
app.use(express.static("./public"))

app.use('/api', downloadRouter)

app.get('*any', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})
module.exports = app
