var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();
var btn;

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

var accessRequired = function() {
	return t.popup({
			title: 'Get More Droplr Features',
			url: 'authorize.html',
			height: 140,
	});
}

var attachDrop = function (dropLink, btn) {
	return Promise.all([formatDropUrl(null, dropLink)])
	.then(function(results) {
		return t.attach({url: results[0].url, name: results[0].title});
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
};

var makeCover = function (dropLink, btn) {
	var dropInfo;
	return Promise.all([formatDropUrl(null, dropLink)])
	.then(function(results) {
		dropInfo = results[0];
		if(dropInfo) {
			return Promise.all([
				t.get('organization', 'private', 'token'),
				t.get('board', 'private', 'token')
			])
			.spread(function(orgToken, boardToken){
				if(orgToken || boardToken) {
					if(orgToken) {
						Trello.setToken(orgToken);
					} else {
						Trello.setToken(boardToken);
					}
					
					return t.card('id', 'cover')
					.then(function(card) {
						return new Promise.all([
							Trello.post('/cards/' + card.id + '/attachments', {url: dropInfo.url, name: dropInfo.title}),
							Trello.post('/cards/' + card.id + '/attachments', {url: dropInfo.fullsize, name: 'Cover image for drop ' + dropInfo.code}),
							Promise.resolve(card.id)
						])
					})
					.then(function(results) {
						return new Promise.all([
							Trello.put('/cards/' + results[2] + '/idAttachmentCover', {value: results[1].id})
						])
					})
					.then(function(){
						btn.button('reset');
						t.closePopup();
					});
				} else {
					btn.button('reset');
					return accessRequired();
				}
			})
		} else {
			return Promise.reject("Couldn't retrieve info for drop. Are you sure the link is an active drop?");
		}
	})
	.catch(function(reason) {
		btn.button('reset');
		if(typeof reason === "string") {
			errorMessageElement.innerHTML = reason;
			errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
			t.sizeTo('#content');
		} else {
			if(reason.hasOwnProperty("responseText") && reason.responseText == "invalid token") {
				accessRequired();
			} else {
				errorMessageElement.innerHTML = "Something went wrong";
				errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
				t.sizeTo('#content');
			}
		}
	});
}

document.getElementById('make-cover').addEventListener('click', function(){
	//dropLink = dropLinkSelector.value;
	btn = $(this);
	btn.button('loading');
	return makeCover(dropLinkSelector.value, btn);
	
})

document.getElementById('attach').addEventListener('click', function(){
	//dropLink = dropLinkSelector.value;
	btn = $(this);
	btn.button('loading');
	return attachDrop(dropLinkSelector.value, btn);
})
