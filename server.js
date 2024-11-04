#!/usr/bin/env node

const express = require('express')
const app = express()
const port = 8080
const stockfish = require("stockfish");
const engine = stockfish();
// const fenregex = "/^([rnbqkpRNBQKP1-8]+\/){7}([rnbqkpRNBQKP1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s(0|[1-9][0-9]*)\s([1-9][0-9]*)/"
const fenregex = /^([rnbqkpRNBQKP1-8]{1,8}\/){7}[rnbqkpRNBQKP1-8]{1,8}$/;

engine.onmessage = function(msg) {
  console.log(msg);
};

engine.postMessage("uci");

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/', (request, response) => {
  console.log(request.body.fen)

  if (!request.body.fen.match(fenregex)) {
    response.send("Invalid fen string");
    return;
  }
  
// if chess engine replies
  engine.onmessage = function(msg) {

    if (response.headersSent) {
        return;
    }
    if (typeof(msg == "string") && msg.match("bestmove")) {
      const newMsg = msg.split(" ");
      const move = {};
        for (let i=0; i<newMsg.length; i += 2) {
          move[newMsg[i]] = newMsg[i+1]
        }
        response.send(move);
    }
  }

  engine.postMessage("ucinewgame");
  engine.postMessage("position fen " + request.body.fen);
  engine.postMessage("go depth 18");
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})