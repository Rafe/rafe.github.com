title: 'Understand Capybara and WebDriver'
date: 2020-03-22 21:28:25
tags: ruby
---

0. The rise of system test
1. What is webdriver
2. Example for curl webdriver
3. Selenium webdriver
4. What is Capybara
5. Capybara::DSL
6. Example of a web smoke spec

DSL => delegate all call to page == Capybara.current_session

Session => have driver to control browser
Driver => using Selenum::WebDriver
WebDriver => wrapping commands to bridge
Service => run executable in child_process