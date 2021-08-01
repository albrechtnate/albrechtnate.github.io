var spotifyAccessToken;

var currentSong;

var getCurrentTrack = function () {
	$.get( 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=albrechtnate&api_key=REDACTED&format=json&limit=1', function (data) {
		
		if (typeof data.recenttracks.track[0]["@attr"] != "undefined") {

			artist = data.recenttracks.track[0].artist["#text"];
			track = data.recenttracks.track[0].name;
			album = data.recenttracks.track[0].album["#text"];
			artwork = data.recenttracks.track[0].image[3]["#text"];

			if (isNewSong(track, artist, album)) {
				updateMarkup(track, artist, album, artwork);
				songSearchSpotify(track, artist, album);
			}

		}
		else {
			updateMarkup(false);
			$('#preview_link').text('');
			$('#player')[0].pause();
			$('#player source').attr("src", '');
			$('#player')[0].load();
			currentSong = null;
			loadSpotifyPlayer(false);
		}
	});
};

function isNewSong(track, artist, album) {
	if (track + artist + album !== currentSong) {
		currentSong = track + artist + album;
		return true;
	}
	else {
		return false;
	}
}

function songSearchSpotify (track, artist, album) {
	if (spotifyAccessToken) {
		var spotifyTrack = track.split(' ').join('+');
		var spotifyArtist = artist.split(' ').join('+');
    var spotifyAlbum = album.split(' ').join('+');
		$.ajax({
			url: 'https://api.spotify.com/v1/search?q=track:' + spotifyTrack + '+artist:' + spotifyArtist + '&type=track&limit=1',
			type: 'GET',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', 'Bearer ' + spotifyAccessToken);
			},
			data: {},
			success: function (data) {
        if (data.tracks.items[0].preview_url !== undefined) {
          playPreview(data.tracks.items[0].preview_url);
        }
				$('#preview_link').text(data.tracks.items[0].preview_url);
				$('#preview_link').attr('href', data.tracks.items[0].preview_url);
				loadSpotifyPlayer(data.tracks.items[0].id);
			},
			error: function (xhr, ajaxOptions, thrownError) {
				if (xhr.status === 401) {
					getAccessToken();
				}
			},
		});
	}
	else {
		getAccessToken(function () {
			songSearchSpotify(track, artist, album);
		});
	}
}

function getAccessToken(cb) {
	$.ajax({
		url: 'https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token',
		type: 'POST',
		beforeSend: function (xhr) {
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.setRequestHeader('Authorization', 'REDACTED');
		},
		data: {
			grant_type: 'refresh_token',
			refresh_token: 'REDACTED',
		},
		success: function (data) {
			spotifyAccessToken = data.access_token;
			cb()
		},
		error: function () {},
	});
}

function updateMarkup (track, artist, album, artwork) {
	if (track) {
		$("#artwork").attr("src", artwork);
		$("#track").html('<ul><li>' + track + '</li><li>' + artist + '</li><li>' + album + '</li><ul>');
		$("#currently_playing").fadeIn("slow");
	}
	else {
		$("#artwork").attr("src", '');
		$("#track").html('Nothing currently playing');
		$("#currently_playing").fadeIn("slow");
	}
}

function loadSpotifyPlayer (songId) {
	var spotifyPlayer = document.getElementById('spotify_player');
	if (songId) {
		spotifyPlayer.src = 'https://open.spotify.com/embed/track/' + songId;
		spotifyPlayer.style.display = "block";
	}
	else {
		spotifyPlayer.style.display = "none";
	}
}

function playPreview (preview_url) {
	$('#player source').attr("src", preview_url);
	$('#player')[0].pause();
	$('#player')[0].load();
	// var audio = new Audio(preview_url);
	// audio.play();
}

getCurrentTrack();
setInterval(getCurrentTrack, 30 * 1000);