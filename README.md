# MMM-HH-LocalTransport

# Get API key

You need to obtain your API key here: http://www.hvv.de/fahrplaene/fahrplanauskunft/datenschnittstelle/

# Install

1. Clone repository into `../modules/` inside your MagicMirror folder.
2. Run `npm install` inside `../modules/MMM-HH-LocalTransport/` folder
3. Run `node findStation.js apiKey apiUser stationName` to find out your Station ID.
4. Add the module to the MagicMirror config
```
		{
	        module: 'MMM-HH-LocalTransport',
	        position: 'bottom_right',
	        header: 'Connections',
	        config: {
	            id: '', // Trainstation ID
	            apiKey: '', // Add your apiKey
	            apiUser: '', // Add your apiUser
							customAPI: false, // or true
							customUrl: 'http://api/v1/getSignature',
							customAPIToken: 'token123',
							updateInterval: 60000,
							maximumEntries: '10' // Max departures displayed
	        }
    	},
```
# Screenshot
![screenshot](https://cloud.githubusercontent.com/assets/6489464/16900320/11ec448a-4c22-11e6-8754-181862a52540.png)


# Further information
For all config options check [here](https://github.com/georg90/MMM-HH-LocalTransport/blob/master/MMM-HH-LocalTransport.js#L15-L31).
