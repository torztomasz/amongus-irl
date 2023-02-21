import { Server, Socket } from "socket.io";
import { taskContents } from "./db";
import { shuffle } from "./utils";

interface Player {
  id: string;
  role: PlayerRole;
  dead?: boolean;
}
enum PlayerRole {
  CREWMATE = "CREWMATE",
  IMPOSTOR = "IMPOSTOR",
}

interface GameOptions {
  io: Server;
  playerCount: number;
  impostorCount: number;
  tasksPerPlayer: number;
}

export class Game {
  private readonly io: Server;
  private readonly playerCount: number;
  private readonly impostorCount: number;
  private readonly tasksPerPlayer: number;
  private readonly players: Player[] = [];
  private readonly playerRoles: PlayerRole[] = [];
  private taskCount: number = 0;
  private tasks: Record<string, boolean> = {};
  constructor(opts: GameOptions) {
    this.io = opts.io;
    this.playerCount = opts.playerCount;
    this.impostorCount = opts.impostorCount;
    this.tasksPerPlayer = opts.tasksPerPlayer;
    this.playerRoles = this.generatePlayerRoles();
  }

  addPlayer(socket: Socket) {
    if (this.players.length >= this.playerCount) {
      return;
    }
    const role = this.playerRoles.pop()!;
    const player: Player = {
      id: socket.id,
      role,
    };
    console.log(socket.id);

    this.players.push(player);
    const tasks = this.getTasksForPlayer(this.tasksPerPlayer);
    this.taskCount = this.players.length * this.tasksPerPlayer;
    tasks.forEach((task) => {
      this.tasks[task.id + player.id] = false;
    });
    socket.emit("initialize", {
      player,
      tasks,
    });
  }

  completeTask(taskId: number, socket: Socket) {
    this.tasks[taskId + socket.id] = true;
    const completedTasksCount = Object.values(this.tasks).filter(
      Boolean
    ).length;
    const progress = completedTasksCount / this.taskCount;
    const isGameFinished = this.checkIfGameIsFinished();
    if (isGameFinished) return;
    this.io.emit("tasks", { tasks: this.tasks, progress });
  }

  markAsDead(socket: Socket) {
    const player = this.players.find((p) => p.id === socket.id);
    if (!player) {
      return;
    }
    player.dead = true;
    const isGameFinished = this.checkIfGameIsFinished();
    if (isGameFinished) return;
  }

  private checkIfGameIsFinished() {
    const deadPlayers = this.players.filter((p) => p.dead);
    const deadImpostors = deadPlayers.filter(
      (p) => p.role === PlayerRole.IMPOSTOR
    );
    const completedTasks = Object.values(this.tasks).filter(Boolean).length;
    if (
      deadImpostors.length === this.impostorCount ||
      completedTasks === this.taskCount
    ) {
      this.io.emit("gameOver", { winner: "CREWMATE" });
      return true;
    }

    const deadCrewmates = deadPlayers.filter(
      (p) => p.role === PlayerRole.CREWMATE
    );
    if (deadCrewmates.length === this.playerCount - this.impostorCount) {
      this.io.emit("gameOver", { winner: "IMPOSTOR" });
      return true;
    }
    return false;
  }

  private generatePlayerRoles() {
    const arr: PlayerRole[] = new Array(this.playerCount).fill(
      PlayerRole.CREWMATE
    );
    for (let i = 0; i < this.impostorCount; i++) {
      arr[i] = PlayerRole.IMPOSTOR;
    }
    return shuffle(arr);
  }

  private getTasksForPlayer(taskCount: number) {
    return shuffle(taskContents).slice(0, taskCount);
  }
}
