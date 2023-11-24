title: Understand Selenium and Web Driver
tags: programming
date: 2020-12-22 21:28:25
---

![cover image](cover.png)

Integration test, system test, or end to end test in web development are a really helpful tool to make sure the application work as intended. Because it actually simulates a real browser and tests the application just like a real user. It can catch the errors that can not be found in unit tests and it is the most useful tool to make sure the application work. Even though it is more resource consuming than unit tests, the benefit is still over the cost.

However, most of us only run integration tests and see the browser jumping around magically (or in headless mode). But how does it work under the hood? This article is going to introduce web-driver and selenium - the tools that make integration tests possible - and how they work.

## Web Driver

Web Driver is a remote control interface and protocol created by W3C, supported by various browser vendors. [W3C documentation](https://www.w3.org/TR/webdriver/)

For example, [ChromeDriver](https://chromedriver.chromium.org/) is the chrome implementation version of the web driver. We can install it on Mac by brew: 

```bash
> brew install chromedriver
```

and run it in terminal:

```bash
> chromedriver

Starting ChromeDriver 87.0.4280.20 (c99e81631faa0b2a448e658c0dbd8311fb04ddbd-refs/branch-heads/4280@{#355}) on port 9515
Only local connections are allowed.
Please see https://chromedriver.chromium.org/security-considerations for suggestions on keeping ChromeDriver safe.
ChromeDriver was started successfully.
```

You might need to update chrome to match the right version of chromedriver, also might need to [authorize](https://stackoverflow.com/questions/60362018/macos-catalinav-10-15-3-error-chromedriver-cannot-be-opened-because-the-de) if you are using Mac

`chromedriver` will start a HTTP server process, from w3c documentation we can see the web driver interact user with http, for example, if we want to start a browser process, we can send a HTTP request to chromedriver:

```bash
> curl -XPOST http://localhost:9515/session \
-H "Content-Type: application/json" \
-d '{ "capabilities": { "browserName": "chrome" } }'

{"value":{"capabilities":{"acceptInsecureCerts":false,"browserName":"chrome","browserVersion":"87.0.4280.67","chrome":{"chromedriverVersion":"87.0.4280.20 (c99e81631faa0b2a448e658c0dbd8311fb04ddbd-refs/branch-heads/4280@{#355})","userDataDir":"/var/folders/dh/nrc_gcpx3s19gs1t479jhj180000gn/T/.com.google.Chrome.Immsr4"},"goog:chromeOptions":{"debuggerAddress":"localhost:57462"},"networkConnectionEnabled":false,"pageLoadStrategy":"normal","platformName":"mac os x","proxy":{},"setWindowRect":true,"strictFileInteractability":false,"timeouts":{"implicit":0,"pageLoad":300000,"script":30000},"unhandledPromptBehavior":"dismiss and notify","webauthn:virtualAuthenticators":true},"sessionId":"a836dcb9e2b3b664f58b3c12f8341538"}}%
```

Then magically, you can see a browser page opened on your machine. The return value from http request has a session id, we can use this id to further interact with the page:

``` bash
// open google
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/url \
-H "Content-Type: application/json" \
-d '{ "url": "https://www.google.com"}'

// find input element
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element \
-H "Content-Type: application/json" \
-d '{ "using": "css selector", "value": "input[name=q]"}'

// enter text and submit search
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element/2292f1cb-a478-40dc-9de0-00ce0019a212/value \
-H "Content-Type: application/json" \
-d '{ "type": "keyDown", "text": "webdriver and selenium\n"}'
```

So we can do almost all the interactions that we can do on browser through HTTP requests, like filling up the form, resize window, dismiss alert, or even execute scripts. It is a really powerful tool that enables integration tests and even power bots.

## Selenium

But purely interact with web driver through HTTP requests is kind of cumbersome. So [Selenium](https://github.com/SeleniumHQ/selenium) is created to make access web driver easier. Selenium is an open source library that wraps the web driver API into an easy to use interface. You can create a session, find elements, and interact without consider the web driver implementation.

In this case, I am using the Ruby version of Selenium, in the source code it includes couple of objects that wrap the web driver:

- Service: find executable and run `webdriver` in the background
- Bridge: sending HTTP requests to webdriver
- Driver: main interface that sending commands to browser through bridge.
- Element: interface for manipulating DOM element, ex: click, submit

For example, we can rewrite the previous bash example with Selenium:

```rb
# create driver
driver = Selenium::WebDriver.for(:chrome)

# start browser and navigate to URL
driver.navigate.to("https://www.google.com")

# find input, enter search text and submit search
element = driver.find_element("css", "input[name=q]")
element.send_keys("test")
element.submit
```

Isn't this much simpler? At the bottom, it is still using the webdriver but provides a better interface and hides the complexity of settings, session id, and element id. Make writing web crawler and integration tests much easier.
## Capybara

Capybara is a framework for running integration test on Ruby, it wraps selenium webdriver and Rack app together, and provide a set of DSL methods.

For example, you can start a Capybara session with App by

```rb
session = Capybara::Session.new(:selenium, MyRackApp)
```

And run interaction with

```
session.visit("/home")

element = session.find("input[type=submit]")
element.click
```

Compare to selenium, it provides a higher level abstraction with DSL and simplify settings, so it looks good when writing integration test like:

```
it "visit the page and do search" do
  visit "/home"
  within "#content" do
    fill_in "input[type=text]", with: "test"
    click_button("input[type=submit]")
  end
end
```

The DSL methods basically forward the calls to `Capybara.current_session` which contains the current selenium session and app. It's also possible to use Capybara directly without Rack app, it feels more straightforward to manipulate the page with Capybara DSL, but essentially it's the same and Selenium will be easier to understand with Webdriver documentation.

# Conclusion

After understand how Selenium and Capybara interact with browser, it helps me debug browser test issue and enables more possible for me to write the crawler to automate some daily tasks. I hope this article can help you write automated tests and tasks with web driver too.