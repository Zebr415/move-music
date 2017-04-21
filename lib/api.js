var request = require('superagent');
var Crypto = require('./crypto.js');
var config = require('./config.js');

function test(){
  login({
    username: 'phone',
    password: 'passwd'
  }, function(err, res){
    if(err){
      console.log(err);
    } else {
      console.log(res.data);
    }
  });
}

var Cookie = (function(){
  var cookie;
  function getCookie(){
    return cookie||'';
  }
  function setCookie(data){
    return cookie = data;
  }
  return {
    getCookie: getCookie,
    setCookie: setCookie
  }
})();

function login(options, callback){
  if(!options||!options.account||!options.password){
    if(callback) callback({
      err: '[param error]'
    });
    return;
  }

  var loginUrl = 'http://music.163.com/weapi/login';

  if(options.method){
    loginUrl = 'https://music.163.com/weapi/login/cellphone';
    var data = {
      "phone": options.account,
      "password": Crypto.MD5(options.password)
    }
  }else{
    var data = {
      "username": options.account,
      "password": Crypto.MD5(options.password)
    }
  }

  var body = Crypto.aesRsaEncrypt(JSON.stringify(data));
  request
      .post(loginUrl)
      .set(config.headers)
      .send(body)
      .end(function(err, res){
        var cookie = res.header['set-cookie'];
        Cookie.setCookie(cookie);
        if(callback) callback(null, {
          cookie: cookie,
          data: res.body
        })
      });
}

// 
function getPlaylist(options, callback){
  var o = options||{};
  request
    .post("http://music.163.com/api/user/playlist")
    .set(config.headers)
    .set('Cookie', Cookie.getCookie())
    .send({
      offset: o.offset||0,
      limit: o.limit,
      uid: o.uid||0
    })
    .end(function(err, res){
      var cookie = res.header['set-cookie'];
      Cookie.setCookie(cookie);
    });
}

// 获取歌曲信息
function getSongDetail(ids, callback){
  var single = !ids instanceof Array;
  var url = 'http://music.163.com/api/song/detail';
  request
    .get(url)
    .query({
      ids: ['[', single?(ids):(ids.join(',')), ']'].join('')
    })
    .end(function(err, res){
      if(err){
        console.log(`Get song detail error: ${err}`);
        if(callback) callback(err);
      } else {
        var data = JSON.parse(res.text);
        if(callback) callback(null, single?data.songs[0]:data.songs);
      }
    })
}

// 获取歌词
function getLyric(id, callback){
  var url = 'http://music.163.com/api/song/media';
  request
    .get(url)
    .query({
      id: id
    })
    .end(function(err, res){
      if(err){
        console.log(`Get lyric error: ${err}`);
        if(callback) callback(err);
      } else {
        var data = JSON.parse(res.text);
        // console.log(data);
        if(callback) callback(null, data);
      }
    })
}

// 获取歌曲url
function getPlayUrl(id){
  return ["http://m2.music.126.net/", _encode(id), "/", id, ".mp3"].join('');
}

// 获得背景图片url
function getImgUrl(id){
  return ["http://p3.music.126.net/", _encode(id), "/", id, ".jpg"].join('');
}

// 搜索建议 
function searchSuggest(){

}

// 搜索 单曲(1)，歌手(100)，专辑(10)，歌单(1000)，用户(1002) *(type)*
function search(options, callback){
  var o = options||{};
  if(!o.s){
    if(callback) callback('[param error]');
    return;
  }
  request
    .post('http://music.163.com/api/search/get')
    .set(config.headers)
    .send({
      s: o.s,
      type: o.type||1,
      offset: o.offset||0,
      total: o.total||true,
      limit: o.limit||60
    })
    .end(function(err, res){
      if(err){
        console.log(`Search error: ${err}`);
        if(callback) callback(err);
      } else {
        var data = JSON.parse(res.text);
        if (callback) callback(null, data);
      }
    })
}

// fucking magic
function _encode(id){
  var magic = _bytearray('3go8&$8*3*3h0k(2)2');
  var song_id = _bytearray(id.toString());
  var len = magic.length;
  for(var i=0;i<song_id.length;i++){
      song_id[i] = song_id[i] ^ magic[i % len]
  }
  song_id = _bytestring(song_id);
  return Crypto.MD564(song_id).replace(/\//g, "_").replace(/\+/g, "-");
}
function _bytearray(str){
  var res = [];
  for(var i=0;i<str.length;i++){
      res.push(str.substr(i,1).charCodeAt());
  }
  return res;
}
function _bytestring(array){
  var res = "";
  for(var x in array){
      res += String.fromCharCode(array[x]);
  }
  return res;
}


// 喜欢歌曲
function likeSong(id, callback){
  var url = 'http://music.163.com/api/radio/like';
  request
      .get(url)
      .set(config.headers)
      .set('Cookie', Cookie.getCookie())
      .query({
        like: true,
        trackId: id,
        alg: "itembased",
        time: 25
      })
      .end(function(err, res){
        if(err){
          if(callback) callback(err);
        } else {
          var data = JSON.parse(res.text);
          // console.log(data);
          if(callback) callback(null, data);
        }
      })
}

module.exports = {
  login: login,
  getPlaylist: getPlaylist,
  getSongDetail: getSongDetail,
  getPlayUrl: getPlayUrl,
  getImgUrl: getImgUrl,
  getLyric: getLyric,
  search: search,
  likeSong: likeSong,
}