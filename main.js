var request = require("request");

function getVar(name) {
	if (process.env[name]) {
		return process.env[name];
	}
	return undefined;
}

var webhookURL = getVar("SLACK_WEBHOOK_URL");

var payload = {"text": "Hello"};

request.post({
	url: webhookURL,
	form: {payload: JSON.stringify(payload)}
},
function(err,httpResponse,body) {
	if (err) {
		console.log("fail :(");
		return;
	}
	console.log("success");
});
