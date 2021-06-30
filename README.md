# SlackBot NLP

This is an example of a Slack bot powered by a NLP Tensorflow neural network.

## .env example

```
SLACK_BOT_TOKEN=xoxb-#############-#############-xxxxxxxxxxxxxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Technical notes

### Intents

The intents method is a very common way to categorize conversation topics.

Below you can see an example of an intents file:

`intents.json`

```json
{
  "intents": [
    {
      "topic": "greetings",
      "patterns": ["good afternoon", "good morning", "hello", "hey", "hi", "how are you doing"],
      "responses": ["How can I be of service? 😄", "Hello", "Hello there", "Hello!", "Hey", "Hi"]
    },
    {
      "topic": "goodbye",
      "patterns": ["bye", "goodbye", "see you later"],
      "responses": ["Bye", "Goodbye", "Goodbye!"]
    },
    {
      "topic": "colors",
      "patterns": ["color", "colour", "style", "design", "standard"],
      "responses": ["#ffde80, #584c9f & #90bae2"]
    },
    {
      "topic": "corevalues",
      "patterns": ["core values"],
      "responses": ["Fair, transparent and responsible"]
    }
  ]
}
```

- `topic` - *Conversation subject.*
- `patterns` - *Keywords to recognize what topic a query is about.*
- `responses` - *Different lines to respond to a query.*