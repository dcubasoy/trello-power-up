/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var t = TrelloPowerUp.iframe();
var trelloApiKey = "d4555b9abf43f890715d5a12c07dea09";
var authReturnUrl = "https://power-up.droplr.com/confirm-auth.html"

// you can access arguments passed to your iframe like so
var arg = t.arg('arg');

var Promise = TrelloPowerUp.Promise;
var urls = [];
var dates = [];
var titles = [];
var dropCount = 0;
var i, dropDiv, imageElement, titleElement, dateElement, linkElement, copyLinkElement;
var coverLinkElement, copyLinkButtonElement, dropCode, dropInfo;
var dropInfoLookup = new Map();
var dropCoverLookup = new Map();

var oauthUrl = "https://trello.com/1/authorize?expiration=never" +
  "&name=Droplr&scope=read,write&key=" + trelloApiKey + "&callback_method=popup" +
  "&return_url=" + authReturnUrl;

var tokenLooksValid = function(token) {
  return /^[0-9a-f]{64}$/.test(token);
}

var authorizeOpts = {
  height: 680,
  width: 580,
  validToken: tokenLooksValid
};

var authBtn = document.getElementById('authorize');
authBtn.addEventListener('click', function() {
  t.authorize(oauthUrl, authorizeOpts)
  .then(function(token) {
	return t.set('organization', 'private', 'token', token)
	.catch(t.NotHandled, function() {
	// fall back to storing at board level
		return t.set('board', 'private', 'token', token)
	});
  })
  .then(function() {
    t.render(refreshDroplrSection);
  })
  .catch(function(reason) {
	  console.log("Failed to authorize. Reason:\n" + JSON.stringify(reason));
  });
});

var allDropsDiv = document.getElementById('droplrdrops');
var detailRowTemplate = document.getElementById("detail-row-template")

var errorAlertElement = document.getElementById('errorAlert');
var errorCloseElement = document.getElementById('errorClose');
errorCloseElement.addEventListener('click',
	function () {
		errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable collapse");
		t.sizeTo('#content');
	}
);

var isDropLink = function(attachment) {
	//return test_drop_regex.test(attachment.url);
	return isClaimed(attachment.url);
}

var isDropCoverImage = function(attachment) {
	return test_drop_cover_image_regex.test(attachment.name) || test_drop_cover_image_regex2.test(attachment.name);
}

var isDropCandidate = function(attachment) {
	return couldBeDrop(attachment.url);
}

// Sets the card cover to an image associated with a drop
// card - ID for a Trello card entity
// drop - Short code for a drop link
var setCardCover = function (card, drop) {
	// Card covers show an image on the "front" of a Trello card. Card covers
	// can only be set through the Trello API. At the time of this writing
	// (Feb 2017) Trello only allows image attachments to be used as covers.
	// This is because the preview fields in the card record are only
	// populated during the image upload process.

	// We need to account for two scenarios when setting the cover image.
	// 1. A drop already has a cover in the attachments. In this case we just
	//    set the cover to the correct attachment ID.
	// 2. A drop does not have a cover in the attachments yet. In this case
	//    we create the image attachment on behalf of the user and set the
	//    cover to the newly created attachment.
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

// Clears a cover image associated with a card
// card - ID for a Trello card entity
var clearCardCover = function (card) {
	// The card cover can only be set through the Trello API
	// Setting the idAttachmentCover for a card to an empty string clears the cover
	return new Promise.all([
		Trello.put('/cards/' + card + '/idAttachmentCover', {value: ""} )
	])
	.catch(function(reason) {
		console.log("The clear cover operation failed");
		console.log("Details: \n" + JSON.stringify(reason, null, 4));
	});
}

var authorizeCardCoverEventListener = function (domElement) {
	domElement.addEventListener('click', function() {
		errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
		t.sizeTo('#content');
		t.popup({
			title: 'Get More Droplr Features',
			url: 'authorize.html',
			height: 140,
		});
	});

}

// Attatch click event handlers to update the cover image
// We take advantage of data-* attributes for this purpose
var makeCardCoverEventListener = function (domElement) {
	domElement.addEventListener('click', function() {
		var btn = $(this);
		btn.button('loading');
		var card = this.getAttribute("data-droplr-card");
		var drop = this.getAttribute("data-droplr-drop");
		setCardCover(card, drop)
		.then(function() {
			refreshDroplrSection();
		});
	});
}

// Attatch click event handlers to remove the cover image
// We take advantage of data-* attributes for this purpose
var removeCardCoverEventListener = function (domElement) {
	domElement.addEventListener('click', function() {
		var card = this.getAttribute("data-droplr-card");
		clearCardCover(card)
		.then(function() {
			refreshDroplrSection();
		});
	});
}

var formatDate = function(date) {
	var day = date.getDate();
	var hours = date.getHours();
	var minutes = date.getMinutes();
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

var newEnhancedRow = function(url, title, card, cover) {
	dropInfo = dropInfoLookup.get(url);
	if(dropInfo != null) {
		dropCode = dropInfo.code
		dropDiv = detailRowTemplate.cloneNode(true);
		dropDiv.setAttribute("id", "drop" + dropCode);
		imageElement = dropDiv.getElementsByClassName("drop-thumbnail")[0];
		imageElement.setAttribute("src", dropInfo.thumbnail);
		titleElement = dropDiv.getElementsByClassName("drop-title")[0];
		titleElement.innerHTML = title;
		dateElement = dropDiv.getElementsByClassName("added-date")[0];
		dateElement.innerHTML = "Added " + formatDate(dates[i]);
		linkElement = dropDiv.getElementsByClassName("drop-link")[0];
		linkElement.setAttribute("href", url);
		coverLinkElement = dropDiv.getElementsByClassName("drop-cover")[0];
		if(dropInfo.type == 'i') {
			coverLinkElement.setAttribute("data-droplr-card", card);
			coverLinkElement.setAttribute("data-droplr-drop", url);
			coverLinkElement.setAttribute("style", "");
			dropDiv.getElementsByClassName("fa-window-maximize")[0].setAttribute("style", "margin-left: 10px;");
			if(cover == null) {
				// The card does not currently have a cover
				makeCardCoverEventListener(coverLinkElement);
			} else if(!dropCoverLookup.has(dropCode)) {
				// There is no cover associated with this drop so it can't be the cover
				makeCardCoverEventListener(coverLinkElement);
			} else if(cover.id != dropCoverLookup.get(dropCode).id) {
				// The card has a cover and the drop has a cover but they don't match
				makeCardCoverEventListener(coverLinkElement);
			} else {
				// The card's cover is this drop's cover
				coverLinkElement.innerHTML = 'Remove Cover';
				removeCardCoverEventListener(coverLinkElement);
			}
		} else {
			// Drops that aren't images don't have a cover option
		}

		copyLinkElement = dropDiv.getElementsByClassName("copy-drop-link")[0];
		copyLinkElement.setAttribute("value", url);
		copyLinkElement.setAttribute("id", "textbox-" + dropCode);
		copyLinkButtonElement = dropDiv.getElementsByClassName("copy-drop-link-button")[0];
		copyLinkButtonElement.setAttribute("data-clipboard-target", "#" + "textbox-" + dropCode);
		return dropDiv;
	} else {
		return null;
	}
}

var newBasicRow = function(url, title) {
	dropInfo = dropInfoLookup.get(url);
	if(dropInfo != null) {
		dropCode = dropInfo.code
		dropDiv = detailRowTemplate.cloneNode(true);
		dropDiv.setAttribute("id", dropCode);
		imageElement = dropDiv.getElementsByClassName("drop-thumbnail")[0];
		imageElement.setAttribute("src", dropInfo.thumbnail);
		titleElement = dropDiv.getElementsByClassName("drop-title")[0];
		titleElement.innerHTML = title;
		dateElement = dropDiv.getElementsByClassName("added-date")[0];
		dateElement.setAttribute("style", "display: none;");
		linkElement = dropDiv.getElementsByClassName("drop-link")[0];
		linkElement.setAttribute("href", url);
		coverLinkElement = dropDiv.getElementsByClassName("drop-cover")[0];
		if(dropInfo.type == 'i') {
			coverLinkElement.setAttribute("style", "");
			dropDiv.getElementsByClassName("fa-window-maximize")[0].setAttribute("style", "margin-left: 10px;");
			authorizeCardCoverEventListener(coverLinkElement);
		} else {
			// Drops that aren't images don't have a cover option
		}
		copyLinkElement = dropDiv.getElementsByClassName("copy-drop-link")[0];
		copyLinkElement.setAttribute("value", url);
		copyLinkElement.setAttribute("id", "textbox-" + dropCode);
		copyLinkButtonElement = dropDiv.getElementsByClassName("copy-drop-link-button")[0];
		copyLinkButtonElement.setAttribute("data-clipboard-target", "#" + "textbox-" + dropCode);

		allDropsDiv.appendChild(dropDiv);
		dropDiv.setAttribute("style", "");
		return dropDiv;
	} else {
		return null;
	}
}

// This method is responsible for keeping drop info caches
// and cover image caches up to date. It is also responsible for displaying
// generating HTML to display the appropriate state of all drops.
var renderUsingTrelloAPI = function(token) {
	Trello.setToken(token);
	return t.card('id', 'cover')
	.then(function(card) {
		return Promise.all([
			Trello.get('/cards/' + card.id + '/attachments', {fields: "date,name,previews,url"}),
			card
		]);
	})
  .then(function(res) {
	  return Promise.all([
		res[0].filter(isDropCandidate),
		res[0].filter(isDropCoverImage),
		res[1]
	  ]);
  })
  .then(function(res) {
	// res[0] = All attachments that are drop links
	// res[1] - All attachments that are drop cover images
	// res[2] - DB record for this card

	urls = res[0].map(function(a){ return a.url; });
	dates = res[0].map(function(a){ return new Date(a.date); });
	titles = res[0].map(function(a){ return a.name; });

	// Map each the drop code of each cover image to the respective attachment record
	// We'll use this info later make decisions about cover image status
	dropCoverLookup.clear();
	for(i = 0; i < res[1].length; i++) {
		dropCode = extractDropCodeFromCover(null, res[1][i].name);
		if(dropCode != null) {
			dropCoverLookup.set(dropCode, res[1][i]);
		}
	}

	var newRow;
	dropCount = urls.length;
	allDropsDiv.innerHTML = '';
	for(i = 0; i < dropCount; i++ )
	{
		if(!dropInfoLookup.has(urls[i])) {
			formatDropUrl(null, urls[i])
			.then(function(result) {
				dropInfoLookup.set(urls[i], result);
				newRow = newEnhancedRow(urls[i], titles[i], res[2].id, res[2].cover);
				if(newRow != null) {
					allDropsDiv.appendChild(newRow);
					newRow.setAttribute("style", "");
				}
			});
		} else {
			newRow = newEnhancedRow(urls[i], titles[i], res[2].id, res[2].cover);
			if(newRow != null) {
				allDropsDiv.appendChild(newRow);
				newRow.setAttribute("style", "");
			}
		} 
	}
  })
  .then(function() {
	  t.sizeTo('#content');
  });
};

var renderUsingPowerUpApi = function() {
	return t.card('attachments')
	.then(function(card) {
	  return Promise.all([
		card.attachments.filter(isDropCandidate),
		card.attachments.filter(isDropCoverImage),
		card
	  ]);
	})
	.then(function(res){
		urls = res[0].map(function(a){ return a.url; });
		titles = res[0].map(function(a){ return a.name; });

		dropCount = urls.length;
		allDropsDiv.innerHTML = '';
		for(i = 0; i < dropCount; i++ )
		{
			if(!dropInfoLookup.has(urls[i])) {
				formatDropUrl(null, urls[i])
				.then(function(result) {
					dropInfoLookup.set(urls[i], result);
					newRow = newBasicRow(urls[i], titles[i]);
					if(newRow != null) {
						allDropsDiv.appendChild(newRow);
						newRow.setAttribute("style", "");
					}
				});
			} else {
				newRow = newBasicRow(urls[i], titles[i]);
				if(newRow != null) {
					allDropsDiv.appendChild(newRow);
					newRow.setAttribute("style", "");
				}
			}
		}
	})
	.then(function() {
		t.sizeTo('#content');
	});
};

// This method gets called each time a user adds or removes attachments to our
// attachment section.
var refreshDroplrSection = function(){
	return Promise.all([
			t.get('organization', 'private', 'token'),
			t.get('board', 'private', 'token')
	])
	.spread(function(orgToken, boardToken, claims){
		if(orgToken) {
			return renderUsingTrelloAPI(orgToken);
		} else if(boardToken) {
			return renderUsingTrelloAPI(boardToken);
		} else {
			return renderUsingPowerUpApi();
		}
	})
	.then(function(){
		return t.sizeTo('#content');
	})
	.catch(function(reason) {
		console.log(reason);
		return renderUsingPowerUpApi()
		.then(function() {
			return t.sizeTo('#content');
		})
	});
}

t.render(refreshDroplrSection);
