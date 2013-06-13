var
    chai               = require("chai"),
    expect             = chai.expect,
    extend             = require("node.extend"),
    selenium_webdriver = require("selenium-webdriver"),
    sinon              = require("sinon")
;

var webdriver = new selenium_webdriver.Builder();

var webdriver_capabilities = extend(true, {
    "browserName": "phantomjs",
    "platform"   : "ANY",
    "version"    : ""
}, {
    "applicationCacheEnabled" : true,
    "browserConnectionEnabled": true,
    "databaseEnabled"         : true,
    "javascriptEnabled"       : true,
    "locationContextEnabled"  : true,
    "nativeEvents"            : true,
    "unexpectedAlertBehaviour": "ignore",
    "webStorageEnabled"       : true
}, {
    "webdriver.remote.quietExceptions": false
});

webdriver.usingServer("http://localhost:8484");
webdriver.withCapabilities(webdriver_capabilities);

webdriver = webdriver.build();

var URL = ("http://localhost/site/simple.html?scjsurl=" + encodeURIComponent("//localhost/js/equinox.js"));

describe("sitecues", function () {
    after(function (done) {
        webdriver.quit();
        done();
    });

    describe("navigator", function () {
        it("should navigate to the simple test page", function (done) {
            webdriver.get(URL);
            webdriver.getTitle().then(function (title) {
                expect(title).to.be.a("string");
                expect(title).is.equal("Young Frankenstein");
                done();
            });
        });
        it("should see badge on the page", function (done) {
            webdriver.sleep(3500).then(function () {
                var spy_webdriver_isElementPresent = sinon.spy(webdriver, "isElementPresent");

                webdriver.isElementPresent({
                    "id": "sitecues-badge"
                }).then(function (element_present) {
                    expect(spy_webdriver_isElementPresent.calledOnce).to.be.true;
                    expect(element_present).to.be.true;
                    done();
                });
            });
        });
    });
});
