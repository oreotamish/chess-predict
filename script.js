const { io } = require("socket.io-client");

const socket = io("http://localhost:8080");

socket.on("connect", () => {
  console.log("Connected to server");
  setTimeout(() => {
    socket.emit("processUrl", { url: "wss://socket3.lichess.org/play/NBQc5D25qmv3/v6?sri=hmj1bCoB5cih&v=0" });
  }, 2000);
});

socket.on("processedData", (data) => {
  console.log("best move:", data);
});

socket.on("error", (error) => {
  console.error("Error:", error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
