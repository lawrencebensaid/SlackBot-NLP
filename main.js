#!/usr/local/bin/node

import { spawn } from "child_process"
import { config } from "dotenv"
import bolt from "@slack/bolt"
import fs from "fs"

config();

const {
  SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET
} = process.env;
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;
const DELIMITER = process.env.DELIMITER || "§";

global.print = console.log;

const { intents } = JSON.parse(fs.readFileSync("./input/intents.json"));

const db = {
  "company.colors": ["*geel* [#ffde80]", "*paars* [#584c9f]", "*blauw* [#90bae2]"],
  "company.values": ["*eerlijk*", "*helder*", "*verantwoord*"]
};

const responseSet = {};

var driver = spawn("python", ["driver.py"]);

const { App } = bolt;

const app = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: SLACK_BOT_TOKEN,
});

function getResponse(topic) {
  const selection = intents.filter((x) => x.topic == topic);
  if (selection.length == 0) return;
  const { responses } = selection[0];
  const choice = Math.floor(responses.length * Math.random());
  const response = renderResponse(responses[choice]);
  return response;
}

function renderResponse(response) {
  var rendered = response;
  const groups = response.matchAll(/(?:<)(.+)(?:>)/gm);
  for (const { 1: group } of groups) {
    if (group in db) {
      var replacement = "";
      const options = JSON.parse(JSON.stringify(db[group]));
      if (Array.isArray(options)) {
        if (options.length > 1) {
          const last = options.pop();
          replacement = `${options.join(", ")} en ${last}`;
        } else if (options.length > 0) {
          replacement = options[0];
        }
      } else {
        replacement = options;
      }
      rendered = rendered.split(`<${group}>`).join(replacement);
    }
  }
  return rendered;
}

// Handle responses from driver
driver.stdout.on("data", (chunk) => {
  var data = chunk.toString("utf8").trim();
  if (!data.includes(DELIMITER)) return;
  const components = data.split(DELIMITER);
  const id = components.pop();
  data = JSON.parse(components.join(DELIMITER));
  if (id in responseSet) {
    const say = responseSet[id];
    if (data.length === 0) {
      say("Hmm, I don't know that one. Sorry about that 😕");
      return;
    }
    data.sort((a, b) => b.confidence - a.confidence);
    const response = getResponse(data[0].topic);
    print("OUT", response);
    say(response);
    delete responseSet[id];
  }
});

// Handle when the driver closes
driver.stdout.on("close", () => {
  print("CLOSE", "Connection closed!");
  process.exit();
});

(async () => {

  await app.start({ port: PORT });
  print(`Slack bot running on ${HOST}:${PORT}`);

  app.event("app_mention", ({ event, say }) => {
    print(event);
    const id = event.client_msg_id.split("-").join("");
    responseSet[id] = say; // TODO: <@${event.user}>
    const request = `${event.text}${DELIMITER}${id}`;
    print("IN", event.text);
    driver.stdin.write(`${request}\n`);
  });

  app.event("message", ({ event, say }) => {
    if (event.channel_type !== "im") return;
    print(event);
    const id = event.client_msg_id.split("-").join("");
    responseSet[id] = say;
    const request = `${event.text}${DELIMITER}${id}`;
    print("IN", event.text);
    driver.stdin.write(`${request}\n`);
  });

})();