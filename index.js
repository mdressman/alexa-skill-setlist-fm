var Alexa = require('alexa-sdk');
var request = require('superagent');

var APP_ID = undefined; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
var SKILL_NAME = 'Setlist.fm'

var handlers = {
  GetSetlist: function () {

    var self = this; // ugh, i hate this

    var speechOutput;

    var artistSlot = this.event.request.intent.slots.Artist;
    var artistName;
    if (artistSlot && artistSlot.value) {
        artistName = artistSlot.value.toLowerCase();
    }

    request
      // .get('http://api.setlist.fm/rest/0.1/artist/83b9cbe7-9857-49e2-ab8e-b57b01038103/setlists.json') // pearl jam
      .get('http://api.setlist.fm/rest/0.1/artist/cff95140-6d57-498a-8834-10eb72865b29/setlists.json') // sci
      .end(function(err, res) {

        var setlist = res.body.setlists.setlist[0];
        var artistName = setlist.artist['@name'];
        var date = setlist['@eventDate'];
        var venue = setlist.venue['@name'];
        var city = setlist.venue.city['@name'];
        var state = setlist.venue.city['@state'];

        var listOfSongs = [];

        setlist.sets.set.forEach(function (set, i) {
          var setName;
          if (set['@encore']) {
            setName = 'Encore ' + set['@encore'];
          } else {
            setName = set['@name'] || 'Set ' + (i + 1);
          }
            
          listOfSongs.push(setName);
          set.song.forEach(function (song) {
            listOfSongs.push(song['@name']);
          });
        });

        listOfSongs = listOfSongs.join(', ');

        var speechOutput = 'Here\'s the latest setlist for ' + artistName + ' from ' +
          venue + ' in ' + city + ', ' + state + ' on ' + date + ': ' + listOfSongs;

        self.emit(':tell', speechOutput);
      });
  },

  SetlistIntent: function () {
    this.emit('GetSetlist');
  }
};

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};