---
layout: post
title: "Build your own IaaS"
date: 2012-11-26 15:11
comments: true
published: false
categories: node javascript cloud
---

##Sandbox: run the app in sandbox
  daemon.chroot(appRoot);
  vm.createContext(sandboxEnv);
  vm.runInNewContext(code, context, appScript);

##Worker: listen to app-manager, send command to sandbox
  command(sandbox, ipc) : will run application on sandbox

##app-manager: manage app
  allowPort, attach command to instance
  send command to worker

##router: proxy request to target port

httpProxy = require 'http-proxy'

httpProxy.createServer (req, res, proxy)->
  proxy.proxyRequest(req, res, host: 'localhost', port: 3000)
.listen(1234)

##runtime: set env and dir interface for app
