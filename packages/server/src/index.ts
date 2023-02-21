import * as express from "express";
import * as http from "http";
import { AddressInfo } from "net";
import { Server } from "socket.io";
import { Game } from "./Game";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new Game({
  io,
  playerCount: 9,
  impostorCount: 2,
  tasksPerPlayer: 2,
});

io.on("connection", (socket) => {
  game.addPlayer(socket);

  socket.on("taskCompleted", (message: string) => {
    const id = parseInt(message);
    game.completeTask(id, socket);
  });
});

// start our server
server.listen(8999, () => {
  console.log(
    `Server started on port ${(server.address() as AddressInfo).port} :)`
  );
});
