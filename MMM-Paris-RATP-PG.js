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
    maximumEntries: 2, //if the APIs sends several results for the incoming transport how many should be displayed
    maxTimeOffset: 200, // Max time in the future for entries
    useRealtime: true,
    updateInterval: 1 * 60 * 1000, //time in ms between pulling request for new times (update request)
    animationSpeed: 2000,
    convertToWaitingTime: true, // messages received from API can be 'hh:mm' in that case convert it in the waiting time 'x mn'
    initialLoadDelay: 0, // start delay seconds.
    apiBase: 'https://api-ratp.pierre-grimaud.fr/v2/',
    maxLettersForDestination: 22, //will limit the length of the destination string
    concatenateArrivals: true, //if for a transport there is the same destination and several times, they will be displayed on one line
    showSecondsToNextUpdate: true,  // display a countdown to the next update pull (should I wait for a refresh before going ?)
    showLastUpdateTime: false,  //display the time when the last pulled occured (taste & color...)
    oldUpdateOpacity: 0.5, //when a displayed time age has reached a threshold their display turns darker (i.e. less reliable)
    oldThreshold: 0.1, //if (1+x) of the updateInterval has passed since the last refresh... then the oldUpdateOpacity is applied
    debug: false, //console.log more things to help debugging
    apiVelib: 'https://opendata.paris.fr/api/records/1.0/search/?dataset=stations-velib-disponibilites-en-temps-reel', // add &q=141111 to get info of that station
    velibGraphWidth: 400, //Height will follow
    apiAutolib: 'https://opendata.paris.fr/explore/dataset/stations_et_espaces_autolib_de_la_metropole_parisienne/api/' ///add '?q=' mais pas d'info temps réel... pour l'instant
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
    this.velibHistory = {};
    this.busLastUpdate = {};
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
      var timeDifference = Math.round((this.config.updateInterval - new Date() + Date.parse(this.config.lastUpdate)) / 1000);
      if (timeDifference > 0) {
        header += ', next update in ' + timeDifference + 's';
      } else {
        header += ', update requested ' + Math.abs(timeDifference) + 's ago';
      }
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
      switch (stop.type) {
        case "bus":
        case "rers":
          var stopIndex = stop.line + '/' + stop.stations + '/' + stop.destination;
          var previousRow, previousDestination, previousMessage, row, comingBus;
          var comingBuses = this.busSchedules[stopIndex] || [{message: 'N/A', destination: 'N/A'}];
          var comingBusLastUpdate = this.busLastUpdate[stopIndex];
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
                depCell.innerHTML = waitingTime + ' mn';
              } else {
                depCell.innerHTML = comingBus.message;
              }
            }
            row.appendChild(depCell);
            if ((new Date() - Date.parse(comingBusLastUpdate)) > (this.config.oldUpdateThreshold ? this.config.oldUpdateThreshold : (this.config.updateInterval * (1 + this.config.oldThreshold)) )) {
              busDestination.style.opacity = this.config.oldUpdateOpacity;
              depCell.style.opacity = this.config.oldUpdateOpacity;
            }
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
          break;
        case 'velib':
          row = document.createElement("tr");
          if (this.velibHistory[stop.stations]) {
            var station = this.velibHistory[stop.stations].slice(-1)[0];
            var velibStation = document.createElement("td");
            velibStation.className = "align-left";
            velibStation.innerHTML = station.total;
            row.appendChild(velibStation);
            var velibStatus = document.createElement("td");
            velibStatus.className = "bright";
            velibStatus.innerHTML = station.bike + ' velibs ' + station.empty + ' spaces';
            row.appendChild(velibStatus);
            var velibName = document.createElement("td");
            velibName.className = "align-right";
            velibName.innerHTML = stop.label || station.name;
            row.appendChild(velibName);
          } else {
            var message = document.createElement("td");
            message.className = "bright";
            message.innerHTML = (stop.label || stop.stations) + ' no info yet';
            row.appendChild(message);
          }
          table.appendChild(row);
          break;
      }
    }
    return wrapper;
  },
  
  socketNotificationReceived: function(notification, payload) {
    switch (notification) {
      case "BUS":
        this.busSchedules[payload.id] = payload.schedules;
        this.busLastUpdate[payload.id] = payload.lastUpdate;
        this.loaded = true;
        this.updateDom();
        break;
      case "VELIB":
        if (!this.velibHistory[payload.id]) {
          this.velibHistory[payload.id] = [];
          this.velibHistory[payload.id].push(payload);
          console.log (' *** size of velib History for ' + payload.id + ' is: ' + this.velibHistory[payload.id].length);
          this.updateDom();
        } else if (this.velibHistory[payload.id][this.velibHistory[payload.id].length - 1].lastUpdate != payload.lastUpdate) {
          this.velibHistory[payload.id].push(payload);
          this.updateDom();
          console.log (' *** size of velib History for ' + payload.id + ' is: ' + this.velibHistory[payload.id].length);
        } else {
          console.log (' *** redundant velib payload for ' + payload.id + ' with time ' + payload.lastUpdate + ' && ' + this.velibHistory[payload.id][this.velibHistory[payload.id].length - 1].lastUpdate );
        }
        break;
      case "UPDATE":
        this.config.lastUpdate = payload.lastUpdate;
        this.updateDom();
        break;
    }
  }
});
