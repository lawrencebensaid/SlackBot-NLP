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
const MISSES_LOG_FILE = process.env.MISSES_LOG_FILE || "./misunderstandings.log";

global.print = console.log;

const { intents } = JSON.parse(fs.readFileSync("./input/intents.json"));

const db = {
  "bot.name": "Slack Bot",
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

function getResponse(topic, dynamics = {}) {
  const selection = intents.filter((x) => x.topic == topic);
  if (selection.length == 0) return;
  const { responses } = selection[0];
  const choice = Math.floor(responses.length * Math.random());
  const response = renderResponse(responses[choice], dynamics);
  return response;
}

function renderResponse(response, dynamics = {}) {
  var variables = Object.assign(dynamics, db);
  var rendered = response;
  const groups = response.matchAll(/(?:\{)(.+)(?:\})/gm);
  for (const { 1: group } of groups) {
    if (group in variables) {
      var replacement = "";
      const options = JSON.parse(JSON.stringify(variables[group]));
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
      rendered = rendered.split(`{${group}}`).join(replacement);
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
    const say = responseSet[id][0];
    const dynamics = responseSet[id][1];
    if (data.length === 0) {
      say(getResponse("misunderstand", dynamics));
      var misses = "";
      if (fs.existsSync(MISSES_LOG_FILE)) {
        misses = fs.readFileSync(MISSES_LOG_FILE);
      }
      misses += `[${new Date().toISOString()}] ${dynamics.text}\n`;
      fs.writeFileSync(MISSES_LOG_FILE, misses);
      return;
    }
    data.sort((a, b) => b.confidence - a.confidence);
    const response = getResponse(data[0].topic, dynamics);
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
    responseSet[id] = [say, { text: event.text, user: event.user }];
    const request = `${event.text}${DELIMITER}${id}`;
    print("IN", event.text);
    driver.stdin.write(`${request}\n`);
  });

  app.event("message", ({ event, say }) => {
    if (event.channel_type !== "im") return;
    print(event);
    const id = event.client_msg_id.split("-").join("");
    responseSet[id] = [say, { text: event.text, user: event.user }];
    const request = `${event.text}${DELIMITER}${id}`;
    print("IN", event.text);
    driver.stdin.write(`${request}\n`);
  });

})();