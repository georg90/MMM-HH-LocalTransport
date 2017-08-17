/* Timetable for local transport Module */

/* Magic Mirror
 * Module: HH-LocalTransport
 *
 * By Georg Peters https://github.com/georg90/
 * based on a script from Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 */

Module.register("MMM-HH-LocalTransport",{

	// Define module defaults
	defaults: {
		maximumEntries: 10, // Total Maximum Entries
		maxTimeOffset: 200, // Max time in the future for entries
		useRealtime: true,
		updateInterval: 1 * 60 * 1000, // Update every minute.
		animationSpeed: 2000,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
    initialLoadDelay: 0, // start delay seconds.
		apiBase: 'http://api-prod.geofox.de/gti/public/',
		customAPI: false, // Set to true if signature is generated via external API
		customUrl: 'https://custom-api.url.de/apiEndpoint', // change to API endpoint (receiving payload and returns siganture)
		customAPIToken: 'token123', // custom token to authenticate
		apiKey: 'Hamburg',
		apiUser: 'name',
		Realtime: true,
		version: 27, // HVV API version
    id: "Master:9910910", // HH HBF
	},

	// Define required scripts.
	getStyles: function() {
		return ["MMM-HH-LocalTransport.css", "font-awesome.css"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		this.sendSocketNotification('CONFIG', this.config);
        this.trains = [];
		this.loaded = false;
		this.updateTimer = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.id === "") {
			wrapper.innerHTML = "Please set the correct Station ID: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.apiKey === "") {
			wrapper.innerHTML = "Please set API key: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "Loading connections ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.className = "small";

		for (var t in this.trains) {
			var trains = this.trains[t];

			var row = document.createElement("tr");
			table.appendChild(row);

			var depCell = document.createElement("td");
			depCell.className = "departuretime";
			if (trains.departureTimestamp == 0) {
				depCell.innerHTML = "now";
			}
			else {
			depCell.innerHTML = trains.departureTimestamp + " min";
		    }
			row.appendChild(depCell);

                        if(trains.delay) {
                            var delayCell = document.createElement("td");
                            delayCell.className = "delay red";
                            delayCell.innerHTML = " (+" + trains.delay + ")";
                            row.appendChild(delayCell);
                        } else {
                            var delayCell = document.createElement("td");
                            delayCell.className = "delay red";
                            delayCell.innerHTML = trains.delay;
                            row.appendChild(delayCell);
                        }

			var trainNameCell = document.createElement("td");
			trainNameCell.innerHTML = trains.name;
			trainNameCell.className = "align-right bright";
			row.appendChild(trainNameCell);

			var trainToCell = document.createElement("td");
			trainToCell.innerHTML = trains.to;
			trainToCell.className = "align-right trainto";
			row.appendChild(trainToCell);

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
		if (notification === "TRAINS"){
			Log.info("Trains arrived");
			this.trains = payload;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
	}
});
