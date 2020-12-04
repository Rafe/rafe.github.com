title: 'Understand Selenium and Web Driver'
date: 2020-11-28 21:28:25
tags: programming
---

Integration test, system test, or end to end test in web development are a really helpful tool to make sure the application work as intended. Because it actually simulate a real browser and test the application just like a real user. It can catch the errors that can not be found in unit tests. It is the most useful tool to make sure the application work. Even though it is more resource consuming than unit tests, the benefit over unit test is more valuable than the resources.

However, most of us only run integration tests and see the browser jumping around magically (or in headless mode). But how does it work under the hood? This article is going to introduce web-driver and selenium - the tools that make integration tests possible - and how they work.

## Web Driver

Web Driver is a remote control interface and protocol created by W3C, supported by various browser vendors. For example, [ChromeDriver](https://chromedriver.chromium.org/) is the chrome implementation version of the web driver. We can install it on Mac by brew: 

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

`chromedriver` will start a HTTP server, from w3c documentation we can see the web driver interact user with http, for example, if we want to start a browser process, we can send a HTTP request to chromedriver:

```bash
> curl -XPOST http://localhost:9515/session \
-H "Content-Type: application/json" \
-d '{ "capabilities": { "browserName": "chrome" } }'

{"value":{"capabilities":{"acceptInsecureCerts":false,"browserName":"chrome","browserVersion":"87.0.4280.67","chrome":{"chromedriverVersion":"87.0.4280.20 (c99e81631faa0b2a448e658c0dbd8311fb04ddbd-refs/branch-heads/4280@{#355})","userDataDir":"/var/folders/dh/nrc_gcpx3s19gs1t479jhj180000gn/T/.com.google.Chrome.Immsr4"},"goog:chromeOptions":{"debuggerAddress":"localhost:57462"},"networkConnectionEnabled":false,"pageLoadStrategy":"normal","platformName":"mac os x","proxy":{},"setWindowRect":true,"strictFileInteractability":false,"timeouts":{"implicit":0,"pageLoad":300000,"script":30000},"unhandledPromptBehavior":"dismiss and notify","webauthn:virtualAuthenticators":true},"sessionId":"a836dcb9e2b3b664f58b3c12f8341538"}}%
```

Then magically, we can see a browser page opened on our machine. The return value from http request has a session id, we can use this id to further interact with browser:

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

So we can do almost all the interactions that we can do on browser through HTTP requests, like filling up the form, resize window, dismiss alert, or even execute scripts. It is a really powerful tool that enable integration tests and even power browser bots to perform actions on websites.

## Selenium

But purely interact with web driver through HTTP requests is kind of cumbersome. So here comes the Selenium. Selenium is an open source library that wrap the web driver api into an easy to use interface.



1. What is webdriver
  - what language? c++?
  - web server that expose browser behavior
  - w3c api
2. Example for curl webdriver
  - create session
  - navigate
  - find element
  - enter text
  - submit
3. Selenium
  - read selenium source code
  - Profile
    - write perf into file
  - Options
    - options for browser/driver
    - headless! => add_argument '--headless'
  - Service
    - run the webdriver in background
    - provide headless option
  - Chrome
    - Driver
      - Bridge
    - Profile
  - Remote
    - Driver
      - Capabilities => check capabilities api on browser
      - Bridge => browser
        - Command => list all the commands
        - Response
        - ServerError
      - Element
        - click
        - submit
        - keys
      - find_element(:css | :xpath)
entry point: 

./selenium/webdriver.rb
Selenium::WebDriver::Remote::Driver
Selenium::WebDriver::Chrome::Driver

```
driver = Selenium::WebDriver.for(:chrome)
driver.navigate.to("https://www.google.com")
input = driver.find_element("css", "input[name=q]")
input.send_keys("test")
input.submit
```

files:
search_context.rb
remote_bridge

  - bridge
  - driver
  - service
  - element

4. Capybara
  - running rack app in background
  - selenium statistics
    - can collect usage of selenium
  - DSL
    - using_session
    - page => return session object
    - DSL_METHODS
  - Session is entry point
    - Session => Driver => Browser
    - Browser == Selenium::WebDriver

webdriver:

do google search by web driver

```
//create session
curl -XPOST http://localhost:9515/session -H "Content-Type: application/json" -d '{ "capabilities": { "browserName": "chrome" } }'

//navigate to
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/url -H "Content-Type: application/json" -d '{ "url": "https://www.google.com"}'

//find element
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element -H "Content-Type: application/json" -d '{ "using": "css selector", "value": "input[name=q]"}

//enter text
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element/2292f1cb-a478-40dc-9de0-00ce0019a212/value -H "Content-Type: application/json" -d '{ "type": "keyDown", "text": "neethack"}'

//find button
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element -H "Content-Type: application/json" -d '{ "using": "css selector", "value": "input[name=btnK]"}'

//click
curl -XPOST http://localhost:9515/session/a836dcb9e2b3b664f58b3c12f8341538/element/f9697904-09fa-44d0-969b-d4f115b66156/click -H "Content-Type: application/json" 

// close session
curl -XDELETE http://localhost:9515/session/3afcc77fb0abf0543c6df3e579fb7dfa -H "Content-Type: application/json"
```

DSL => delegate all call to page == Capybara.current_session
Session => have driver to control browser
Driver => using Selenum::WebDriver
WebDriver => wrapping commands to bridge
Service => run executable in child_process

4. Example of a web smoke spec / crawler
  - same example with selenium
5. Capybara::DSL
  - another wrapper level for rspec