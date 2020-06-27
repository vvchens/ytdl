const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg');
const process = require('process');
const path = require('path');
// ytdl('http://www.youtube.com/watch?v=A02s8omM_hI')
//   .pipe(fs.createWriteStream('video.flv'));
//   ytdl('https://www.youtube.com/watch?v=cOBQgUZnceg', {
//       quality:'highestaudio' })
// //   filter:(format) => format.container === 'mp4' })
//   .pipe(fs.createWriteStream('shuo.mp3')).once('close', () => {
//       console.log('done')
//   });
// var a=0;



const LOCALBASEPATH = './'
const REMOTEBASEPATH = ''

function downloadByYTDL(url, callback = () => {}) {
    const options = {
        quality:'highestaudio'
    };
    console.log("starting with " + url)
    ytdl.getInfo(url, options, (err, info) => {
        if (!err) {
            let filename = info.title;
            let fullpath = path.join(LOCALBASEPATH, 'raw', filename + ".raw");
            ytdl.downloadFromInfo(info, options)
            .pipe(fs.createWriteStream(fullpath))
            .once('close', () => {
                console.log("downloaded " + url)
                callback(fullpath);
            })
        } else {
            callback();
        }
    })
}
function convertToMP3(file, callback = ()=>{}) {
    let src = file;
    let desc = path.join(LOCALBASEPATH, 'mp3', path.parse(file).name + ".mp3");
    try {
        console.log("converting :" + file)
        var process = new ffmpeg(src);
        process.then(function (video) {
            // Callback mode
            video.fnExtractSoundToMP3(desc, function (error, file) {
                if (!error) {
                    console.log('Audio file: ' + file);
                    callback(file);
                } else {
                    console.error(error)
                    callback();
                }
            });
        }, function (err) {
            console.log('Error: ' + err);
            callback();
        });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
        callback();
    }
}
// convertToMP3("20130315【我是歌手】辛曉琪 《親愛的小孩》.mp4")
let link = process.argv[2] == 'debug' ? "https://www.youtube.com/watch?v=yPSa1Sa8V3M" : process.argv[2];

// downloadByYTDL(link, (file) => {
//     convertToMP3(file, (music) => {
//         if (music) {
//             fs.unlink(file);
//         }
//     });
// });


function startServer(port = 8889) {
    const http = require('http');
    const server = http.createServer((request, response) => {
        let argvs = request.url.match(/^\/music(\/([^?]*))?/);
        if (argvs) {
            let music = argvs[2];
            switch (request.method.toUpperCase()) {
                case "GET":
                {
                    if (music) {
                        let index = music.match(/^\d+$/);
                        response.setHeader("content-type", "audio/mpeg");
                        let file;
                        if (index) {
                            file = getMusic(getMusicList()[index[0]]); 
                        } else {
                            file = getMusic(decodeURIComponent(music));
                        }
                        if (file) {
                            response.setHeader('content-length', file.byteLength);
                            response.write(file);
                        }
                    } else {
                        response.setHeader("contentType", 'application/json; charset=utf-8');
                        response.write('<html><head><meta charset="UTF-8"><body>');
                        response.write(getMusicList().map(music => `<a href="/music/${music}">${music}</a>`).join("<br />"));
                        response.write('</body></html>');
                    }
                    response.end();
                    break;
                }
                case "POST":
                {
                    let link = '';
                    request.on('data', (data) => {
                        link += data;
                    });
                    request.on('end', () => {
                        downloadByYTDL(link, (file) => {
                            if (!file) {
                                response.end("download error");
                                return;
                            }
                            convertToMP3(file, (music) => {
                                if (music) {
                                    fs.unlinkSync(file);
                                    response.write(path.basename(music).replace(/'$/, ''));
                                }
                                response.end();
                            });
                        });
                    });
                    break;
                }
                default:
                {
                    response.end();
                }
            }
        } else {
            response.end();
        }
    });
    server.on('error', (error) => {
        console.debug(error);
    });
    server.on('connection', (socket) => {
        console.log('new connection');
    })
    server.listen(port);
}

function getMusicList() {
    return fs.readdirSync(path.join(LOCALBASEPATH, 'mp3'));
}
function getMusic(name) {
    let fullpath = path.join(LOCALBASEPATH, 'mp3', name);
    if (fs.existsSync(fullpath))
        return fs.readFileSync(fullpath);
    else
        return '';
}
function prepare() {
    fs.existsSync(path.join(LOCALBASEPATH, 'raw')) || fs.mkdirSync(path.join(LOCALBASEPATH, 'raw'));
    fs.existsSync(path.join(LOCALBASEPATH, 'mp3')) || fs.mkdirSync(path.join(LOCALBASEPATH, 'mp3'));
}
prepare();
startServer();
