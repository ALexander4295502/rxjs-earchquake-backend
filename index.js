const WebSocket = require("ws");
const Twit = require("twit");
const Rx = require("rxjs");
const Config = require("./config.json");

const Observable = Rx.Observable;
// const T = new Twit({
//   consumer_key: Config.TWITTER.consumer_key,
//   consumer_secret: Config.TWITTER.consumer_secret,
//   access_token: Config.TWITTER.access_token,
//   access_token_secret: Config.TWITTER.access_token_secret
// });

const fakeTweetObject = {
  created_at: "Wed Oct 10 20:19:24 +0000 2018",
  id: 1050118621198921728,
  id_str: "1050118621198921728",
  text:
    "To make room for more expression, we will now count all emojis as equal—including those with gender‍‍‍ ‍‍and skin t… https://t.co/MkGjXf9aXm",
  user: {},
  entities: {}
};

// Initialization
function onConnect(ws) {
  console.log("Client connected on localhost:8081");

//   const stream = T.stream("statuses/filter", {
//     track: "earchquake",
//     location: []
//   });

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
    });
  // .subscribe(boundsArray => {
  //   stream.stop();
  //   stream.params.location = boundsArray;
  //   stream.start();
  // }, []);

  // for testing;
  Observable.from([1, 2, 3]).subscribe(() => {
    ws.send(JSON.stringify(fakeTweetObject), err => {
      if (err) {
        console.log("There was an error sending the message");
      }
    });
  });

//   Observable.fromEvent(stream, "tweet").subscribe(tweetObject => {
//     ws.send(JSON.stringify(tweetObject), err => {
//       if (err) {
//         console.log("There was an error sending the message");
//       }
//     });
//   });
}

const Server = new WebSocket.Server({ port: 8081 });
Observable.fromEvent(Server, "connection").subscribe(onConnect);
