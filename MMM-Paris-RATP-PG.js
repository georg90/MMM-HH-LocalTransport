/* Timetable for Paris local transport Module */

/* Magic Mirror
 * Module: MMM-Paris-RATP-PG
 *
 * By da4throux 
 * based on a script from Georg Peters (https://lane6.de)
 * and a script from Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 */
 
Module.register("MMM-Paris-RATP-PG",{
 
  // Define module defaults
  defaults: {
    maximumEntries: 2, // Total Maximum Entries per transport
    maxTimeOffset: 200, // Max time in the future for entries
    useRealtime: true,
    updateInterval: 1 * 60 * 1000, // Update every minute.
    animationSpeed: 2000,
    convertToWaitingTime: true,
    initialLoadDelay: 0, // start delay seconds.
    apiBase: 'https://api-ratp.pierre-grimaud.fr/v2/',
    maxLettersForDestination: 22,
    concatenateArrivals: true,
    showSecondsToNextUpdate: true,
    showLastUpdateTime: true,
  },
  
  // Define required scripts.
  getStyles: function() {
    return ["MMM-Paris-RATP-Transport.css", "font-awesome.css"];
  },
  
  // Define start sequence.
  start: function() {
    Log.info("Starting module: " + this.name);
    this.sendSocketNotification('SET_CONFIG', this.config);
    this.busSchedules = {};
    this.loaded = false;
    this.updateTimer = null;
    var self = this;
    setInterval(function () {
      self.updateDom();
    }, 1000);
  },

  getHeader: function () {
    var header = this.data.header;
    if (this.config.showSecondsToNextUpdate) {
      var timeDifference = new Date() - this.config.lastUpdate;
      header += ' next update in ' + Math.round((this.config.updateInterval - timeDifference) / 1000) + 's';
    }
    if (this.config.showLastUpdateTime) {
      var now = this.config.lastUpdate;
      header += (now ? (' @ ' + now.getHours() + ':' + (now.getMinutes() > 9 ? '' : '0') + now.getMinutes() + ':' + (now.getSeconds() > 9 ? '' : '0') + now.getSeconds()) : '');
    }
    return header;
  },
  
  // Override dom generator.
  getDom: function() {
    var now = new Date();
    var wrapper = document.createElement("div");
    
    if (!this.loaded) {
      wrapper.innerHTML = "Loading connections ...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }
    
    var table = document.createElement("table");
    wrapper.appendChild(table);
    table.className = "small";

    for (var busIndex = 0; busIndex < this.config.busStations.length; busIndex++) {      
      var firstLine = true;
      var stop = this.config.busStations[busIndex];
      var stopIndex = stop.line + '/' + stop.stations + '/' + stop.destination;
      var previousRow, previousDestination, previousMessage, row, comingBus;
      var comingBuses = this.busSchedules[stopIndex] || [{message:'N/A', destination: 'N/A'}];
      for (var comingIndex = 0; (comingIndex < this.config.maximumEntries) && (comingIndex < comingBuses.length); comingIndex++) {
        row = document.createElement("tr");
        comingBus = comingBuses[comingIndex];
      
        var busNameCell = document.createElement("td");
        busNameCell.className = "align-right bright";
        if (firstLine) {
          busNameCell.innerHTML = stop.label || stop.line;
        } else {
          busNameCell.innerHTML = ' ';
        }
        row.appendChild(busNameCell);

        var busDestination = document.createElement("td");
        busDestination.innerHTML = comingBus.destination.substr(0, this.config.maxLettersForDestination);
        busDestination.className = "align-left";
        row.appendChild(busDestination);

        var depCell = document.createElement("td");
        depCell.className = "bright";
        if (!this.busSchedules[stopIndex]) {
          depCell.innerHTML = "N/A ";
        } else {
          if (this.config.convertToWaitingTime && /^\d{1,2}[:][0-5][0-9]$/.test(comingBus.message)) {
            var transportTime = comingBus.message.split(':');
            var endDate = new Date(0, 0, 0, transportTime[0], transportTime[1]);
            var startDate = new Date(0, 0, 0, now.getHours(), now.getMinutes(), now.getSeconds());
            var waitingTime = endDate - startDate; 
            if (startDate > endDate) { 
              waitingTime += 1000 * 60 * 60 * 24; 
            }
            waitingTime = Math.floor(waitingTime / 1000 / 60);
            comingBus.message = waitingTime + ' mn';
          }
          depCell.innerHTML = comingBus.message;
        }
        row.appendChild(depCell);
        if (this.config.concatenateArrivals && !firstLine && (comingBus.destination == previousDestination)) {
          previousMessage += ' / ' + comingBus.message;
          previousRow.getElementsByTagName('td')[2].innerHTML = previousMessage;
        } else {
          table.appendChild(row);
          previousRow = row;
          previousMessage = comingBus.message;
          previousDestination = comingBus.destination;
        }
        firstLine = false;      
      }
    }
    return wrapper;
  },
  
  socketNotificationReceived: function(notification, payload) {
    if (notification === "BUS"){
      this.busSchedules[payload.id] = payload.schedules;
      this.loaded = true;
//      this.updateDom(this.config.animationSpeed);
      this.config.lastUpdate = new Date();
      this.updateDom();
    }
  }
});
