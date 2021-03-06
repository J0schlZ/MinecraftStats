var mcstats = {
    loader: document.getElementById("loader"),
    infoBox: document.getElementById("info"),
    content: document.getElementById("content"),
    viewTitle: document.getElementById("view-title"),
    viewSubtitle: document.getElementById("view-subtitle"),
    viewDesc: document.getElementById("view-desc"),
    viewIcon: document.getElementById("view-icon"),
    viewContent: document.getElementById("view-content"),
    info: {},
    awards: {},
    events: {},
    awardKeysByTitle: new Array,
    liveEventKeysByDate: new Array,
    finishedEventKeysByDate: new Array,
    players: {}
};
mcstats.init = function() {
    mcstats.infoBox.style.display = "block";
    mcstats.content.style.display = "block"
};
mcstats.cachePlayer = function(uuid, successFunc) {
    if (uuid in mcstats.players) {
        successFunc()
    } else {
        var key = uuid.substring(0, mcstats.info.cacheQ);
        loadJson("data/playercache/" + key + ".json", function(cache) {
            cache.forEach(function(entry) {
                mcstats.players[entry["uuid"]] = {
                    name: entry["name"],
                    skin: entry["skin"],
                    last: entry["last"]
                }
            });
            successFunc()
        }, false, true)
    }
};
mcstats.showLoader = function() {
    mcstats.content.style.display = "none";
    mcstats.loader.style.display = ""
};
mcstats.showView = function(title, subtitle, desc, iconUrl) {
    mcstats.viewTitle.innerHTML = title;
    if (subtitle) {
        mcstats.viewSubtitle.innerHTML = subtitle;
        mcstats.viewSubtitle.style.display = ""
    } else {
        mcstats.viewSubtitle.style.display = "none"
    }
    if (desc) {
        mcstats.viewDesc.innerHTML = desc;
        mcstats.viewDesc.style.display = ""
    } else {
        mcstats.viewDesc.style.display = "none"
    }
    if (iconUrl) {
        mcstats.viewIcon.setAttribute("src", iconUrl);
        mcstats.viewIcon.style.display = ""
    } else {
        mcstats.viewIcon.style.display = "none"
    }
    mcstats.loader.style.display = "none";
    mcstats.content.style.display = "block"
};
var navbarButton = document.getElementById("collapse-button");
var navbar = new BSN.Collapse(navbarButton);
var collapseNavbar = function() {
    if (navbarButton.getAttribute("aria-expanded") == "true") {
        navbar.hide()
    }
};
var navlinks = document.getElementsByClassName("nav-link");
for (var i = 0; i < navlinks.length; i++) {
    navlinks[i].onclick = collapseNavbar
}
window.onhashchange = function() {
    window.scrollTo(0, 0);
    mcstats.showLoader();
    var hash = window.location.hash;
    if (hash.startsWith("#award:")) {
        var id = hash.substr(7);
        mcstats.showErrungenschaft(id)
    } else if (hash.startsWith("#player:")) {
        var uuid = hash.substr(8);
        mcstats.showPlayer(uuid)
    } else if (hash.startsWith("#players")) {
        var page = 1;
        var x = hash.indexOf(":");
        if (x >= 0) {
            page = parseInt(hash.substring(x + 1))
        }
        mcstats.showPlayerList(page, false)
    } else if (hash.startsWith("#allplayers")) {
        var page = 1;
        var x = hash.indexOf(":");
        if (x >= 0) {
            page = parseInt(hash.substring(x + 1))
        }
        mcstats.showPlayerList(page, true)
    } else if (hash == "#hof") {
        mcstats.showHof()
    } else if (hash == "#events") {
        mcstats.showEventList()
    } else if (hash.startsWith("#event:")) {
        var id = hash.substr(7);
        mcstats.showEvent(id)
    } else if (hash == "#loader") {} else {
        mcstats.showErrungenschaftenList()
    }
};
intlFormat = new Intl.NumberFormat("en");
formatFloat = function(value) {
    return value != parseInt(value) ? value.toFixed(1) : value
};
formatDate = function(unixTime) {
    var date = new Date;
    date.setTime(unixTime * 1e3);
    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    })
};
formatTime = function(unixTime) {
    var date = new Date;
    date.setTime(unixTime * 1e3);
    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }) + " - " + date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })
};
wordSmallInt = function(x) {
    switch (x) {
        case 0:
            return "null";
        case 1:
            return "einen";
        case 2:
            return "zwei";
        case 3:
            return "drei";
        case 4:
            return "vier";
        case 5:
            return "fünf";
        case 6:
            return "sechs";
        case 7:
            return "sieben";
        case 8:
            return "acht";
        case 9:
            return "neun";
        case 10:
            return "zehn";
        case 11:
            return "elf";
        case 12:
            return "zwölf";
        default:
            return "" + x
    }
};
mcstats.formatValue = function(value, unit, compact = false) {
    switch (unit) {
        case "cm":
            if (value >= 1e5) {
                value /= 1e5;
                unit = "km"
            } else if (value >= 100) {
                value /= 100;
                unit = "m"
            }
            value = formatFloat(value) + unit;
            break;
        case "ticks":
            seconds = value / 20;
            if (compact) {
                value = "";
                var higher = false;
                if (seconds > 86400) {
                    value += Math.floor(seconds / 86400) + "d ";
                    seconds %= 86400;
                    higher = true
                }
                if (higher || seconds > 3600) {
                    value += Math.floor(seconds / 3600) + "h ";
                    seconds %= 3600;
                    higher = true
                }
                if (higher || seconds > 60) {
                    value += Math.floor(seconds / 60) + "min ";
                    seconds %= 60
                }
                value += Math.floor(seconds) + "s"
            } else {
                var table = `<table class="time-data"><tbody><tr>`;
                var higher = false;
                if (seconds > 86400) {
                    var days = Math.floor(seconds / 86400);
                    table += `<td class="days">${days}d</td>`;
                    seconds %= 86400;
                    higher = true
                } else {
                    table += `<td class="days"></td>`
                }
                if (higher || seconds > 3600) {
                    var hours = Math.floor(seconds / 3600);
                    table += `<td class="hours">${hours}h</td>`;
                    seconds %= 3600;
                    higher = true
                } else {
                    table += `<td class="hours"></td>`
                }
                if (higher || seconds > 60) {
                    var minutes = Math.floor(seconds / 60);
                    table += `<td class="minutes">${minutes}min</td>`;
                    seconds %= 60
                } else {
                    table += `<td class="minutes"></td>`
                }
                seconds = Math.floor(seconds);
                table += `<td class="seconds">${seconds}s</td>`;
                table += `</tbody></table>`;
                return table
            }
            break;
        case "int":
            value = intlFormat.format(parseInt(value));
            break;
        default:
            value = "" + value + " " + unit;
            break
    }
    return `<span class="text-data">${value}</span>`
};
mcstats.awardType = {
    medal: {
        title: "Medallie",
        imgPrefix: "fatcow/medal_award_"
    },
    crown: {
        title: "Krone",
        imgPrefix: "fatcow/crown_"
    }
};
mcstats.rankWidget = function(rank, type = "medal") {
    var awardType = mcstats.awardType[type];
    if (rank) {
        var widget = `<span class="rank rank-${rank}">#${rank}</span>`;
        var medal, medalTitle;
        switch (rank) {
            case 1:
                medal = "gold";
                medalTitle = "Gold";
                break;
            case 2:
                medal = "silver";
                medalTitle = "Silber";
                break;
            case 3:
                medal = "bronze";
                medalTitle = "Bronze";
                break;
            default:
                medal = false
        }
        if (medal) {
            widget = `\n                <img class="img-textsize-1_5 mr-1 align-top" title="${medalTitle} ${awardType.title}" src="img/${awardType.imgPrefix}${medal}.png"/>\n            ` + widget
        }
    } else {
        widget = `<span class="rank">-</span>`
    }
    return widget
};
mcstats.isActive = function(last) {
    var daysSinceLast = (mcstats.info.updateTime - last) / 86400;
    return daysSinceLast <= mcstats.info.inactiveDays
};
mcstats.lastOnlineWidget = function(last) {
    var fmt = formatTime(last);
    if (mcstats.isActive(last)) {
        return `<span class="text-success">${fmt}</span>`
    } else {
        return `\n            <span class="text-danger">${fmt}</span>\n        `
    }
};
mcstats.awardWidget = function(id) {
    var award = mcstats.awards[id];
    return `\n        <img class="img-pixelated img-textsize-1_5 align-baseline" src="img/award-icons/${id}.png" alt="${id}" title="${award.title}"/>\n        <a href="#award:${id}">${award.title}</a>\n    `
};
mcstats.eventWidget = function(id) {
    var e = mcstats.events[id];
    var awardId = e.link;
    var award = mcstats.awards[id];
    return `\n        <img class="img-pixelated img-textsize-1_5 align-baseline" src="img/award-icons/${awardId}.png" alt="${id}" title="${e.title}"/>\n        <a href="#event:${id}">${e.title}</a>\n    `
};

function drawFace(img) {
    var canvas = img.parentNode;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 8, 8, 8, 8, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 40, 8, 8, 8, 0, 0, canvas.width, canvas.height)
}
mcstats.faceWidget = function(skinUrl, css = "") {
    return `\n        <canvas width="8" height="8" class="minecraft-face d-inline-block img-pixelated ${css}">\n            <img class="d-none" src="${skinUrl}" onload="drawFace(this);"/>\n        </canvas>`
};
mcstats.makePlayerWidget = function(uuid, skinCss, asLink) {
    p = mcstats.players[uuid];
    if (p["skin"]) {
        skin = "https://textures.minecraft.net/texture/" + p["skin"]
    } else {
        var even = parseInt(uuid[7], 16) ^ parseInt(uuid[15], 16) ^ parseInt(uuid[23], 16) ^ parseInt(uuid[31], 16);
        skin = "img/skins/" + (even ? "alex" : "steve") + ".png"
    }
    return mcstats.faceWidget(skin, skinCss) + (asLink ? `<a href="#player:${uuid}">${p.name}</a>` : p.name)
};
mcstats.playerWidget = function(uuid, skinCss = "textw-1_5 texth-1_5 align-baseline mr-1", asLink = true) {
    if (uuid) {
        if (uuid in mcstats.players) {
            return mcstats.makePlayerWidget(uuid, skinCss, asLink)
        } else {
            mcstats.cachePlayer(uuid, function() {
                document.getElementById(uuid).innerHTML = mcstats.makePlayerWidget(uuid, skinCss, asLink)
            });
            return `<span id=${uuid}>${uuid}</span>`
        }
    } else {
        return `<span class="text-muted">(nobody)</span>`
    }
};
mcstats.removeColorCodes = function(str) {
    nofmt = "";
    for (i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) == 167) {
            ++i
        } else {
            nofmt += str[i]
        }
    }
    return nofmt
};
mcstats.formatColorCode = function(str) {
    html = "";
    color = false;
    level = 0;
    for (i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) == 167) {
            code = str[i + 1];
            if (code == "r") {
                html += `</span>`.repeat(level);
                level = 0
            } else {
                html += `<span class="mc-text-${code}">`;
                ++level
            }++i
        } else {
            html += str[i]
        }
    }
    html += `</span>`.repeat(level);
    return html
};
mcstats.showErrungenschaftenList = function() {
    viewHTML = "";
    var numPerRow = 3;
    var counter = 0;
    var currentRow = "";
    mcstats.awardKeysByTitle.forEach(function(id) {
        var award = mcstats.awards[id];
        var holder, info;
        if (award.best) {
            holder = mcstats.playerWidget(award.best.uuid);
            info = award.desc + ": " + mcstats.formatValue(award.best.value, award.unit, true)
        } else {
            holder = mcstats.playerWidget(false);
            info = `<span class="text-muted">(${award.desc})</span>`
        }
        currentRow += `\n            <div class="col-sm">\n                <div class="container p-1 mb-3 mcstats-entry">\n                    <div class="h4 p-1 mb-1 round-box text-center">\n                        <img class="img-pixelated img-textsize align-baseline" src="img/award-icons/${id}.png" alt="${id}" title="${award.title}"/>\n                        <a href="#award:${id}">${award.title}</a>\n                    </div>\n                    <div class="p-1 round-box text-center">\n                        ${holder}\n                        <br/>\n                        ${info}\n                    </div>\n                </div>\n            </div>\n        `;
        if (++counter >= numPerRow) {
            viewHTML += `<div class="row">${currentRow}</div>`;
            currentRow = "";
            counter = 0
        }
    });
    if (counter > 0) {
        for (var i = counter; i < numPerRow; i++) {
            currentRow += `<div class="col-sm"></div>`
        }
        viewHTML += `<div class="row">${currentRow}</div>`
    }
    mcstats.viewContent.innerHTML = viewHTML;
    mcstats.showView("Errungenschaften", false, false, false)
};
mcstats.showErrungenschaft = function(id) {
    loadJson("data/rankings/" + id + ".json", function(ranking) {
        var award = mcstats.awards[id];
        var tbody = "";
        var rank = 1;
        ranking.forEach(function(entry) {
            var rankWidget = mcstats.rankWidget(rank++);
            var playerWidget = mcstats.playerWidget(entry.uuid);
            var value = mcstats.formatValue(entry.value, award.unit);
            tbody += `\n                <tr>\n                    <td class="text-right">${rankWidget}</th>\n                    <td>${playerWidget}</td>\n                    <td class="text-data text-right">${value}</td>\n                </tr>\n            `
        });
        mcstats.viewContent.innerHTML = `\n            <div class="mcstats-entry p-1">\n            <div class="round-box p-1">\n                <table class="table table-responsive-xs table-hover table-sm">\n                <thead>\n                    <th scope="col" class="text-right text-shadow">Rang</th>\n                    <th scope="col" class="text-shadow">Player</th>\n                    <th scope="col" class="text-right text-shadow">${award.desc}</th>\n                </thead>\n                <tbody>${tbody}</tbody>\n                </table>\n            </div>\n            </div>\n        `;
        mcstats.showView(award.title, "Errungenschaft Ranging", false, "img/award-icons/" + id + ".png")
    })
};
mcstats.showEventList = function() {
    var viewHTML = "";
    var generateList = function(keysByDate) {
        var tbody = "";
        keysByDate.forEach(function(id) {
            var e = mcstats.events[id];
            var award = mcstats.awards[e.link];
            var eventWidget = mcstats.eventWidget(id);
            if (e.active) {
                eventWidget += `<span class="text-success ml-2">[LIVE]</span>`
            }
            var holder, info;
            if (e.best) {
                holder = mcstats.playerWidget(e.best.uuid);
                info = award.desc + ": " + mcstats.formatValue(e.best.value, award.unit, true)
            } else {
                holder = mcstats.playerWidget(false);
                info = `<span class="text-muted">(${award.desc})</span>`
            }
            var eventTime;
            if (e.active) {
                eventTime = `Going since ${formatDate(e.startTime)}`
            } else {
                eventTime = `${formatDate(e.startTime)} - ${formatDate(e.stopTime)}`
            }
            var eventStartTime = formatTime(e.startTime);
            var live = e.active ? `<span class="pl-2 text-success">[LIVE]</span>` : `<span class="pl-2 text-danger">[Finished]</span>`;
            tbody += `\n                <div class="row">\n                <div class="col-sm">\n                    <div class="container p-1 mb-3 mcstats-entry">\n                        <div class="p-1 mb-1 round-box text-center">\n                            <div class="h4">\n                                <img class="img-pixelated img-textsize align-baseline" src="img/award-icons/${e.link}.png" alt="${id}" title="${e.title}"/>\n                                <a href="#event:${id}">${e.title}</a>\n                                ${live}\n                            </div>\n                            <div class="text-muted">\n                                ${eventTime}\n                            </div>\n                        </div>\n                        <div class="p-1 round-box text-center">\n                            <span class="rank-1">${e.active?"Leading:":"Winner:"}</span>\n                            ${holder}\n                            <br/>\n                            ${info}\n                        </div>\n                    </div>\n                </div>\n                </div>\n            `
        });
        return tbody
    };
    mcstats.viewContent.innerHTML = "";
    if (mcstats.liveEventKeysByDate.length > 0) {
        mcstats.viewContent.innerHTML += `\n            <div class="text-center mb-2">\n                <div class="h5 text-shadow">Ongoing Events</div>\n            </div>\n            ${generateList(mcstats.liveEventKeysByDate)}\n        `
    }
    if (mcstats.finishedEventKeysByDate.length > 0) {
        mcstats.viewContent.innerHTML += `\n            <div class="text-center mb-2 mt-4">\n                <div class="h5 text-shadow">Finished Events</div>\n            </div>\n            ${generateList(mcstats.finishedEventKeysByDate)}\n        `
    }
    mcstats.showView("Events", false, false, false)
};
mcstats.showEvent = function(id) {
    loadJson("data/events/" + id + ".json", function(eventData) {
        var e = mcstats.events[id];
        var awardId = e.link;
        var award = mcstats.awards[awardId];
        var tbody = "";
        var rank = 1;
        eventData.ranking.forEach(function(entry) {
            var rankWidget = mcstats.rankWidget(rank++);
            var playerWidget = mcstats.playerWidget(entry.uuid);
            var value = mcstats.formatValue(entry.value, award.unit);
            tbody += `\n                <tr>\n                    <td class="text-right">${rankWidget}</th>\n                    <td>${playerWidget}</td>\n                    <td class="text-data text-right">${value}</td>\n                </tr>\n            `
        });
        var eventTime;
        if (e.active) {
            eventTime = `\n            This event is <span class="text-success">LIVE</span>\n            since <span class="text-info">${formatTime(e.startTime)}!</span>`
        } else {
            eventTime = `\n                This event went from\n                <span class="text-info">${formatTime(e.startTime)}</span>\n                to <span class="text-info">${formatTime(e.stopTime)}</span>\n                and has already <span class="text-danger">finished</span>.`
        }
        mcstats.viewContent.innerHTML = `\n            <div class="mcstats-entry p-1">\n            <div class="round-box p-1">\n                <table class="table table-responsive-xs table-hover table-sm">\n                <thead>\n                    <th scope="col" class="text-right text-shadow">Rang</th>\n                    <th scope="col" class="text-shadow">Player</th>\n                    <th scope="col" class="text-right text-shadow">${award.desc}</th>\n                </thead>\n                <tbody>${tbody}</tbody>\n                </table>\n            </div>\n            </div>\n        `;
        mcstats.showView(e.title, e.active ? "Event Leaderboard" : "Event Ranging", eventTime, "img/award-icons/" + awardId + ".png")
    })
};
mcstats.showPlayerList = function(page = 1, inactive = false) {
    loadJson("data/playerlist/" + (inactive ? "all" : "active") + page + ".json.gz", function(list) {
        list.forEach(function(p) {
            mcstats.players[p.uuid] = {
                name: p.name,
                skin: p.skin,
                last: p.last
            }
        });
        var tbody = "";
        var viewName = inactive ? "allplayers" : "players";
        var numPlayers = mcstats.info.numPlayers;
        var numActive = mcstats.info.numActive;
        var numInactive = numPlayers - numActive;
        var numPerPage = mcstats.info.playersPerPage;
        var numPagesAroundCurrent = 3;
        var numPages = Math.ceil((inactive ? numPlayers : numActive) / numPerPage);
        list.forEach(function(player) {
            var widget = mcstats.playerWidget(player.uuid);
            var last = mcstats.lastOnlineWidget(player.last);
            tbody += `\n                <tr>\n                    <td>${widget}</td>\n                    <td class="text-right">${last}</td>\n                </tr>\n            `
        });
        var paginator = "";
        var generatePageLink = function(i, caption = null, enabled = true) {
            if (caption === null) caption = i.toString();
            if (enabled) {
                return `\n                    <li class="page-item">\n                        <a class="page-link" href="#${viewName}:${i}">${caption}</a>\n                    </li>`
            } else {
                return `\n                <li class="page-item disabled">\n                    <div class="page-link">${caption}</div>\n                </li>`
            }
        };
        var generatePageActive = function() {
            return `\n                <li class="page-item active">\n                    <div class="page-link">${page}</div>\n                </li>`
        };
        var generatePageDots = function() {
            return `<li class="page-dots">...</li>`
        };
        paginator += generatePageLink(page - 1, "&lt", page > 1);
        if (page > 1) {
            paginator += generatePageLink(1)
        }
        if (page - 2 > numPagesAroundCurrent) {
            paginator += generatePageDots()
        }
        for (var i = Math.max(2, page - numPagesAroundCurrent); i < page; i++) {
            paginator += generatePageLink(i)
        }
        paginator += generatePageActive();
        for (var i = page + 1; i <= Math.min(page + numPagesAroundCurrent, numPages - 1); i++) {
            paginator += generatePageLink(i)
        }
        if (numPages - page - 1 > numPagesAroundCurrent) {
            paginator += generatePageDots()
        }
        if (page < numPages) {
            paginator += generatePageLink(numPages)
        }
        paginator += generatePageLink(page + 1, "&gt", page < numPages);
        mcstats.viewContent.innerHTML = `\n            <div class="text-center mt-3">\n                <input id="show-inactive" type="checkbox" ${inactive?"checked":""}/>\n                <label for="show-inactive">Zeige inaktive Spieler</label>\n            </div>\n            <div class="text-center mt-3">\n                <ul class="pagination justify-content-center">${paginator}</ul>\n            </div>\n            <div class="mcstats-entry p-1">\n            <div class="round-box p-1">\n                <table class="table table-responsive-xs table-hover table-sm">\n                <thead>\n                    <th scope="col" class="text-shadow">Spieler</th>\n                    <th scope="col" class="text-right text-shadow">Zuletzt online</th>\n                </thead>\n                <tbody>${tbody}</tbody>\n                </table>\n            </div>\n            </div>\n            <div class="mt-2 text-muted text-center text-shadow">\n                Spieler müssen mindestens ${mcstats.info.minPlayTime} Minuten gespielt haben\n                um hier aufgeführt zu werden.<br/>\n                Spieler welche seit über ${mcstats.info.inactiveDays} Tagen inaktiv sind,\n                gelten als inaktiv und werden im Ranking nicht gewertet.\n            </div>\n            <div class="text-center mt-3">\n                <ul class="pagination justify-content-center">${paginator}</ul>\n            </div>\n        `;
        document.getElementById("show-inactive").onclick = function() {
            window.location.hash = inactive ? "#players" : "#allplayers"
        };
        mcstats.showView("Spielerliste", `\n                    <span class="text-data">${numPlayers}</span>\n                    Spieler insgesamt\n                    ( <span class="text-success">${numActive}</span> aktiv,\n                    <span class="text-danger">${numInactive}</span> inaktiv).\n            `, `\n                Zeige ${numPerPage} Spieler je Seite.<br/>\n            `, false)
    }, true)
};
mcstats.showPlayer = function(uuid) {
    mcstats.cachePlayer(uuid, function() {
        loadJson("data/playerdata/" + uuid + ".json", function(stats) {
            var player = mcstats.players[uuid];
            var tbody = "";
            mcstats.awardKeysByTitle.forEach(function(id) {
                var stat = stats[id];
                var award = mcstats.awards[id];
                var awardWidget = mcstats.awardWidget(id);
                var value = mcstats.formatValue(stat ? stat.value : 0, award.unit, true);
                var rankWidget = stat ? mcstats.rankWidget(stat.rank) : "";
                tbody += `\n                    <tr>\n                        <td class="text-right">${rankWidget}</td>\n                        <td>${awardWidget}</td>\n                        <td>\n                            <span class="text-muted">${award.desc}:</span>&nbsp;\n                            <span class="text-data">${value}</span>\n                        </td>\n                    </tr>\n                `
            });
            mcstats.viewContent.innerHTML = `\n                <div class="mcstats-entry p-1">\n                <div class="round-box p-1">\n                    <table class="table table-responsive-xs table-hover table-sm">\n                    <thead>\n                        <th scope="col" class="text-right text-shadow">Rang</th>\n                        <th scope="col" class="text-shadow">Errungenschaft</th>\n                        <th scope="col" class="text-shadow">Punkte</th>\n                    </thead>\n                    <tbody>${tbody}</tbody>\n                    </table>\n                </div>\n                </div>\n            `;
            mcstats.showView(mcstats.playerWidget(uuid, "textw texth align-baseline mr-2", false), "Spieler Statistiken", "Zuletzt gespielt: " + mcstats.lastOnlineWidget(player.last), false)
        })
    })
};
mcstats.showHof = function() {
    var tbody = "";
    var rank = 1;
    mcstats.hof.forEach(function(entry) {
        var rankWidget = mcstats.rankWidget(rank++, "crown");
        var playerWidget = mcstats.playerWidget(entry.uuid);
        var value = entry.value;
        tbody += `\n            <tr>\n                <td class="text-right">${rankWidget}</th>\n                <td>${playerWidget}</td>\n                <td class="text-data text-center">${value[1]}</td>\n                <td class="text-data text-center">${value[2]}</td>\n                <td class="text-data text-center">${value[3]}</td>\n                <td class="text-data text-right">${value[0]}</td>\n            </tr>\n        `
    });
    mcstats.viewContent.innerHTML = `\n        <div class="mcstats-entry p-1">\n        <div class="round-box p-1">\n            <table class="table table-responsive-xs table-hover table-sm">\n            <thead>\n                <th scope="col" class="text-right text-shadow">Rang</th>\n                <th scope="col" class="text-shadow">Spieler</th>\n                <th scope="col" class="text-center"><img class="img-textsize-2" title="Gold Medallien" src="img/fatcow/medal_award_gold.png"/></th>\n                <th scope="col" class="text-center"><img class="img-textsize-2" title="Silber Medallien" src="img/fatcow/medal_award_silver.png"/></th>\n                <th scope="col" class="text-center"><img class="img-textsize-2" title="Bronze Medallien" src="img/fatcow/medal_award_bronze.png"/></th>\n                <th scope="col" class="text-right text-shadow">Punkte</th>\n            </thead>\n            <tbody>${tbody}</tbody>\n            </table>\n        </div>\n        </div>\n    `;
    var crown = mcstats.info.crown;
    var formatCrown = function(x) {
        return wordSmallInt(x) + " Punkt" + (x > 1 ? "e" : "")
    };
    mcstats.showView("Hall of Fame", "Der Kampf um die Krone", `\n            Die Rangfolge der Krone basiert auf der Menge gesammelter Medallien.<br/>\n            Eine Goldmedallie ist <span class="rank-1">${formatCrown(crown[0])}</span> wert,\n            eine Silbermedallie <span class="rank-2">${formatCrown(crown[1])}</span> und\n            eine Bronzemedallie <span class="rank-3">${formatCrown(crown[2])}</span>.\n        `, false)
};
loadJson = function(url, successFunc, compressed = false, allowCache = false) {
    var req = new XMLHttpRequest;
    req.open("GET", url, true);
    if (!allowCache) {
        req.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    }
    if (compressed) {
        req.responseType = "arraybuffer"
    }
    req.onload = function(e) {
        var data;
        if (compressed) {
            var compressedData = new Uint8Array(req.response);
            data = JSON.parse(pako.inflate(compressedData, {
                to: "string"
            }))
        } else {
            data = JSON.parse(req.response)
        }
        successFunc(data)
    };
    req.send()
};
class Loader {
    constructor(completeFunc) {
        this.oncomplete = completeFunc;
        this.requests = [];
        this.numLoaded = 0
    }
    addRequest(url, successFunc, compressed = false) {
        this.requests.push({
            url: url,
            successFunc: successFunc,
            compressed: compressed
        })
    }
    start() {
        var loader = this;
        this.requests.forEach(function(req) {
            loadJson(req.url, function(result) {
                req.successFunc(result);
                ++loader.numLoaded;
                if (loader.numLoaded >= loader.requests.length) {
                    loader.oncomplete()
                }
            }, req.compressed)
        })
    }
}
var loader = new Loader(function() {
    mcstats.init();
    window.onhashchange()
});
loader.addRequest("data/summary.json.gz", function(summary) {
    mcstats.info = summary.info;
    mcstats.players = summary.players;
    mcstats.awards = summary.awards;
    mcstats.events = summary.events;
    mcstats.hof = summary.hof;
    serverName = JSON.parse('"' + mcstats.info.serverName + '"');
    serverNameNoFmt = mcstats.removeColorCodes(serverName).replace("<br>", " / ");
    //document.title = `${serverNameNoFmt} – Stats`;
    document.getElementById("server-name").innerHTML = mcstats.formatColorCode(serverName);
    document.getElementById("update-time").textContent = formatTime(mcstats.info.updateTime);
    var serverIcon = document.getElementById("server-icon");
    if (!mcstats.info.hasIcon) {
        serverIcon.style.display = "none"
    } else {
        serverIcon.setAttribute("title", serverNameNoFmt)
    }
    for (var key in mcstats.awards) {
        mcstats.awardKeysByTitle.push(key)
    }
    mcstats.awardKeysByTitle.sort(function(a, b) {
        return mcstats.awards[a].title.localeCompare(mcstats.awards[b].title)
    });
    var numEvents = 0;
    for (var key in mcstats.events) {
        if (mcstats.events[key].active) {
            mcstats.liveEventKeysByDate.push(key)
        } else {
            mcstats.finishedEventKeysByDate.push(key)
        }++numEvents
    }
    if (numEvents > 0) {
        mcstats.liveEventKeysByDate.sort(function(a, b) {
            return mcstats.events[b].startTime - mcstats.events[a].startTime
        });
        mcstats.finishedEventKeysByDate.sort(function(a, b) {
            return mcstats.events[b].startTime - mcstats.events[a].startTime
        });
        document.getElementById("tab-events").style.display = ""
    }
}, true);
mcstats.showLoader();
loader.start();