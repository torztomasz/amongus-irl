export type MessageEvent = CompleteTaskEvent | DeathEvent;

type CompleteTaskEvent = {
  type: "COMPLETE_TASK";
  payload: string;
};

type DeathEvent = {
  type: "DEATH";
};
