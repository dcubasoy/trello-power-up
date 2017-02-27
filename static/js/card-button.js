var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var dropLinkSelector = document.getElementById('drop-link');

t.render(function(){
  return t.sizeTo('#content');
});

document.getElementById('make-cover').addEventListener('click', function(){
	var dropLink = dropLinkSelector.value;
	var validDropLink = test_drop_regex.test(dropLink);
	if(validDropLink) {
		var dropInfo = formatDropUrl(null, dropLink);
		return t.get('organization', 'private', 'token')
		.then(function(token) {
			Trello.setToken(token);
			return t.card('id', 'cover') 
		})
		.then(function(card) {
			return new Promise.all([
				Trello.post('/cards/' + card.id + '/attachments', {url: dropLink, name: dropLink}),
				Trello.post('/cards/' + card.id + '/attachments', {url: dropInfo.fullsize, name: 'Cover image for drop ' + dropInfo.code}),
				card.id
			])
		})
		.then(function(results) {
			return new Promise.all([
				Trello.put('/cards/' + results[2] + '/idAttachmentCover', {value: results[1].id})
			])
		})
		 .then(function(){
			t.closePopup();
		})
		.catch(function(reason) {
			console.log("The set cover operation failed");
			console.log("Details: \n" + JSON.stringify(reason, null, 4));
		});
	}
})

document.getElementById('attach').addEventListener('click', function(){
	var dropLink = dropLinkSelector.value;
	var validDropLink = test_drop_regex.test(dropLink);
	if(validDropLink) {
		var dropInfo = formatDropUrl(null, dropLink);
		return t.get('organization', 'private', 'token')
		.then(function(token) {
			Trello.setToken(token);
			return t.card('id', 'cover') 
		})
		.then(function(card) {
			return new Promise.all([
				Trello.post('/cards/' + card.id + '/attachments', {url: dropLink, name: dropLink}),
			])
		})
		.then(function(){
			t.closePopup();
		})
		.catch(function(reason) {
			console.log("The set cover operation failed");
			console.log("Details: \n" + JSON.stringify(reason, null, 4));
		});
	}
})