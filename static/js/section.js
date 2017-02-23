/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// you can access arguments passed to your iframe like so
var arg = t.arg('arg');

var Promise = TrelloPowerUp.Promise;
var urls = [];
var dates = [];
var dropCount = 0;
var dropDiv, imageElement, titleElement, dateElement, linkElement, copyLinkElement;
var coverLinkElement, copyLinkButtonElement, dropCode, allDropsDiv, dropInfo;
var dropInfoLookup = new Map();
var dropCoverLookup = new Map();

var isDropLink = function(attachment) {
	return test_drop_regex.test(attachment.url);
}

var isDropCoverImage = function(attachment) {
	return test_drop_cover_image_regex.test(attachment.name);
}

var setCardCover = function (card, drop) {
	dropInfo = dropInfoLookup.get(drop);
	if(dropCoverLookup.has(dropInfo.code)) {
		var attachment = dropCoverLookup.get(dropInfo.code).id;
		return new Promise.all([
			Trello.put('/cards/' + card + '/idAttachmentCover', {value: attachment})
		])
		.catch(function(reason) {
			console.log("The set cover operation failed");
			console.log("Details: \n" + JSON.stringify(reason, null, 4));
		});
	} else {
		return new Promise.all([
			Trello.post('/cards/' + card + '/attachments', {url: dropInfo.fullsize, name: 'Cover image for drop ' + dropInfo.code})
		])
		.then(function(results) {
			dropCoverLookup.set(dropInfo.code, results[0]);
			return new Promise.all([
				Trello.put('/cards/' + card + '/idAttachmentCover', {value: results[0].id})
			])
		})
		.catch(function(reason) {
			console.log("The set cover operation failed");
			console.log("Details: \n" + JSON.stringify(reason, null, 4));
		});
	}
}

var clearCardCover = function (card) {
	return new Promise.all([
		Trello.put('/cards/' + card + '/idAttachmentCover', {value: ""} )
	])
	.catch(function(reason) {
		console.log("The clear cover operation failed");
		console.log("Details: \n" + JSON.stringify(reason, null, 4));
	});
}

var makeCardCoverEventListener = function (domElement) {
	domElement.addEventListener('click', function() {
		var card = this.getAttribute("data-droplr-card");
		var drop = this.getAttribute("data-droplr-drop");
		setCardCover(card, drop)
		.then(function() {
			refreshDroplrSection();
		});
	});
}

var formatDate = function(date) {
	var day = date.getDate();
	var hours = date.getDate();
	var minutes = date.getHours();
	if(minutes < 10) {
		minutes = "0" + minutes;
	}
	var ampm = hours < 12 ? "AM" : "PM";
	if(hours > 12) {
		hours = hours - 12;
	}
	var month = months[date.getMonth()];
	return month + " " + day + " at " + hours + ":" + minutes + " " + ampm;
}

var refreshDroplrSection = function(){
  // make sure your rendering logic lives here, since we will
  // recall this method as the user adds and removes attachments
  // from your section
  t.get('organization', 'private', 'token')
  .then(function(token) {
	Trello.setToken(token);
	return t.card('id', 'cover') 
  })
  .then(function(card) {
     return Promise.all([
        Trello.get('/cards/' + card.id + '/attachments', {fields: "date,name,previews,url"}),
		card
	 ]);
  })
  .then(function(res) {
	  return Promise.all([
		res[0].filter(isDropLink),
		res[0].filter(isDropCoverImage),
		res[1]
	  ]);
  })
  .then(function(res) {
	urls = res[0].map(function(a){ return a.url; });
	dates = res[0].map(function(a){ return new Date(a.date); });
	for(i = 0; i < res[1].length; i++) {
		dropCode = extractDropCodeFromCover(null, res[1][i].name);
		if(dropCode != null) {
			if(!dropCoverLookup.has(dropCode)) {
				dropCoverLookup.set(dropCode, res[1][i]);
			}
		}
	}
	dropCount = urls.length;
	allDropsDiv = document.getElementById('droplrdrops');
	allDropsDiv.innerHTML = '';
	for(i = 0; i < dropCount; i++ ) 
	{
		if(!dropInfoLookup.has(urls[i])) {
			dropInfoLookup.set(urls[i], formatDropUrl(1, urls[i]));
		}
		dropInfo = dropInfoLookup.get(urls[i]);
		if(dropInfo != null) {
			dropCode = dropInfo.code
			dropDiv = document.getElementById("detail-row-template").cloneNode(true);
			dropDiv.setAttribute("id", "drop" + dropCode);
			imageElement = dropDiv.getElementsByClassName("drop-thumbnail")[0];
			imageElement.setAttribute("src", dropInfo.thumbnail);
			titleElement = dropDiv.getElementsByClassName("drop-title")[0];
			titleElement.innerHTML = "Drop title placeholder";
			dateElement = dropDiv.getElementsByClassName("added-date")[0];
			dateElement.innerHTML = "Added " + formatDate(dates[i]);
			linkElement = dropDiv.getElementsByClassName("drop-link")[0];
			linkElement.setAttribute("href", urls[i]);
			coverLinkElement = dropDiv.getElementsByClassName("drop-cover")[0];
			if(dropInfo.type == 'i') {
				coverLinkElement.setAttribute("data-droplr-card", res[2].id);
				coverLinkElement.setAttribute("data-droplr-drop", urls[i])
				coverLinkElement.setAttribute("style", "");
				dropDiv.getElementsByClassName("fa-window-maximize")[0].setAttribute("style", "margin-left: 10px;");
				if(res[2].cover == null) {
					makeCardCoverEventListener(coverLinkElement);
				} else if(!dropCoverLookup.has(dropCode)) {
					makeCardCoverEventListener(coverLinkElement);
				} else if(res[2].cover.id != dropCoverLookup.get(dropCode).id) {
					makeCardCoverEventListener(coverLinkElement);
				} else {
					coverLinkElement.innerHTML = 'Remove Cover';
					coverLinkElement.addEventListener('click', function() {
						var card = this.getAttribute("data-droplr-card");
						clearCardCover(card)
						.then(function() {
							refreshDroplrSection();
						});
					});
				}
			} else {
				// Drops that aren't images don't have a cover option
			}

			copyLinkElement = dropDiv.getElementsByClassName("copy-drop-link")[0];
			copyLinkElement.setAttribute("value", urls[i]);
			copyLinkElement.setAttribute("id", "textbox-" + dropCode);
			copyLinkButtonElement = dropDiv.getElementsByClassName("copy-drop-link-button")[0];
			copyLinkButtonElement.setAttribute("data-clipboard-target", "#" + "textbox-" + dropCode);
		
			allDropsDiv.appendChild(dropDiv);
			dropDiv.setAttribute("style", "");
		}
	}  
  })
  .then(function(){
    return t.sizeTo('#content');
  })
  .catch(function(reason) {
	  console.log(reason);
  });
}

t.render(refreshDroplrSection);
