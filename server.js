#!/usr/bin/env node

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws'); 
const stockfish = require("stockfish");
const { resolve } = require('path');

const app = express()
const port = 8080;
const engine = stockfish();
const server = http.createServer(app); 
const io = new Server(server);

// const fenregex = "/^([rnbqkpRNBQKP1-8]+\/){7}([rnbqkpRNBQKP1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s(0|[1-9][0-9]*)\s([1-9][0-9]*)/"
const fenregex = /^([rnbqkpRNBQKP1-8]{1,8}\/){7}[rnbqkpRNBQKP1-8]{1,8}$/;

engine.onmessage = function(msg) {
  console.log(msg);
};

engine.postMessage("uci");

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/', (request, response) => {
  const body = request.body;
  const fenString = body.d.fen;
  if (!fenString) {
    return;
  }
  if (body.t != 'move') {
    response.send('');
    return;
  } else if (!fenString1.match(fenregex)) {
    response.send("Invalid fen string");
    return;
  }
  getBestMove(fenString, response);

});

const getBestMove = async (fenString) => {
  return new Promise((resolve, reject) => {
    engine.postMessage("ucinewgame");
    engine.postMessage("position fen " + fenString);
    engine.postMessage("go depth 18");
  
    console.log(fenString);
  
    engine.onmessage = (msg) => {
      if (typeof(msg == "string") && msg.match("bestmove")) {
        const newMsg = msg.split(" ");
        const move = {};
        for (let i=0; i<newMsg.length; i += 2) {
          move[newMsg[i]] = newMsg[i+1]
        };
        resolve(move);
      }
    }
  })
}

const bestMoveWrapper = async (msg) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('====msg', msg);

      if (msg.t == 'endData') {
        reject(new Error('EndData'));
      }
      
      else if (msg.t == 'crowd') {
        const crowd = {};
        if (Boolean(msg.d.white) && !Boolean(msg.d.black)) {crowd.white = true; crowd.black = false;}
        else {crowd.white = false; crowd.black = true;}
        resolve(crowd);
      }

      else if (!msg.d || !msg.d.fen) {
        return reject(new Error("Missing FEN string in message"));
      }

      const fenString = msg.d.fen;

      if (msg.t !== 'move') {
        return reject(new Error("Invalid message type"));
      }

      if (!fenString.match(fenregex)) {
        return reject(new Error("Invalid FEN string format"));
      }

      const gbm = await getBestMove(fenString);
      resolve(gbm);

    } catch (error) {
      reject(error);
    }
  });
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on("processUrl", async ({url}) => {
    console.log('Processing URL:', url);
    const externalSocket = new WebSocket(url);
    let blackLocal, whiteLocal;

    externalSocket.on('message', async (msg) => {
      try {
        const parsedMessage = JSON.parse(msg.toString());
      
        if (parsedMessage.t == 'crowd') {
          const { black, white } = await bestMoveWrapper(parsedMessage);
          blackLocal = black;
          whiteLocal = white;
          return;
        }

        const bestMove = await bestMoveWrapper(parsedMessage);
        console.log("Best move:", bestMove);

        socket.emit('processedData', {
          // bestmove: bestMove?.bestmove || null,
          bestmove: bestMove?.ponder || null
        });
        
      } catch (error) {
        if (error.message === 'EndData') { return };
        console.error("Error in bestMoveWrapper:", error.message, JSON.parse(msg.toString()));
        socket.emit('error', { message: "Failed to process best move", error: error.message });
      }
    });


    externalSocket.on('error', (error) => {
      console.error('Error connecting to external URL:', error);
      socket.emit('error', { message: 'Failed to connect to external URL', error });
    });

    externalSocket.on('close', () => {
      console.log('Connection to external WebSocket closed');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (externalSocket.readyState === WebSocket.OPEN) {
        externalSocket.close();
      }
    });
  })
})


// app.get('/session/:socketUrl', (req, res) => {
//   const socketUrl  = req.params.socketUrl;
//   let socketConnection;
//   try {
//     socketConnection = new WebSocket(socketUrl);
//   } catch (err) {
//     res.send('Invalid socket url', err);
//   }

//   socketConnection.onopen(() => {
//     res.send('Socket connection established');
//   })

//   socketConnection.onmessage((msg) => {
//     fetch('http://localhost:8080', {})
//   })



// })

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
});



// (async () => {
//   const bestmove = await getBestMove('rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R');
//   console.log('====bestmove',bestmove);
// })();