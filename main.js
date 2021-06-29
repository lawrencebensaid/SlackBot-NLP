#!/usr/local/bin/node

import { config } from "dotenv"
import bolt from "@slack/bolt"

const { App } = bolt;
config();

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

(async () => {

  await app.start({ host: "0.0.0.0", port: 3000 });
  app.presen
  console.log("Slack bot running");

  app.event("app_mention", ({ event, say }) => {
    app.command("")
    console.log("app_mention", event);
    say(`Hi, <@${event.user}>! 😄`);
  });

  app.event("message", ({ event, say }) => {
    if (event.channel_type !== "im") return;
    console.log("message", event);
    const query = event.text;
    if (query.includes("?")) { // Is question
      if (query.match(/.*(?:what is the answer to|wat is het antwoord op).*(?:everything|universe|alles|universum).*/gmi)) {
        say(`It's 42!`);
        return;
      }
      if (query.match(/.*(?:what are|wat zijn).*(?:core value).*/gmi)) {
        say(`Our core values are ${db.coreValues}.`);
        say(`Hope that helped! 😄`);
        return;
      }
      if (query.match(/.*(?:what are|wat zijn).*(?:company colors).*/gmi)) {
        say(`Our company colors are ${db.colors.map(x => `#${x}`).join(", ")}.`);
        say(`Hope that helped! 😄`);
        return;
      }
      if (query.match(/.*(?:how are you|hoe gaat het).*/gmi)) {
        say(`I'm doing great!`);
        return;
      }
      say(`Ehm, I don't know that one. Sorry... 😕`);
      return;
    }
    if (query.match(/.*(?:hallo|hello|hey|hi|hoi).*/gmi)) {
      say(`Hi, <@${event.user}>! 😄`);
      return;
    }
    say(`Ehh, what was that? 🥴`);
  });

})();