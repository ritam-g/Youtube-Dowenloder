const express = require("express");
const cors = require("cors");
const downloadRouter = require("./routes/download.route");
const path = require('path')

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static("./public"))


app.use('/api', downloadRouter)

app.get('*any',(req,res)=>{
    res.sendFile(path.join(__dirname,'..','\\public\\index.html'))
})
module.exports = app