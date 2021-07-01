#!/usr/local/bin/node

import { spawn } from "child_process"
import { config } from "dotenv"
import bolt from "@slack/bolt"

const { App } = bolt;
config();
global.print = console.log;

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET
} = process.env;
const DELIMITER = "§";

const app = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: SLACK_BOT_TOKEN,
});

var driver = spawn("python", ["driver.py"]);

const responseSet = {}

driver.stdout.on("data", (chunk) => {
  var data = chunk.toString("utf8").trim();
  if (!data.includes(DELIMITER)) return;
  const components = data.split(DELIMITER);
  const id = components.pop();
  const response = JSON.parse(components.join(DELIMITER));
  print(id, response);
  if (id in responseSet) {
    const say = responseSet[id];
    if (response.length === 0) {
      say("Hmm, I don't know that one. Sorry about that 😕");
      return;
    }
    say(response);
    delete responseSet[id];
  }
});
driver.stdout.on("close", () => {
  print("Connection closed!");
  process.exit();
});

(async () => {

  const HOST = "0.0.0.0";
  const PORT = 3001;
  await app.start({ port: PORT });
  print(`Slack bot running on ${HOST}:${PORT}`);

  app.event("app_mention", ({ event, say }) => {
    print("app_mention", event);
    say(`Hi, <@${event.user}>! 😄`);
  });

  app.event("message", ({ event, say }) => {
    if (event.channel_type !== "im") return;
    print(event);
    const id = event.client_msg_id.split("-").join("");
    responseSet[id] = say;
    const request = `${event.text}${DELIMITER}${id}`;
    print(request);
    driver.stdin.write(`${request}\n`);
  });

})();