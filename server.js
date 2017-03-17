var request = require('request');
var express = require('express');

var app = express();
app.use(function (req, res, next) {
	  res.setHeader('Access-Control-Allow-Origin', "*");
	  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
	  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Content-type, Authorization');
	  res.setHeader('Access-Control-Allow-Credentials', true);
	  next();
});
app.use(express.static(__dirname + "/static"));

var getDropInfo = function(url) {
	console.log("URL: " + url);
	return new Promise(function (resolve, reject) {
		request(url, function (error, response, body) {
			if(!error && (response && response.statusCode == 200)) {
				var dropInfo = JSON.parse(body);
				var minDropInfo = {
					code: dropInfo.code,
					title: dropInfo.title,
					size: dropInfo.size,
					privacy: dropInfo.privacy,
					password: dropInfo.password,
					shortLink: dropInfo.shortlink,
					views: dropInfo.views,
					drop_type: dropInfo.drop_type
				}
				resolve(minDropInfo);
			} else {
				reject(
				{
					"message": error,
					"statusCode": response.statusCode
				}); 
			}
		});
	});
}

var handleError = function (res, reason, message, code) {
	res.status(code || 500).json({"error": message});
}

app.get("/lookup", function(req, res) {
	console.log(JSON.stringify(req.query, null, 4));
	if(req.query["url"] != undefined) {
		getDropInfo("https://d.pr/oembed?url=" + encodeURIComponent(req.query.url) + "&format=json")
		.then(result => {
			res.status(200).json(result);
		})
		.catch(error => {
			handleError(res, null, error.message, error.statusCode);
		})
	} else {
		handleError(res, null, "Missing url parameter");
	}
});

var server = app.listen(80, function () {
	var port = server.address().port;
	console.log("App now running on port", port);
});