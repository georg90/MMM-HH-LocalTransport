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
		maximumEntries: 10, // Total Maximum Entries
		maxTimeOffset: 200, // Max time in the future for entries
		useRealtime: true,
		updateInterval: 3 * 60 * 1000, // Update every minute.
		animationSpeed: 2000,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
        initialLoadDelay: 0, // start delay seconds.
		apiBase: 'https://api-ratp.pierre-grimaud.fr/v2/',
    busStations: [{bus: 38, stations: 2758, destination: 183, label: '38 N'}], //array of the bus line/stop/direction/label to monitors
	},
  
  // Define required scripts.
	getStyles: function() {
		return ["MMM-Paris-RATP-Transport.css", "font-awesome.css"];
	},
  
  // Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		this.sendSocketNotification('SET_CONFIG', this.config);
    this.transports = [];
		this.loaded = false;
		this.updateTimer = null;
	},
  
  // Override dom generator.
  getDom: function() {
    var wrapper = document.createElement("div");
    
    if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
    
    var table = document.createElement("table");
    table.className = "small";
    
    for (var busIndex in this.busStations) {
      var bus = this.busStations[busIndex];
      //var busSchedule = this.busSchedule[busIndex];
      var row = document.createElement("tr");
      table.appendChild(row);
      
      var depCell = document.createElement("td");
      depCell.className = "departuretime";
      depCell.innerHTML = "time N/A ";
      
      var busNameCell = document.createElement("td");
      busNameCell.innerHTML = this.busStations[busIndex].label;
      busNameCell.className = "align-right bright";
      row.appendChile(busNameCell);
      
      if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.trains.length * this.config.fadePoint;
				var steps = this.trains.length - startingPoint;
				if (t >= startingPoint) {
					var currentStep = t - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
      
    }
    return table;
  },
  
  socketNotificationReceived: function(notification, payload) {
		if (notification === "BUS"){ //*** I'll have one notification per bus to check...
			Log.info("Bus schedule arrived");
			this.busSchedule = payload;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
	}

 });
