---
layout: post
title: "Test driven server configuration with chef"
date: 2013-09-09 22:12
comments: true
categories: ruby, devops
published: false
---

Recently I am working on Devops things, including server, network,
deployment and chef scripts. In the Devops team, we are working hard on refactoring
our old chef recipes into more clean and modularize cookbooks.
So I think it's a good chance to talk about how we work to build better recipes and cookbooks for our infrustrure:

## Chef!

[Chef](https://learnchef.opscode.com/) is a system configuration dsl we use for our infrustructure.
We use chef to automate our configuration on servers. And also manage all the configurations and varibles on git.
For a new Devops guy coming from developer world like me, chef script make system configuration more like developing an application.
When we want to treak some server setting, we add new code on cookbook, test it on vagrant and deploy by running chef-client on server.

### Resources

Here is a simple example of chef dsl:

{% codeblock lang:js %}

template "/etc/profile.d/ps1.sh" do
  owner "root"
  group "root"
  mode "0644"
  variables(
    color_code: node['bash_profile']['color_code']
  )
end

{{ endcodeblock }}

In this script, we are calling the chef `template` resource to set a bash configuration file with variables.
What this resource do is, it will install a erb template `ps1.sh.erb` from cookbook to `/etc/profile.d/ps1.sh` on server.
So when we run the chef-client on server, the template file will automatically installed to the path.
In chef script, we use those chef defined resources to install packages, start services and execute commands.

### Idempotent

We can set those things by bash script too! People might think,
But the main benefit of using chef resource is not only automation.
Chef resource is running in the Idempotent way, which means even you run the script multiple times.
The configuration will still be the same.

For example in the template resource, chef will compare on generated template and only write when file is different.
So chef script become a test of server configuration. We can run multiple times to make sure the configuration is always correct.

### Community

Another reason is the community, the [Opscode](opscode.com) provide a community platform to let devops share their system configuration as cookbook,
Those cookbook are already used by many company and is the `Best Practice` configuration. So we can reuse those community cookbook to easily build our own infrastructure.

### Orchestration

Chef provide a client-server structure to manage servers. you can config the server by ssh and command line, but what if you have to manage 10 server at once? how about 100?
Chef server can store setting of servers as environments and roles. So we can make abstraction and reuse those settings as something like 'beta environment' and 'database role'.
When we add a new server, we just bootstrap the node and apply roles and environments to them, the services can be running and working with original servers instantly.

### Testing

When we refactoring our old cookbooks, we found out a lot of testing tools to make our refactoring easier. 
The community of chef is testing everything! We can run unit test, integration test and functional test on our cookbooks and servers.
Also, with the support of vagrant and test-kitchen, we can easily create servers on local machine and test the cookbooks on them!
That make our cookbook development faster and more reliable.

## So... lets build some server!

So... lets build some production like servers with test driven development with chef!

For a minimum production like environment, we need:
+ application server
+ database server
+ cache server

In this example, we will use nginx + unicorn for application server, postgresql for database and redis for cache server.

## Install knife with chef server

First, we can register a public chef server for the deployment [https://getchef.opscode.com/signup](https://getchef.opscode.com/signup)
After register, we can download the chef key to talk with chef server by knife (chef configuration tool).

for talk to chef server we need to download and install below files:

+ knife.rb # chef configuration file, include the setting for key and cookbook path.
+ client.pem # chef client key, present user identity and right
+ <organization>-validation.pem # chef validation key

You can download or generate those files from chef server pages. (or download the starter kit and start from there)

Once knife.rb put under ./chef directory and key is set. we can install chef gem by `gem install chef` and try `knife client list` to connect with chef server.
If you saw your organization validator name. Than we are ready to go!

## Packages and tools

First, we need to add our gem file for the package we are going to use:

{% codeblock lang:rb %}

source 'https://rubygems.org'

gem 'chef'
gem 'berkshelf'

group :test do
  gem 'chefspec'
  gem 'tailor'
  gem 'foodcritic'
  gem 'strainer'
end

group :integration do
  gem 'test-kitchen', '~> 1.0.0.beta'
  gem 'kitchen-vagrant'
  gem 'serverspec'
end

{% endcodeblock %}

Run `bundle` to install those gem.
Also download and install [virtual box](https://www.virtualbox.org/) and [Vagrant](vagrantup.com) for integration testing.

## Manage and use community cookbooks with Berkshelf

Berkshelf is a cookbook management tool just like bunlder.
We can define a Berksfile and download cookbooks from opscode or github.

Create the `Berksfile` with cookbook that we are using:

{% codeblock lang:rb %}

site :opscode

cookbook "rbenv"
cookbook "nginx"
cookbook "unicorn"
cookbook "postgresql"
cookbook "redisio"

{% endcodeblock %}

## serverspec

{% codeblock lang:rb %}
describe 'application server' do

  describe service('nginx') do
    it { should be_enabled }
    it { should be_running }
  end

  describe service('unicorn') do
    it { should be_running }
  end

  describe package('ruby') do
    it { should be_installed }
  end
end

{% endcodeblock %}

{% codeblock lang:rb%}
describe 'database server' do

end
{% endcodeblock %}

{% codeblock lang:rb%}
describe 'redis server' do

end
{% endcodeblock %}

## Test kitchen

## Minitest handler

## Write Chefspec Master cookbook

For managing different server roles, we create a master cookbook to include all nessassary cookbooks
and setup the attributes.
We use the master cookbook as runlist for server, becasuse we can versioning the cookbook,
but we can't versioning the run list.

+ app_server

{% codeblock lang:rb %}
include_recipe 'rbenv::default'
include_recipe 'rbenv::ruby_build'

rbenv_ruby "2.0.0-p247" do
  global true
end

include_recipe 'unicorn'

unicorn_config "/etc/unicorn/app.rb" do
  listen({ node[:unicorn][:port] => node[:unicorn][:options] })
  working_directory ::File.join(app['deploy_to'], 'current')
  worker_timeout node[:unicorn][:worker_timeout]
  preload_app node[:unicorn][:preload_app]
  worker_processes node[:unicorn][:worker_processes]
  before_fork node[:unicorn][:before_fork]
end

include_recipe 'nginx'

# set ssh_key for capistrano deploy
include_recipe 'ssh_key'

# set nginx site listen to unicorn pid
template '/etc/nginx/sites_avaliable/app'
nginx_site 'app' do
  enable true
end

{% endcodeblock %}

+ db_server
{% codeblock lang:rb %}

include_recipe 'postgresql'

{% endcodeblock %}

+ cache_server
{% codeblock lang:rb %}

include_recipe 'redisio'

{% endcodeblock %}

#Part 2

create capistrano script to deploy application
use discourse as example
deploy to amazon EC2

+ write recipes with chef_spec, minitest-handler, test-kitchen and kitchen-vagrant
+ build 3 server cookbook, redis_server, web_server, database_server
+ attach web, redis and database role
+ why not put into role? cookbook is easier to track, version controller and set default value
+ also set roles to binding configuration

+ use chefspec to unittest cookbook
+ use minispec handler to verified server work
+ use serverspec to verified server works correctlly

+ use role to connect rails, redis and database server
+ use databag to store server
+ add capistrano spec to deploy

## deploy to amazon ec2!!

+ use knife-ec2 to create node
+ follow learnnode instruction
+ run serverspec according to the role
