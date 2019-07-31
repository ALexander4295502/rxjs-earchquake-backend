const WebSocket = require("ws");
const Twit = require("twit");
const Rx = require("rxjs");
const Config =
  process.env.NODE_ENV === "development" ? require("./config.json") : null;

const Observable = Rx.Observable;
const T = new Twit({
  consumer_key:
    process.env.NODE_ENV === "development"
      ? Config.TWITTER.consumer_key
      : process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:
    process.env.NODE_ENV === "development"
      ? Config.TWITTER.consumer_secret
      : process.env.TWITTER_CONSUMER_SECRET,
  access_token:
    process.env.NODE_ENV === "development"
      ? Config.TWITTER.access_token
      : process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:
    process.env.NODE_ENV === "development"
      ? Config.TWITTER.access_token_secret
      : process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Initialization
function onConnect(ws) {
  console.log("Client connected on localhost:8081");

  let stream = T.stream("statuses/filter", {
    track: "earthquake",
    locations: []
  });

  Observable.fromEvent(ws, "message")
    .flatMap(message => {
      const quakesObj = JSON.parse(message.data);
      return Observable.from(quakesObj.quakes);
    })
    .scan((boundsArray, quake) => {
      const bounds = [
        quake.lng - 0.3,
        quake.lat - 0.15,
        quake.lng + 0.3,
        quake.lat + 0.15
      ].map(coordinate => coordinate.toFixed(2));

      const finalBounds = boundsArray.concat(bounds);
      return finalBounds.slice(Math.max(finalBounds.length - 50, 0));
    }, [])
    .subscribe(boundsArray => {
      stream.stop();
      stream.params.locations = boundsArray;
      stream.start();
    }, []);

  Observable.fromEvent(stream, "tweet").subscribe(tweetObject => {
    ws.send(JSON.stringify(tweetObject), err => {
      if (err) {
        console.log("There was an error sending the message");
      }
    });
  });
}

const Server = new WebSocket.Server({ port: 8081 });
Observable.fromEvent(Server, "connection").subscribe(onConnect);
