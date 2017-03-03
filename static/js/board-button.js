var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var listids = []
var names = []

var dropLinkSelector = document.getElementById('drop-link');
var createCoverSelector = document.getElementById("cover");
var embedPreviewSelector = document.getElementById("embed");
var listsSelector = document.getElementById('insertIntoList');
var errorAlertElement = document.getElementById('errorAlert');
var errorMessageElement = document.getElementById('errorMessage');
var errorCloseElement = document.getElementById('errorClose');
errorCloseElement.addEventListener('click', 
	function () {
		errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable collapse");
		t.sizeTo('#content');
	}
);

var renderBoardButtonUsingTrelloAPI = function(token) {
	Trello.setToken(token);
	return t.board('id', 'name') 
	.then(function(board) {
		return Promise.all([
			Trello.get('/board/' + board.id + '/lists')
		]);
	})
	.then(function(res) {
		listids = res[0].map(function(a){ return a.id; });
		names = res[0].map(function(a){ return a.name });

		listsSelector.innerHTML = '';
		for(var i = 0; i < res[0].length; i++ ) 
		{
			listsSelector.options[listsSelector.options.length] = new Option(names[i], listids[i]);
		}
		return t.sizeTo('#content');
	});
};

var renderBoardButtonUsingPowerUpApi = function() {
	errorMessageElement.innerHTML = "Link your Trello account to Droplr to create cards from here";
	errorAlertElement.setAttribute("class", "alert alert-danger alert-dismissable");
	return t.sizeTo('#content');
}

t.render(function(){
  	return Promise.all([
			t.get('organization', 'private', 'token'),
			t.get('board', 'private', 'token')
	])
	.spread(function(orgToken, boardToken){
		if(orgToken) {
			return renderBoardButtonUsingTrelloAPI(orgToken);
		} else if(boardToken) {
			return renderBoardButtonUsingTrelloAPI(boardToken);
		} else {
			return renderBoardButtonUsingPowerUpApi();
		}
	})
	.then(function(){
		return t.sizeTo('#content');
	})
	.catch(function(reason) {
		console.log(reason);
	});
});

var createCardWithCover = function(list, description, dropInfo, token) {
	Trello.setToken(token); 
	return new Promise.all([
		Trello.post('/lists/' + list + '/cards', {name: dropInfo.url, desc: description}),
	])
	.then(function(res) {
		return new Promise.all([
			Trello.post('/cards/' + res[0].id + '/attachments', {url: dropInfo.url, name: dropInfo.url}),
			Trello.post('/cards/' + res[0].id + '/attachments', {url: dropInfo.fullsize, name: 'Cover image for drop ' + dropInfo.code}),
			res[0].id
		])
	})
	.then(function(results) {
		return new Promise.all([
			Trello.put('/cards/' + results[2] + '/idAttachmentCover', {value: results[1].id})
		])
	})
};

var createCard = function(list, description, dropInfo, token) {
	Trello.setToken(token); 
	return new Promise.all([
		Trello.post('/lists/' + list + '/cards', {name: dropInfo.url, desc: description}),
	])
	.then(function(res) {
		return new Promise.all([
			Trello.post('/cards/' + res[0].id + '/attachments', {url: dropInfo.url, name: dropInfo.url})
		])
	})
};

var accessRequired = function() {
	return Promise.reject("Link your Trello account to Droplr to create cards from here");
}

var notImplemented = function() {
	return Promise.reject("Not implemented yet.");
}

document.getElementById('create-card').addEventListener('click', function(){
	var dropLink = dropLinkSelector.value;
	var validDropLink = test_drop_regex.test(dropLink);
	var createCover = createCoverSelector.checked;
	var embedPreview = embedPreviewSelector.checked;
	var list = listsSelector.value;
	var description = "";
	if(validDropLink) {
		var btn = $(this);
		btn.button('loading');
		var dropInfo = formatDropUrl(null, dropLink);
		
		if(embedPreview) {
			description = '![' + dropLink + '](' + dropInfo.fullsize + ')'
		} else {
			description = dropLink.url;
		}
		
		return Promise.all([
				t.get('organization', 'private', 'token'),
				t.get('board', 'private', 'token')
		])
		.spread(function(orgToken, boardToken){
			//return accessRequired();
			if(orgToken) {
				if(createCover) {
					return createCardWithCover(list, description, dropInfo, orgToken);
				} else {
					return createCard(list, description, dropInfo, orgToken);
				}
			} else if(boardToken) {
				if(createCover) {
					return createCardWithCover(list, description, dropInfo, boardToken);
				} else {
					return createCard(list, description, dropInfo, boardToken);
				}
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