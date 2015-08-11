var module = angular.module('app', []);

module.constant('Constants', {
	INSTAGRAM_URL : "https://api.instagram.com/v1/media/search",
	INSTAGRAM_CLIENT_ID : "1bd5ad6996094f16aaef5982beeac07c",
	INSTAGRAM_TIMEOUT : 10000
});

module.factory('Model', function () {
    return {
		tags: '',
		radius: 1,
		posts: [],
		error: {
			enabled: false,
			message: '',
			prefix: ''
		}
	};
});

module.controller('InstamapsController', function($scope, $http, Model, Constants) {
	$scope.map = null;
	$scope.lastMarker = null;
	$scope.model = Model;
		
	$scope.initialize = function() {
		var mapOptions = { center: { lat: -22.909, lng: -47.0626}, zoom: 8 };
		$scope.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		google.maps.event.addDomListener($scope.map, 'click', $scope.addMarker);
	}
	
	$scope.addMarker = function(event) {
		if($scope.lastMarker) $scope.lastMarker.setMap(null);
			
		var latLng = {lat: event.latLng.G, lng: event.latLng.K}
		var mapOptions = { center: latLng, zoom: 8 };
		$scope.lastMarker = new google.maps.Marker({
			position: latLng, 
			map: $scope.map
		});
		
		$scope.model.latLng = latLng;		
		$scope.map.panTo(latLng);
		
		//necessário para atualizar o contexto do angularjs
		$scope.$apply();
	}
	
	$scope.searchPosts = function() {
		if(!$scope.model.latLng) {
			$scope.showError("Obrigatório um escolher ponto!", "Erro de validação: ");
			return;
		}		
		waitingDialog.show("Buscando registros do Instagram...");
		$http.jsonp(Constants.INSTAGRAM_URL + "?callback=JSON_CALLBACK", {
			headers: {
				'Content-Type': 'xml',
				'Authorization' : 'OAuth oauth_consumer_key="ZecuEql8VjfO8JR8UgqijrdFx", oauth_nonce="55145af3c262e516b04a278b52f7eae6", oauth_signature="5WBQzEXr7OUMw9SIitykTtscEy0%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1439257709", oauth_token="177197255-UIfvD8I7aA3OPwTjIWvgISlVfhxUGoGWGrVhRlQa", oauth_version="1.0"'
			},
			timeout: Constants.INSTAGRAM_TIMEOUT,
			params: {
				client_id : Constants.INSTAGRAM_CLIENT_ID,
				lat : $scope.model.latLng.lat,
				lng : $scope.model.latLng.lng,
				distance : $scope.model.radius * 1000,
				count: 100
			}			
		}).success(function(response) {
				waitingDialog.hide();
				$scope.showHashtags(response.data);
		}).error(function(response) {
				waitingDialog.hide();
				$scope.showError("Falha no acesso.", "Erro de Conexão: ");
		});
	}
	
	$scope.showHashtags = function(posts) {
		if(Model.tags.trim().length > 0) {
			var filteredPosts = [];
			var tags = Model.tags.toLowerCase().split(" ");
			
			posts.forEach(function(p) {
				var contains = false;
				p.tags.forEach(function(tag) {
					if(tags.indexOf(tag) >= 0) contains = true;
				});
				if(contains) filteredPosts.push(p);
			});
			$scope.model.posts = filteredPosts;
			
		} else {
			$scope.model.posts = posts;
		}
		
		$scope.$apply();
		
		if($scope.model.posts.length == 0) {
			$scope.showError("Nenhum resultado encontrado.", "Busca: ");
		} else {
			$scope.clearError();
			$('#resultModal').modal("show");
		}
	}
	
	$scope.showError = function(error, prefix) {
		$scope.model.error.enabled = true;
		$scope.model.error.prefix = prefix;
		$scope.model.error.message = error;
		$scope.$apply();
	}
	
	$scope.clearError = function() {
		$scope.model.error.enabled = false;
		$scope.model.error.prefix = '';
		$scope.model.error.message = '';
		$scope.$apply();
	}
	
	google.maps.event.addDomListener(window, 'load', $scope.initialize);
});

module.controller('ResultController', function($scope, Model) {
	$scope.getResults = function() {	
		return Model.posts;
	}
});