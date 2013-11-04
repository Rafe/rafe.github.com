---
layout: post
title: "understand chef lwrp (Heavy version)"
date: 2013-10-31 22:08
comments: true
categories: ruby, devops
---

Recently I am mainly working on devops things, including system admin and chef.
We are refactoring our old chef recipe into a more modulize shape with tests,
So I think it's a good time to share some experience in this refactor:

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
Take a look at the install action in package provider (simplfied for read):

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
Will run command like `yum install nginx` to install package.

# Resource and Provider (Heavy ver)

Sometime we want to define specific resource and provider for better describe the state of our server.
For example like `ruby '2.0.0-p247'` or `nginx_site 'www.example.com'`
We have two way to implement it. One is using definition, which is like a helper method in chef.
Other is writing custom resource and provider.

For example, we use custom resorce and provider to upload ssh key to github
```

github key_name do
  user github_user['name']
  password github_user['password']
  public_key key
  action :upload
end

```

We can create custom resource and provider by inherit the Chef::Resource and Chef::Provider:

```
class Chef
  class Resource
    class Github < Chef::Resource
      identity_attr :name

      def initialize(name, run_context=nil)
        super
        @resource_name = :github
        @provider = Chef::Provider::Github
        @action = 'upload'
        @allowed_actions.push(:upload)
        @name = name
        @returns = 0
      end

      def user(arg=nil)
        set_or_return(:user, arg, :kind_of => [String])
      end

      def password(arg=nil)
        set_or_return(:password, arg, :kind_of => [String])
      end

      def public_key(arg=nil)
        set_or_return(:public_key, arg, :kind_of => [String])
      end
    end
  end
end

class Chef
  class Provider
    class Github < Chef::Provider
      # implement load_current_resource method to set resource before action
      def load_current_resource
        @current_resource = Chef::Resource::Github.new(@new_resource.name)
        @current_resource.name(@new_resource.name)
        @current_resource.user(@new_resource.user)
        @current_resource.password(@new_resource.password)
        @current_resource
      end

      def action_upload
        github = ::Github.new({
          login:@new_resource.user,
          password:@new_resource.password
        })
        github.users.keys.create({ title: title, key: public_key_content })
        new_resource.updated_by_last_action(true)
      end
  end
end
```

Include the code under library directory, and we can use our new resource and provider!

# Resource and Provider (Light version - LWRP)

However, the full class implementation might be too hard for system admins who don't have ruby background.
So chef provide a resource and provider DSL, called light weight resource provider (LWRP)

Using LWRP DSL, previous resource and provider can be written as:

```
# resources/github.rb

action :upload

attribute :user, :kind_of => String
attribute :password, :kind_of => String
attribute :public_key, :kind_of => String

def initialize(*args)
  super
  @resource_name = :github
  @action = :upload
end

# providers/github.rb

action :upload do
  title = new_resource.name
  public_key_content = new_resource.public_key_content
  github = ::Github.new({
    login: new_resource.user,
    password: new_resource.password
  })
  github.users.keys.create({ title: title, key: public_key_content })
  new_resource.updated_by_last_action(true)
end

```

Basically the DSL use dynamic programming to construct the method and create new resource and provider class.
Take a look at the attribute method in chef/resource/lwrp_base.rb:

```
class Chef
  class Resource
    class LWRPBase < Resource
      ...
      def self.attribute(attr_name, validation_opts={})
        # Ruby 1.8 doesn't support default arguments to blocks, but we have to
        # use define_method with a block to capture +validation_opts+.
        # Workaround this by defining two methods :(
        class_eval(<<-SHIM, __FILE__, __LINE__)
          def #{attr_name}(arg=nil)
            _set_or_return_#{attr_name}(arg)
          end
        SHIM

        define_method("_set_or_return_#{attr_name.to_s}".to_sym) do |arg|
          set_or_return(attr_name.to_sym, arg, validation_opts)
        end
      end
    end
  end
end
```

# Testing LWRP
