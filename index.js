var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy'),
    musicApi = require('./lib/api'),
    fs = require("fs"),
    fuse = require('fuse.js');

argv = require("optimist")
    .usage('Move all the songs you like in xiami to netease music.\nUsage: node index.js')
    .demand(['u', 'a', 'p'])
    .options('u', {
        alias: 'uid',
        describe: 'Xiami user id'
    })
    .options('a', {
        alias: 'account',
        describe: 'Netease music logging account '
    })
    .options('p', {
            alias: 'pwd',
            describe: 'Netease music logging password'
        }
    )
    .options('x', {
        alias: 'xjson',
        default: 'xiami.json',
        describe: 'Save the crawling songs you like in xiami to a json file'
    })
    .options('c',{
        alias: 'cellphone',
        describe: 'Signing method in Netease music. Using Netease music\'s account to sign in by default.'
    })
    .argv;

var ep = new eventproxy(),
    userId = argv.u,
    // userId = 10651177,
    // userId = 34037693,
    userStarUrl = "http://www.xiami.com/space/lib-song/u/" + userId, // Songs collection's url in Xiami
    starPageNums = 1, // Total number of songs collection's pages in Xiami
    songCounts = 0, // Total number of songs collection in Xiami
    pageUrls = [], // Songs collection page's urls which is will be crawled in Xiami
    songInfos = []; // Songs' information: {name: songName, singer: singerName, id: songId}


let xiamiJSON = argv.x;

if (fs.existsSync(xiamiJSON)) {
    fs.readFile(xiamiJSON, function (err, content) {
        if (err) {
            console.log(`Error: can not read ${xiamiJSON}`);
            return;
        }
        songInfos = JSON.parse(content);
        ep.emit("xiamiDataDone", songInfos);
    });

} else {
    superagent.get(userStarUrl)
        .end(function (err, pres) {
            // Get the total number of songs you like in Xiami
            var $ = cheerio.load(pres.text);
            songCounts = parseInt($('#column695 .counts')[0].children[0].data);
            console.log("Total number of songs collection: ", songCounts);
            starPageNums = Math.ceil(songCounts / 25); // The maximum songs collection per page.

            // Push urls which is will be crawled in pageUrls
            for (var i = 1; i <= starPageNums; i++) {
                pageUrls.push('http://www.xiami.com/space/lib-song/u/' + userId + '/page/' + i);
            }

            // Round polling each information of song after asynchronously query each url of pageUrls.
            pageUrls.forEach(function (pageUrl) {
                superagent.get(pageUrl)
                    .end(function (err, pres) {
                        if (err) {
                            console.log("Error fetching xiami page: ", pageUrl);
                            console.log(err);
                            throw(err);
                        }
                        var $ = cheerio.load(pres.text),
                            curSongs = $('.song_name'),
                            length = curSongs.length;
                        console.log(`Got ${length} songs in ${pageUrl}`);

                        for (var i = 0; i < length; i++) {
                            var curSongLink = curSongs.eq(i),
                                curSongInfo = {};

                            curSongInfo.song = curSongLink.find('a').eq(0).attr('title');
                            curSongInfo.singer = curSongLink.find('.artist_name').eq(0).attr('title');
                            songInfos.push(curSongInfo);
                        }
                        ep.emit('songPageDone');
                    });
            });

            ep.after('songPageDone', starPageNums, function () {
                // The below even which is emited when all the evens('songPageDone') have been done.
                let jsonPath = argv.x;
                jsonPath = jsonPath || "xiami.json";
                fs.writeFile(jsonPath, JSON.stringify(songInfos), 'utf8', () => {
                    ep.emit("xiamiDataDone", songInfos)
                });
            });


        })
}

ep.on("xiamiDataDone", function (songs) {
    let curCount = 0; // The number of concurrence
    var reptileMove = function (songInfo, callback) {
        // Set the delay time
        var delay = parseInt((Math.random() * 30000000) % 1000, 10);
        curCount++;
        console.log('Concurrence:', curCount, ', searching the song: ', songInfo.song, ', singer: ', songInfo.singer, ', delay: ' + delay + ' ms');

        searchInNCM(songInfo, () => {
            setTimeout(function () {
                curCount--;
                callback(null, songInfo.song + 'Call back content');
            }, delay);
        });
    };

    // 使用async控制异步抓取
    // /**/mapLimit(coll, limit, iteratee, [callback])
    // 异步回调
    // @param coll - A collection to iterate over
    // @param limit - The maximum number of async operations at a time
    // @param iteratee - AsyncFunction - An async function to apply to each item in coll. The iteratee should complete with the transformed item. Invoked with (item, callback).
    // @param callback - A callback which is called when all iteratee functions have finished, or an error occurs. Results is an array of the transformed items from the coll. Invoked with (err, results).
    async.mapLimit(songInfos, 5, function (songInfo, callback) {
        reptileMove(songInfo, callback);
    }, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            likeNCM(songInfos, () => {
                console.log("ok");
            });
        }

    });
});

function searchInNCM(songInfo, callback) {
    var keywords = songInfo.song + " " + songInfo.singer;
    var option = {s: keywords};

    musicApi.search(option, function (err, res) {
        if (err) {
            console.log(`Netease search err: ${err}`);
        } else {
            if (!res.result.songs || res.result.songs.length == 0) {
                console.log(`Netease return empty result for ${keywords}`);
                if (callback) callback();
                return;
            }
            var curSearchResult = res.result.songs;
            // fuse match
            var options = {
                shouldSort: false,
                threshold: 0.2,
                minMatchCharLength: 2,
                keys: [
                    "artists.name"
                ]
            };
            var fuseInstance = new fuse(curSearchResult, options);
            var fuseMatch = fuseInstance.search(songInfo.singer);
            if (fuseMatch.length != 0) {
                songInfo.id = fuseMatch[0].id;
            }
            if (callback) callback();
        }
    })
}

function likeNCM(songInfoWithId, cb) {
    if (!songInfoWithId || songInfoWithId.length == 0) {
        if (cb) cb();
        return;
    }

    var errSongs = []; // 405 song

    var loginOption = {
        account: argv.a,
        password: argv.p,
        method: (argv.c ? true : false)
    }

    var warnings = [];

    musicApi.login(loginOption, function (err, res) {
        if (err) {
            console.log(`Netease login error: ${err}`);
            return;
        }

        if (typeof res.cookie == 'undefined'){
            console.log(`Error: cannot login in. Please check out your logging data.`)
            return;
        }

        var count = 0;
        var reptileMove = function (songInfo, callback) {
            // Set the delay time randomly. Each of them should not too short(< 1s), limited for requesting frequently by Netease music otherwise.
            var delay = parseInt((Math.random() * 30000000) % 10000, 10);
            if (typeof songInfo.id !== 'undefined') {
                musicApi.likeSong(songInfo.id, function (err, res) {
                    if (err) {
                        var warning = {};
                        warning.song = songInfo.song;
                        warning.singer = songInfo.singer;
                        warning.err = `Can find out this song but cannot be collected: ${err}`;
                        warnings.push(warning);
                        errSongs.push(songInfo);
                        return;
                    } else {
                        if (res.code == 405) {
                            errSongs.push(songInfo);
                        }
                        count++;
                        console.log(`${count}: ${songInfo.song} - ${res.code} - delay; ${delay} ms`);
                    }
                });
            } else {
                var warning = {};
                warning.song = songInfo.song;
                warning.singer = songInfo.singer;
                warning.err = "Cannot find this song in Netease music or search manually.";
                warnings.push(warning);
            }

            setTimeout(function () {
                callback(null, songInfo.song + 'Call back content');
            }, delay);
        };

        // Collecting each song in Netease music from the crawled result asynchronously.
        async.mapLimit(songInfoWithId, 5, function (songInfo, callback) {
            reptileMove(songInfo, callback);
        }, function (err) {
            if (err) {
                console.log(err);
            } else {
                likeNCM(errSongs, () => {
                    console.log(warnings);
                    console.log('\n Finish!');
                    if (cb) cb();
                });
            }
        });
    })
}
