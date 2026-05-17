var https = require("https");
var http = require("http");

var BETTERSTACK_TOKEN = process.env.BETTERSTACK_TOKEN || "";
var BETTERSTACK_ENDPOINT = process.env.BETTERSTACK_ENDPOINT || "https://in.logtail.com";

var LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
var MIN_LEVEL = LEVELS[process.env.LOG_LEVEL || "debug"] || 0;

function sendToBetterstack(entries) {
    if (!BETTERSTACK_TOKEN) return;
    var payload = JSON.stringify(entries);
    var url = new URL(BETTERSTACK_ENDPOINT);
    var mod = url.protocol === "https:" ? https : http;
    var req = mod.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            Authorization: "Bearer " + BETTERSTACK_TOKEN
        }
    }, function () {});
    req.on("error", function () {});
    req.write(payload);
    req.end();
}

function log(level, message, extra) {
    if (LEVELS[level] < MIN_LEVEL) return;
    var entry = {
        level: level,
        message: message,
        dt: new Date().toISOString(),
        _level_num: LEVELS[level]
    };
    if (extra && typeof extra === "object") {
        Object.keys(extra).forEach(function (k) {
            if (k !== "message" && k !== "level") entry[k] = extra[k];
        });
    }
    if (level === "error") {
        console.error("[ERROR]", message, extra || "");
    } else if (level === "warn") {
        console.warn("[WARN]", message, extra || "");
    } else {
        console.log("[" + level.toUpperCase() + "]", message, extra || "");
    }
    sendToBetterstack([entry]);
}

function debug(msg, extra) { log("debug", msg, extra); }
function info(msg, extra) { log("info", msg, extra); }
function warn(msg, extra) { log("warn", msg, extra); }
function error(msg, extra) { log("error", msg, extra); }

function requestMiddleware(req, res, next) {
    var start = Date.now();
    res.on("finish", function () {
        var duration = Date.now() - start;
        info("HTTP " + req.method + " " + req.originalUrl, {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration: duration,
            ip: req.ip || req.connection.remoteAddress
        });
    });
    next();
}

module.exports = { debug: debug, info: info, warn: warn, error: error, requestMiddleware: requestMiddleware };