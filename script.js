const { io } = require("socket.io-client");

const socket = io("http://localhost:8080");

socket.on("connect", () => {
  console.log("Connected to server");
  setInterval(() => {
    socket.emit("processUrl", { url: "wss://socket0.lichess.org/play/lsHZ978wFqef/v6?sri=2CgEiBIyV9Be&v=0" });
  }, 5000);//   setInterval(() => {
//     socket.emit("processUrl", { url: "wss://socket0.lichess.org/play/G4tNb0ndac4x/v6?sri=NIv0_NUeN1e8&v=0" });
//   }, 5000);

});

let processedData;
socket.on("processedData", (data) => {
    if (JSON.stringify(data) == JSON.stringify(processedData)) {}
    else console.log("best move:", data);
    processedData = data;
});

socket.on("error", (error) => {
  console.error("Error:", error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
