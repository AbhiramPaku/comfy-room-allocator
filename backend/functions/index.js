const functions = require("firebase-functions");
const express = require("express");

const rooms = require("../rooms");
const students = require("../students");

const app = express();

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/rooms", (req, res) => {
  res.json(rooms.getRooms());
});

app.get("/students", (req, res) => {
  res.json(students.getStudents());
});

exports.api = functions.https.onRequest(app);