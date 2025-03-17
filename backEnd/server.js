const express = require('express')
const mysql = require('mysql')
const cors = require('cors')

const app = express()
app.use(cors())

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "conso_app"
})

app.get('/', (re, res) => {
    return res.json("Backend side")
})

app.get('/users', (re, res) => {
    const sql = "SELET * FROM users";
    db.query(sql, (err, data)=> {
        if(err) return res.json(err);
        return res.json 
    })
})

app.listen(8081, ()=>{
    console.log("listening")
})