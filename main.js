#!/usr/local/bin/node

import { config } from "dotenv"
import bolt from "@slack/bolt"
import { spawn } from "child_process"

// import * as tf from "@tensorflow/tfjs"
// import * as tfn from "@tensorflow/tfjs-node"

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

  await app.start({ host: "0.0.0.0", port: 3000 });
  print("Slack bot running");

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