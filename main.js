#!/usr/local/bin/node

import { config } from "dotenv"
import bolt from "@slack/bolt"
import { spawn } from "child_process"

const { App } = bolt;
config();
global.print = console.log;

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET
} = process.env;

const db = {
  colors: ["ffde80", "584c9f", "90bae2"],
  coreValues: "Eerlijk, helder en verantwoord"
}

const app = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: SLACK_BOT_TOKEN,
});

var child = spawn("python", ["bot.py"]);

child.stdout.on("data", (chunk) => {
  var data = chunk.toString("utf8");
  print(data);
});

(async () => {

  const HOST = "0.0.0.0";
  const PORT = 3000;
  await app.start({ port: PORT });
  print(`Slack bot running on ${HOST}:${PORT}`);

  app.event("app_mention", ({ event, say }) => {
    app.command("")
    print("app_mention", event);
    say(`Hi, <@${event.user}>! 😄`);
  });

  app.event("message", ({ event, say }) => {
    if (event.channel_type !== "im") return;
    print("message", event);
    child.stdin.write(`${event.text}\n`);
  });

})();