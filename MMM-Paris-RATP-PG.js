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
  },

  // Override dom generator.
  getDom: function() {
    Log.info ('modules.js - entering getDom');
    var wrapper = document.createElement("div");
    
    if (!this.loaded) {
      wrapper.innerHTML = "Loading connections ...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }
    
    var table = document.createElement("table");
    table.className = "small";

    for (var busIndex = 0; busIndex < this.config.busStations.length; busIndex++) {
      var stop = this.config.busStations[busIndex];
      var stopIndex = stop.line + '/' + stop.stations + '/' + stop.destination;
      var row, comingBus;
      var comingBuses = this.busSchedules[stopIndex] || [{message:'N/A', destination: 'N/A'}];
      for (var comingIndex = 0; (comingIndex < this.config.maximumEntries) && (comingIndex < comingBuses.length); comingIndex++) {
        row = document.createElement("tr");
        table.appendChild(row);
        comingBus = comingBuses[comingIndex];
      
        var busNameCell = document.createElement("td");
        busNameCell.innerHTML = stop.label || stop.line;
        busNameCell.className = "align-right bright";
        row.appendChild(busNameCell);

        var busDestination = document.createElement("td");
        busDestination.innerHTML = comingBus.destination;
        busDestination.className = "align-left";
        row.appendChild(busDestination);

        var depCell = document.createElement("td");
        depCell.className = "bright";
        if (!this.busSchedules[stopIndex]) {
          depCell.innerHTML = "N/A ";
        } else {
          depCell.innerHTML = comingBus.message;
        }
        row.appendChild(depCell);
      
      }
    }
    return table;
  },
  
  socketNotificationReceived: function(notification, payload) {
    console.log ('module.js entering socketNotificationReceived: ' + notification);
    if (notification === "BUS"){
      console.log("Bus schedule arrived in modules.js");
      console.log(payload);
      this.busSchedules[payload.id] = payload.schedules;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  }
});
