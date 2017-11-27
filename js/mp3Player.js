(function (exp, doc) {
    var Player = Player || {};

    Player = {
        'current': 0,
        'playlist': [],
        'audio': null,
        'wrapperId': 'jPlayer',
        'wrapper': null,
        'isplaying': false,
        'autoplay': true,
        'rotateId': null,
        'lrcs': [],
        'lrcp': [],
        'template': '<div id="jPlayer" class="jPlayer">'
                +   '    <!-- 进度条 开始 -->'
                +   '    <div class="progress">'
                +   '        <span class="before"></span>'
                +   '        <span class="after"></span>'
                +   '     </div>'
                +   '    <!-- 进度条 结束 -->'
                +   '    <!-- 播放器主体 开始 -->'
                +   '    <div class="playBody">'
                +   '        <span class="cover">'
                +   '            <img src="#">'
                +   '        </span>'
                +   '        <div class="control">'
                +   '            <div class="musicTag"><strong><!-- musicTitle --></strong>-<span class="artist"><!-- musicSinger --></span></div>'
                +   '            <div class="lrc"><!-- musicLRC... --></div>'
                +   '            <div class="menu">'
                +   '                <span class="timer"><!-- musicTimer --></span>'
                +   '                <div class="btnGroup">'
                +   '                    <span class="btn btn-pre iconfont icon-pre"></span>'
                +   '                    <span class="btn btn-play iconfont icon-play"></span>'
                +   '                    <span class="btn btn-next iconfont icon-next"></span>'
                +   '                </div>'
                +   '                <div class="option">'
                +   '                    <!-- <span class="btn btn-like iconfont icon-like"></span> -->'
                +   '                    <span class="btn btn-list iconfont icon-list"></span>'
                +   '                </div>'
                +   '            </div>'
                +   '        </div>'
                +   '    </div>'
                +   '    <!-- 播放器主体 结束 -->'
                +   '    <!-- 播放列表 开始 -->'
                +   '    <ol class="playlist">'
                +   '    </ol>'
                +   '    <!-- 播放列表 结束 -->'
                +   '</div>',

        'init': function(playlist, play) {
            doc.body.innerHTML += Player.template;
            Player.wrapper = $("#" + Player.wrapperId);
            // 传值
            undefined != playlist && (Player.playlist = playlist);
            var listHtml = '';
            for (var i = 0; i < Player.playlist.length; i++) {
                listHtml += '<li>' + '<strong>' + Player.playlist[i].title + '</strong><span class="artist">' + Player.playlist[i].artist + '<span></li>';
            }
            $('#jPlayer').find('ol.playlist').hide();
            $('#jPlayer').find('ol.playlist').html(listHtml);
            Player.bind();
            // 初始加载
            var isplay = false;
            undefined != play && (isplay = Boolean(play));
            Player.loadMusic(0, isplay);
        },

        // 初始化
        'loadMusic': function(i, play) {
            // 先清除
            Player.audio && $(Player.audio).remove() && Player.audio == null;
            Player.rotateId && clearInterval(Player.rotateId);

            Player.audio = doc.createElement('audio');
            Player.audio.id = 'jPlayer_Audio_' + Math.floor(Math.random() * 100000);
            // Player.audio.preload = 'preload';
            var songData = Player.playlist[i];

            // append source
            var sourceMp3 = null, sourceOgg = null, sourceWav = null;
            undefined != songData.mp3 && (sourceMp3 = doc.createElement('source')) && (sourceMp3.src = songData.mp3) && (sourceMp3.type = 'audio/mpeg') && (Player.audio.appendChild(sourceMp3));
            undefined != songData.ogg && (sourceOgg = doc.createElement('source')) && (sourceOgg.src = songData.ogg) && (sourceOgg.type = 'audio/ogg') && (Player.audio.appendChild(sourceOgg));
            undefined != songData.wav && (sourceWav = doc.createElement('source')) && (sourceWav.src = songData.wav) && (sourceWav.type = 'audio/wav') && (Player.audio.appendChild(sourceWav));

            doc.body.appendChild(Player.audio);

            Player.wrapper.find('.playBody .musicTag>strong').html(songData.title);
            Player.wrapper.find('.playBody .musicTag .artist').html(songData.artist);
            Player.wrapper.find('.playBody .cover img')[0].src = songData.cover;
            // 初始化歌词区
            Player.wrapper.find('.lrc').html('曲目：' + songData.title + ' 演唱：' + songData.artist).marquee();
            // 进度条
            Player.updateProgress(0);

            // true == play && Player.play();
            Player.audio.addEventListener('progress', Player.beforeLoad, false);
            Player.audio.addEventListener('durationchange', Player.beforeLoad, false);
            Player.audio.addEventListener('canplay', Player.afterLoad, false);
            Player.audio.addEventListener('ended', Player.ended, false);
            true == play && Player.audio.addEventListener('canplay', Player.play, false);
            true == play && Player.audio.addEventListener('canplaythrough', Player.play, false);

            $(Player.wrapper.find('.playlist li')[Player.current]).addClass('playing').siblings().removeClass('playing');
            Player.getLrc(i);
        },

        // 播放
        'play': function() {
            Player.audio.play();
            Player.isplaying = true;
            Player.rotateId = setInterval(Player.updateProgress, 500);
            // 配图动画播放
            Player.wrapper.find(".cover img").css("animation", "9.8s linear 0s normal none infinite rotate").css("animation-play-state", "running");
            // 按钮样式切换
            Player.wrapper.find('.btn-play').removeClass('icon-play').addClass('icon-pause');
        },

        'ended': function() {
            // // 直接播放
            Player.pause();
            Player.audio.currentTime = 0;
            Player.switch(++Player.current);
        },

        'beforeLoad': function() {
            var endVal = this.seekable && this.seekable.length ? this.seekable.end(0) : 0;
        },

        'afterLoad': function() {
            // if (autoplay == true) play();
        },

        // 暂停播放
        'pause': function() {
            Player.audio.pause();
            Player.isplaying = false;
            // 配图动画暂停
            Player.wrapper.find(".cover img").css("animation-play-state", "paused");
            // 按钮样式切换
            Player.wrapper.find('.btn-play').removeClass('icon-pause').addClass('icon-play');

            clearInterval(Player.rotateId);
        },

        // 获取进度
        'progress': function() {
            return Player.audio.currentTime;
        },

        'updateProgress': function(value) {
            var currentSec = percent = ratio = 0;
            if (undefined == value) {
                currentSec = parseInt(Player.progress() % 60) < 10 ? '0' + parseInt(Player.progress() % 60) : parseInt(Player.progress() % 60);
                ratio = Player.progress() / Player.duration() * 100;
                percent = (Player.progress() / Player.duration()) * 100;
            }
            else if (value == 0) {
                percent = currentSec = ratio = 0;
            }

            // 顶部进度条
            Player.wrapper.find('.progress .before')[0].style.width = '' + percent + '%';
            // 时间
            $(Player.wrapper.find('.timer')[0]).html(parseInt(Player.progress() / 60) + ':' + currentSec);
            var lrc = Player.lrcp[Player.current]
            if (lrc)
            {
                for (var ii = 0; ii < lrc.length; ii++) {
                    if (currentSec > lrc[ii][0])
                    {
                         Player.wrapper.find('.lrc').html(lrc[ii][1]);
                    }
                }
            }
        },

        // 返回当前曲目总时长
        'duration': function() {
            return Player.audio.duration;
        },

        // 指定时间播放
        'splay': function(time) {
            Player.audio.currentTime = parseInt(Math.abs(time));
            Player.play();
        },

        'switch': function(i) {
            Player.pause();
            if (i < 0) {
                Player.current = Player.playlist.length - 1;
            } else if (i >= Player.playlist.length) {
                Player.current = 0;
            } else if (undefined == i) {
                Player.current = 0;
            }
            else {
                Player.current = i;
            }

            Player.loadMusic(Player.current, true);
        },

        'bind': function() {
            Player.wrapper.find('.btn-list').bind('click', function() {
                Player.wrapper.find('.playlist').toggle();
            });

            Player.wrapper.find('.btn-play').bind('click', function() {
                if (undefined != Player.audio) {
                    if (Player.isplaying) {
                        Player.pause();
                    }
                    else {
                        Player.play();
                    }
                }
                else {
                    Player.switch(Player.current);
                }
            });

            Player.wrapper.find('.btn-pause').bind('click', function() {
                if (undefined != Player.audio) {
                    Player.pause();
                }
                else {
                    Player.switch(Player.current);
                }
            });

            Player.wrapper.find('.btn-pre').bind('click', function() {
                Player.switch(--Player.current);
            });

            Player.wrapper.find('.btn-next').bind('click', function() {
                Player.switch(++Player.current);
            });

            Player.wrapper.find('.playlist li').each(function(i) {
                $(this).bind('click', function() {
                    Player.switch(i);
                });
            });

            Player.wrapper.find('.cover img').bind('click', function() {
                Player.isplaying ? Player.pause() : Player.play();
            });

            var startX, endX;
            Player.wrapper.find('.progress').mousedown(function(event) {
                startX = event.screenX;
            }).mousemove(function(event) {
                if (event.which === 1) {
                    endX = event.screenX;
                    var seekRange = endX - startX;
                    var seekRange = Math.round((endX - startX) / 3456 * 100);
                    Player.splay((Player.progress()+seekRange));
                }
            });
            Player.wrapper.find('.progress').bind('touchstart', function(event) {
                startX = event.originalEvent.targetTouches[0].screenX;
            }).bind('touchmove', function(event) {
                endX = event.originalEvent.targetTouches[0].screenX;
                var seekRange = endX - startX;
                var seekRange = Math.round((endX - startX) / 3456 * 100);
                Player.splay((Player.progress()+seekRange));
            });
        },

        'getLrc': function(pos) {
            if (!Player.lrcs[pos] && undefined != Player.playlist[pos].lrc)
            {
                $.ajax({
                    url: Player.playlist[pos].lrc,
                    type: 'get',
                    dataType: 'text',
                    async: false,
                    success: function(data)
                    {
                        Player.lrcs.push(data);
                        Player.parseLRC(data, pos);
                    }
                });
            }
        },

        'parseLRC': function(lrcData, pos) {
            var lines = lrcData.split('\n'),
                pattern = /\[\d{2}:\d{2}.\d{2}\]/g;
                var result = [];

                $.each(lines, function(item, data){
                    var index = data.indexOf(']');
                    var time = data.substring(0, index+1), value = data.substring(index+1);
                    var timeString = time.substring(1, time.length-2);
                    var timeArr = timeString.split(':');
                    var key = parseInt(timeArr[0], 10) * 60 + parseFloat(timeArr[1]);
                    // 去除空时间，空歌词
                    !isNaN(key) && value != "" && result.push([key, value]);
                });

                // 排序
                result.sort(function(a, b) {
                    return a[0] - b[0];
                });
                
                Player.lrcp.push(result);

                return result;
        }
    };

    exp.Player = Player;
})(this, document);
