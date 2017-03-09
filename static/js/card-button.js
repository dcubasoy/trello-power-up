var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var dropLinkSelector = document.getElementById('drop-link');

t.render(function(){
  return t.sizeTo('#content');
});

var errorAlertElement = document.getElementById('errorAlert');
var errorMessageElement = document.getElementById('errorMessage');
var errorCloseElement = document.getElementById('errorClose');
errorCloseElement.addEventListener('click',
	function () {
		errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable collapse");
		t.sizeTo('#content');
	}
);

var attachWithCover = function(dropLink, token) {
	var dropInfo = formatDropUrl(null, dropLink);
  var embedInfo = {};
  var dropTitle = dropLink;
  Trello.setToken(token);

  return getEmbedInfo(dropLink)
  .then(function(rawData) {
    embedInfo = JSON.parse(rawData);
    if(embedInfo.hasOwnProperty("title")) {
      dropTitle = embedInfo.title;
    }

    return t.card('id', 'cover');
  })
	.then(function(card) {
		return new Promise.all([
			Trello.post('/cards/' + card.id + '/attachments', {url: dropLink, name: dropTitle}),
			Trello.post('/cards/' + card.id + '/attachments', {url: dropInfo.fullsize, name: 'Cover image for drop ' + dropInfo.code}),
			card.id
		])
	})
	.then(function(results) {
		return new Promise.all([
			Trello.put('/cards/' + results[2] + '/idAttachmentCover', {value: results[1].id})
		])
	})
}

var accessRequired = function() {
	return Promise.reject("Link your Trello account to Droplr to use drops as card covers.");
}

document.getElementById('make-cover').addEventListener('click', function(){
	var dropLink = dropLinkSelector.value;
	var validDropLink = test_drop_regex.test(dropLink);
	if(validDropLink) {
		var btn = $(this);
		btn.button('loading');

		return Promise.all([
				t.get('organization', 'private', 'token'),
				t.get('board', 'private', 'token')
		])
		.spread(function(orgToken, boardToken){
			if(orgToken) {
				return attachWithCover(dropLink, orgToken);
			} else if(boardToken) {
				return attachWithCover(dropLink, boardToken);
			} else {
				return accessRequired();
			}
		})
		 .then(function(){
			btn.button('reset');
			t.closePopup();
		})
		.catch(function(reason) {
			btn.button('reset');
			if(typeof reason === "string") {
				errorMessageElement.innerHTML = reason;
			} else {
				errorMessageElement.innerHTML = "Something went wrong"
			}
			errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
			t.sizeTo('#content');
		});
	}
})

document.getElementById('attach').addEventListener('click', function(){
	var dropLink = dropLinkSelector.value;
	var validDropLink = test_drop_regex.test(dropLink);
	if(validDropLink) {
		var btn = $(this);
		btn.button('loading');
		var dropInfo = formatDropUrl(null, dropLink);
		var dropTitle = dropLink;
		return getEmbedInfo(dropLink)
		.then(function(rawData) {
      var embedInfo = JSON.parse(rawData);
			if(embedInfo.hasOwnProperty("title")) {
				dropTitle = embedInfo.title;
			}

			return t.attach({url: dropLink, name: dropTitle});
		})
		.then(function(){
			btn.button('reset');
			t.closePopup();
		})
		.catch(function(reason) {
			btn.button('reset');
			if(typeof reason === "string") {
				errorMessageElement.innerHTML = reason;
			} else {
				errorMessageElement.innerHTML = "Something went wrong"
			}
			errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
			t.sizeTo('#content');
		});
	}
})
