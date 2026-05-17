var https = require("https");
var crypto = require("crypto");

var SENTRY_DSN = process.env.SENTRY_DSN || "";
var SENTRY_ENV = process.env.NODE_ENV || "development";
var SENTRY_RELEASE = process.env.SENTRY_RELEASE || process.env.npm_package_version || "";

var parsed = null;

function init() {
    if (!SENTRY_DSN) return false;
    try {
        var parts = SENTRY_DSN.replace("https://", "").split("@");
        var key = parts[0];
        var hostParts = parts[1].split("/");
        var projectId = hostParts[1] || hostParts[0];
        var host = hostParts[0];
        parsed = { key: key, host: host, projectId: projectId };
        return true;
    } catch (e) {
        console.error("[sentry] DSN invalido:", e.message);
        return false;
    }
}

function captureException(err, req) {
    if (!parsed) return;
    var eventId = crypto.randomBytes(16).toString("hex");
    var frames = [];
    if (err && err.stack) {
        var lines = err.stack.split("\n");
        for (var i = 1; i < lines.length && i < 20; i++) {
            var match = lines[i].match(/^\s+at\s+(.+)\s+\((.+):(\d+):(\d+)\)$/);
            if (match) {
                frames.push({ filename: match[2], lineno: parseInt(match[3]), colno: parseInt(match[4]), function: match[1] });
            }
        }
    }
    var payload = {
        event_id: eventId,
        timestamp: new Date().toISOString(),
        platform: "nodejs",
        level: "error",
        environment: SENTRY_ENV,
        release: SENTRY_RELEASE,
        exception: {
            values: [{
                type: err && err.name ? err.name : "Error",
                value: err && err.message ? err.message : String(err),
                stacktrace: { frames: frames.reverse() }
            }]
        },
        request: req ? {
            method: req.method,
            url: req.originalUrl || req.url,
            headers: {
                "user-agent": req.headers && req.headers["user-agent"] ? req.headers["user-agent"] : "",
                "x-forwarded-for": req.headers && req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"] : ""
            },
            query_string: req.query ? JSON.stringify(req.query) : undefined
        } : undefined,
        tags: { runtime: "node" }
    };

    var body = JSON.stringify(payload);
    var endpoint = "https://" + parsed.host + "/api/" + parsed.projectId + "/envelope/";
    var headerLines = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
    var itemLines = JSON.stringify({ type: "event", length: body.length });
    var envelope = headerLines + "\n" + itemLines + "\n" + body;

    var reqObj = https.request({
        hostname: parsed.host,
        port: 443,
        path: "/api/" + parsed.projectId + "/envelope/",
        method: "POST",
        headers: {
            "Content-Type": "application/x-sentry-envelope",
            "X-Sentry-Auth": "Sentry sentry_version=7,sentry_key=" + parsed.key + ",sentry_client=listandsave-node/1.0",
            "Content-Length": Buffer.byteLength(envelope)
        }
    }, function () {});
    reqObj.on("error", function () {});
    reqObj.write(envelope);
    reqObj.end();
}

function errorHandler(err, req, res, next) {
    captureException(err, req);
    next(err);
}

module.exports = { init: init, captureException: captureException, errorHandler: errorHandler };