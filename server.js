// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const uuid4 = require("uuid4");
const fs = require("fs");
const requestIp = require("request-ip");
const bodyParser = require("body-parser");
const multer = require("multer");
let database = JSON.parse(fs.readFileSync("database.json", "utf-8"));
let announcement = JSON.parse(fs.readFileSync("announce.json"));
const announcePath = path.join(__dirname, "assets/announce");
const PORT = 3000;
const pwd = process.env.pwd;
console.log(pwd);
app.use(bodyParser.json());
server.listen(PORT, () => {
  console.log(`Server is Running on http://localhost:${PORT}`);
});
app.use(express.static(path.join(__dirname, "./")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  console.log("client IP: " + requestIp.getClientIp(req));
});

app.get("/manage", (req, res) => {
  res.sendFile(__dirname + "/manage.html");
  console.log("client IP: " + requestIp.getClientIp(req));
});
app.get("/initial", (req, res) => {
  res.json(database);
});
app.get("/loadchat", (req, res) => {
  res.json(database);
});
app.get("/getAnnounce", (req, res) => {
  res.json(announcement);
});
app.post("/addchat", (req, res) => {
  database[req.body["title"]] = [];
  fs.writeFileSync("database.json", JSON.stringify(database), "utf-8");
  res.json(database);
});
app.post("/removeChat", (req, res) => {
  let key = req.body["title"];
  delete database[key];

  fs.writeFileSync("database.json", JSON.stringify(database), "utf-8");
  res.json(database);
});
app.post("/removeAnnounce", (req, res) => {
  let key = req.body["i"];
  announcement["new"].splice(key, 1);

  fs.writeFileSync("announce.json", JSON.stringify(announcement), "utf-8");
  res.json(announcement);
});
app.post("/getImage", (req, res) => {
  const filename = req.body.filename;
  const filePath = path.join(announcePath, filename);
  res.sendFile(filePath);
});
app.post("/verify", (req, res) => {
  if (req.body["pwd"] == pwd) {
    res.json({ msg: "200" });
  } else {
    res.json({ msg: "403" });
  }
});
io.on("connection", (socket) => {
  console.log("New User Connected");

  socket.on("chat message", (message) => {
    database[message["channel"]].push(message);

    fs.writeFileSync("database.json", JSON.stringify(database), "utf-8");
    io.emit("chat message", message);
  });
});

//multer
const upload = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "/assets/announce"));
    },
  }),
});

const uploadMiddleware = upload.fields([
  { name: "myFile1" },
  { name: "title1" },
]);

app.post("/newannounce", uploadMiddleware, (req, res) => {
  let obj = {
    id: req.body["title1"],
    src: req.files["myFile1"][0]["filename"],
    des: req.body["des"],
    title: req.body["title"],
  };
  announcement["new"].push(obj);
  fs.writeFileSync("announce.json", JSON.stringify(announcement), "utf-8");
  res.json(announcement);
});

app.use((err, req, res, next) => {
  console.log("error middleware");
  console.log(err.toString());
  res.send(err.toString());
});
