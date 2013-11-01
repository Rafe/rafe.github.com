---
layout: post
title: "understand chef lwrp (Heavy version)"
date: 2013-10-31 22:08
comments: true
categories: ruby, devops
---

Recently I am mainly working on devops works, including system admin and chef.
So I think it would be good to share some experience working with chef:

# Resource and Provider in Chef

In chef, we use resource to describe the state of our system.
And cookbook is a series of resources that describe a state of the system.

For example, the cookbook to install nginx on server:

```
package 'nginx' do
  action :install
end

template '/etc/nginx/nginx.conf' do
  action :create
end

service 'nginx' do
  action [:enable, :start]
end
```

describe 3 resources, nginx package, nginx service and nginx config file.

Than the provider will take the action in resource, execute the corresponding action,
which will install nginx package, create nginx config file, start and enable nginx service.

So provider provide the method to achieve the state of resource.
Take a look at the install action in package provider (simplfied):

```
def action_install
  if !@new_resource.version.nil? && !(target_version_already_installed?)
    install_version = @new_resource.version
  else
    Chef::Log.debug("#{@new_resource} is already installed - nothing to do")
    return
  end

  install_package(@new_resource.package_name, install_version)
end
```

The provider will check current installed version and install package by install_package method,
install_package method is implemented by different provider like Yum and Rpm.
Will run command like 'yum install nginx' to install package.

# Resource and Provider (Heavy ver)

Sometime we want to define specific resource and provider for better describe the state of our server.
For example like `ruby '2.0.0-p247'` or `nginx_site 'www.example.com'`
We have two way to implement it. One is using definition, which is like a helper method in chef.
Other is writing custom resource and provider.

We can create custom resource and provider by include the Chef::Resource and Chef::Provider


# Resource and Provider (Light version - LWRP)

# Testing LWRP
