var Alexa = require('alexa-sdk');
var request = require('superagent');
var Q = require('q');

var APP_ID = 'amzn1.ask.skill.69d998e2-f15e-4e65-9e48-843f5e78f24d';
var SKILL_NAME = 'Setlist.fm'

var handlers = {
  GetSetlist: function () {

    var self = this; // ugh, i hate this
    var speechOutput;
    var artistSlot = this.event.request.intent.slots.Artist;
    var artistQuery = artistSlot.value;
    Q.fcall(function () {

      return request
        // .get('http://api.setlist.fm/rest/0.1/artist/83b9cbe7-9857-49e2-ab8e-b57b01038103/setlists.json') // pearl jam
        // .get('http://api.setlist.fm/rest/0.1/artist/cff95140-6d57-498a-8834-10eb72865b29/setlists.json') // sci
        .get('http://api.setlist.fm/rest/0.1/search/artists.json?artistName=' + artistQuery);
    })
    .then(function (searchResults) {
      var artist = searchResults.body.artists.artist.filter(function (a) {
        return a['@name'].toLowerCase() === artistQuery.toLowerCase();
      });
      console.log(artist);
      var artistId = artist[0]['@mbid'];
      return request.get('http://api.setlist.fm/rest/0.1/artist/' + artistId + '/setlists.json');
    })
    .then(function (setlistResults) {

      var setlist = setlistResults.body.setlists.setlist[0];

      console.log(setlist);

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
    })
    .catch(function (err) {
      console.log(err);
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