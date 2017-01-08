/* Magic Mirror
 * Module: MMM-Paris_RATP-PG
 *
 * script from da4throux
 * based on a Script from  Georg Peters (https://lane6.de)
 * band a Script from Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 *
 * For the time being just the first bus from the config file
 */

const NodeHelper = require("node_helper");
const unirest = require('unirest');

module.exports = NodeHelper.create({
  start: function () {
    this.started = false;
  },
  
  socketNotificationReceived: function(notification, payload) {
    const self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;	     
      this.started = true;
      self.scheduleUpdate(this.config.initialLoadDelay);
    };
  },

  /* scheduleUpdate()
   * Schedule next update.
   * argument delay number - Millis econds before next update. If empty, this.config.updateInterval is used.
  */
  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    var self = this;
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(function() {
      self.updateTimetable();
    }, nextLoad);
  },

  /* updateTimetable(transports)
   * Calls processTrains on succesfull response.
  */
  updateTimetable: function() {
    for (var index in this.config.busStations) {
      var busStop = this.config.busStations[index];
      var url = this.config.apiBase + 'bus/' + busStop.bus + '/stations/' + busStop.stations + '?destination=' + busStop.destination; // get schedule for that bus
      console.log("requesting: " + url);
      var self = this;
			var retry = true;
      unirest.get(url)
        .headers({
          'Accept': 'application/json;charset=utf-8'
        })
        .end(function (response) {
          console.log('received response for request: ');
          console.log(response.body);
          self.processBus(response.body);
          if (retry) {
          self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
          }
        });
    }
  },

  processBus: function(data) {
    this.bus = {};
    var schedules = data.response.schedules;
    var informations = data.response.informations;
    this.bus.id = informations.line + '/' + informations.station.id_station + '/' + informations.destination.id_destination;
    this.bus.schedules = schedules;
    this.loaded = true;
    this.sendSocketNotification("BUS", this.bus);
  }

});
