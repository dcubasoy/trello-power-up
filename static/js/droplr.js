var embedInfo;
var test_drop_regex = /^(http|https):\/\/d\.pr\/[ivfn]\/\w{3,8}/
var test_might_be_drop = /\/\w{3,8}$/
var test_might_be_drop_with_password = /\/\w{3,8}\/\w*$/
var trello_attachment = /https:\/\/trello-attachments\.s3\.amazonaws\.com/
var test_drop_cover_image_regex = /^Cover image for drop /
var test_drop_cover_image_regex2 = /^\w{3,8}\.png$/
// [1] = Protocol
// [2] = Drop Type
// [3] = Drop Code
// [4] = Drop Access Code
var capture_drop_regex = /^(http|https):\/\/d\.pr\/([ivfn])\/(\w{3,8})\/?(\w*)\/?/
var capture_drop_cover_image_regex = /^Cover image for drop (\w*)/
var capture_drop_cover_image_regex2 = /^(\w{3,8})\.png$/
/*var uniqueClaims = {};

var loadClaims = function(data) {
	uniqueClaims = data;
}

var updateClaims = function(url, shortLink) {
	if(!uniqueClaims.hasOwnProperty(url)) {
		uniqueClaims[url] = { "shortLink": shortLink }
	}
};

var isClaimed = function(url) {
	return uniqueClaims.hasOwnProperty(url);
};

var getClaim = function(url) {
	return uniqueClaims[url];
}

var getAllClaims = function() {
	return uniqueClaims;
}*/

var couldBeDrop = function(url) {
	return (test_might_be_drop.test(url) || test_might_be_drop_with_password.test(url)) && !trello_attachment.test(url);
}

var formatDropUrl = function(t, url){
	if(test_drop_regex.test(url)){
		capture_results = capture_drop_regex.exec(url);
		if(capture_results != null) {
			var dropParameters = {
				"url": url,
				protocol: capture_results[1],
				type: capture_results[2],
				code: capture_results[3],
				accessCode: capture_results[4],
				thumbnail: '',
				fullsize: '',
				title: url
			};

			if(dropParameters.accessCode == 'small' ||
				dropParameters.accessCode == 'medium' ||
				dropParameters.accessCode == 'thumbnail')
			{
				dropParameters.accessCode = '';
			}

			if(dropParameters.accessCode.length > 0) {
				dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/' + dropParameters.accessCode + '/thumbnail';
			} else {
				dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/thumbnail';
			}

			if(dropParameters.accessCode.length > 0) {
				dropParameters.fullsize = 'https://d.pr/' + dropParameters.code + '/' + dropParameters.accessCode + '/medium';
			} else {
				dropParameters.fullsize = 'https://d.pr/' + dropParameters.code + '/medium';
			}
			return Promise.resolve(dropParameters);
		} else {
			return Promise.resolve(null);
		}

	} else {
		return getEmbedInfo(url)
		.then(function(rawEmbedInfo) {
			embedInfo = JSON.parse(rawEmbedInfo);
			if(embedInfo.hasOwnProperty("shortLink")) {
				var aliasUrl;
				if(embedInfo.privacy == "PRIVATE") {
					aliasUrl = embedInfo.shortLink + "/" + embedInfo.password;
				} else {
					aliasUrl = embedInfo.shortLink;
				}
				if(test_drop_regex.test(aliasUrl)){ 
					//console.log("Short Link value before recursive call to formatDropUrl: " + embedInfo.shortLink);
					//return formatDropUrl(embedInfo.shortLink);
					capture_results = capture_drop_regex.exec(aliasUrl);
					if(capture_results != null) {
						var dropParameters = {
							"url": url,
							protocol: capture_results[1],
							type: capture_results[2],
							code: capture_results[3],
							accessCode: capture_results[4],
							thumbnail: '',
							fullsize: '',
							title: embedInfo.title
						};

						if(dropParameters.accessCode == 'small' ||
							dropParameters.accessCode == 'medium' ||
							dropParameters.accessCode == 'thumbnail')
						{
							dropParameters.accessCode = '';
						}

						if(dropParameters.accessCode.length > 0) {
							dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/' + dropParameters.accessCode + '/thumbnail';
						} else {
							dropParameters.thumbnail = 'https://d.pr/' + dropParameters.code + '/thumbnail';
						}

						if(dropParameters.accessCode.length > 0) {
							dropParameters.fullsize = 'https://d.pr/' + dropParameters.code + '/' + dropParameters.accessCode + '/medium';
						} else {
							dropParameters.fullsize = 'https://d.pr/' + dropParameters.code + '/medium';
						}
						return Promise.resolve(dropParameters);
					} else {
						return Promise.resolve(null);
					}
				} else {
					return Promise.resolve(null);
				}
			} else {
				return Promise.resolve(null);
			}
		});
	}
};

var extractDropCodeFromCover = function(t, attachmentName) {
	if(!test_drop_cover_image_regex.test(attachmentName)) {
		if(!test_drop_cover_image_regex2.test(attachmentName)) {
			return null
		} else {
			capture_results = capture_drop_cover_image_regex2.exec(attachmentName);
			if(capture_results != null) {
				return capture_results[1];
			} else {
				return null;
			}
		}

	} else {
		capture_results = capture_drop_cover_image_regex.exec(attachmentName);
		if(capture_results != null) {
			return capture_results[1];
		} else {
			return null;
		}
	}
}

//https://www.html5rocks.com/en/tutorials/cors/
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {

    // Check if the XMLHttpRequest object has a "withCredentials" property.
    // "withCredentials" only exists on XMLHTTPRequest2 objects.
    xhr.open(method, url, true);

  } else if (typeof XDomainRequest != "undefined") {

    // Otherwise, check if XDomainRequest.
    // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
    xhr = new XDomainRequest();
    xhr.open(method, url);

  } else {

    // Otherwise, CORS is not supported by the browser.
    xhr = null;

  }
  return xhr;
}

// Make the actual CORS request.
function getEmbedInfo(dropLink) {
  return new Promise(function(resolve, reject) {
	  // This is a sample server that supports CORS.
	  var url = "https://power-up.droplr.com/lookup?url=" + encodeURI(dropLink);

	  var xhr = createCORSRequest('GET', url);
	  if (!xhr) {
		resolve({error:"CORS not supported"});
		return;
	  }

	  // Response handlers.
	  xhr.onload = function() {
		resolve(xhr.responseText);
	  };

	  xhr.onerror = function() {
		resolve({error:"Woops, there was an error making the request."});
	  };

	  xhr.send();
  });
}
