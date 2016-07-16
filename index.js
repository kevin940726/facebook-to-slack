'use strict';

var fetch = require('node-fetch');

var VERIFY_TOKEN = process.env.VERIFY_TOKEN;
var SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;
var FB_GRAPH_API = "https://graph.facebook.com/v2.7/";
var GRAPH_TOKEN = process.env.GRAPH_TOKEN;
var PAGE_PIC = process.env.PAGE_PIC;

exports.handler = function(event, context, callback) {
  console.log('message received: ', JSON.stringify(event, null, '  '));

  // process GET request
  if (event.params && event.params.querystring) {
    var queryParams = event.params.querystring;

    var rVerifyToken = queryParams['hub.verify_token']

    if (rVerifyToken === VERIFY_TOKEN) {
      var challenge = queryParams['hub.challenge']
      callback(null, parseInt(challenge))
    } else {
      callback(null, 'Error, wrong validation token');
    }
  } else {
    event.entry[0].messaging
			.forEach(function(messaging) {
				sendToSlack(messaging.sender.id, messaging.message);

				callback(null, "Done");
			});
  }

  callback(null, 'no params');
};

var sendToSlack = function(senderId, message) {
	fetch(FB_GRAPH_API + senderId + '?access_token=' + GRAPH_TOKEN)
		.then(function(res) {
			return res.json();
		})
		.then(function(user) {
			console.log('user: ', JSON.stringify(user, null, '  '));
			var nameCompose = user.locale === 'zh_TW' ? user.last_name + user.first_name : user.first_name + ' ' + user.last_name;

			var payload = {
		    username: user.name || nameCompose,
				icon_url: user.profile_pic || PAGE_PIC,
		    text: message.text || '',
				attachments: message.attachments && message.attachments.map(function(attachment) {
					if (attachment.type === 'image') {
						return {
							text: '',
							image_url: attachment.payload.url,
						};
					} else {
						return {
							text: attachment.payload.text
						};
					}
				})
		  };

			console.log(JSON.stringify(payload, null, '  '));

			return fetch(SLACK_WEBHOOK, {
				method: 'POST',
				body: JSON.stringify(payload),
			});
		});
};
