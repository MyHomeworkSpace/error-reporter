var fs = require("fs");
var request = require('sync-request');
var knex = require('knex')({
	client: 'mysql',
	connection: {
		host     : getVar("DB_HOST"),
		user     : getVar("DB_USER"),
		password : getVar("DB_PASS"),
		database : getVar("DB_BASE")
	}
});
var last_count = ".last_count";

function getVar(name) {
	if (process.env[name]) {
		return process.env[name];
	} else {
		console.error("fatal: missing variable " + name + ".");
		process.exit(1);
	}
	return undefined;
}

function sendMsg(payload) {
	return request("POST", webhookURL, {
		body: JSON.stringify(payload)
	});
}

var webhookURL = getVar("SLACK_WEBHOOK_URL");
var descriptions = ["Ha-ha, an error.", "Wasn't me.", "You should probably fix this.", "I blame <@robotxlabs>", "Maybe <https://www.youtube.com/watch?v=dQw4w9WgXcQ|this> will help you?", "<@thatoddmailbox>...", "Ugh, wat du nao?"];
var old_count = parseInt(fs.readFileSync(last_count));

knex("errors").count("*").then(function(data) {
	var new_count = data[0]["count(*)"];
	if (old_count == new_count) {
		console.log("No new errors.");
		process.exit(0);
	}
	var new_errors = new_count - old_count;
	sendMsg({text: (new_errors == 1 ? "There is 1 new error." : "There are " + new_errors + " new errors.") });
	knex("errors").orderBy('errorId', 'desc').limit(new_errors).select("*").then(function(data) {
		var results = data.reverse();
		var c = 1;
		for (var i in results) {
			var row = results[i];
			var payload = {
			    "attachments": [
			        {
			            "fallback": "Uh-oh! An error has occurred, but we don't seem able to display it to you.",
			            "color": "danger",
			            "author_name": "MyHomeworkSpace Error Tracker",
			            "title": "Error #" + c,
			            "text": descriptions[Math.floor(Math.random() * descriptions.length)],
			            "fields": [
			                {
			                    "title": "Username",
			                    "value": row.username,
			                    "short": true
			                },
			                {
			                    "title": "HTTP Status",
			                    "value": row.status,
			                    "short": true
			                },
			                {
			                    "title": "URL",
			                    "value": row.url,
			                    "short": false
			                },
			                {
			                    "title": "Error Message",
			                    "value": row.msg,
			                    "short": false
			                },
			                {
			                    "title": "User-Agent",
			                    "value": JSON.parse(row.headers)['user-agent'],
			                    "short": false
			                }
			            ],
			            "footer": "MyHomeworkSpace",
			            "footer_icon": "https://avatars1.githubusercontent.com/u/15315494",
			            "ts": new Date(row.timestamp).valueOf() / 1000
			        }
			    ]
			};
			sendMsg(payload);
			c++;
		}
		fs.writeFileSync(last_count, new_count);
		console.log("Done!");
		process.exit(0);
	});
});
