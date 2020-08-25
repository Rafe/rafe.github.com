title: "Understand chef lwrp (Heavy version)"
date: 2013-10-31 22:08
tags: ruby
---

Recently I am mainly working on devops things, including system admin and chef.
We are refactoring our old chef recipes into a more modulize shape with tests,
So I think it's a good time to share some experience in this refactor!

## Resource and Provider in Chef

In chef, we use resource to describe the state of our system.
And cookbook is a series of resources that describe the server state.

<!-- more -->

For example, the cookbook to install nginx on server is like this:

{% codeblock lang:ruby %}
package 'nginx' do
  action :install
end

template '/etc/nginx/nginx.conf' do
  action :create
end

service 'nginx' do
  action [:enable, :start]
end
{% endcodeblock %}

describe 3 resources, nginx package, nginx service and nginx config file.

Than the provider will take the action in resource, execute the corresponding action,
which will install nginx package, create nginx config file, start and enable nginx service.

So provider provide methods to achieve the state of resource.
Take a look at the install action in package provider (simplfied for read):

{% codeblock lang:ruby %}
def action_install
  if !@new_resource.version.nil? && !(target_version_already_installed?)
    install_version = @new_resource.version
  else
    Chef::Log.debug("#{@new_resource} is already installed - nothing to do")
    return
  end

  install_package(@new_resource.package_name, install_version)
end
{% endcodeblock %}

The provider will check current installed version and install package by install_package method,
install_package method is implemented by different provider like Yum and Rpm.
Which will run command like `yum install nginx` to install package.

## Resource and Provider (Heavy ver)

Sometime we want to define specific resources and providers for better describe the state of our server.
For example like `ruby '2.0.0-p247'` or `nginx_site 'www.example.com'`
We have two way to implement it. One is using definition, which is like a helper method in chef.
Another is writing custom resource and provider.

In our cookbook, we use custom resorce and provider to upload our ssh key to github

{% codeblock lang:ruby %}
github key_name do
  user github_user['name']
  password github_user['password']
  public_key key
  action :upload
end
{% endcodeblock %}

We can create resource and provider by inherit the Chef::Resource and Chef::Provider:

{% codeblock lang:ruby %}
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
      # implement load_current_resource method to load previous resource before action
      def load_current_resource
        @current_resource = Chef::Resource::Github.new(@new_resource.name)
        @current_resource.name(@new_resource.name)
        @current_resource.user(@new_resource.user)
        @current_resource.password(@new_resource.password)
        @current_resource
      end

      # use github gem to upload user key
      def action_upload
        require 'github'
        github = ::Github.new({
          login:@new_resource.user,
          password:@new_resource.password
        })
        github.users.keys.create({ title: title, key: public_key_content })
        new_resource.updated_by_last_action(true)
      end
  end
end
{% endcodeblock %}

Above code extend the chef to build custom resource and provider.
Put the code under /libraries directory in cookbook, and then the custom resource and provider will be avaliable in cookbook!

## Resource and Provider (Light version - LWRP)

However, the full class implementation is too complex for system admins who don't have ruby background.
So chef provide a resource and provider DSL, called light weight resource provider (LWRP)

Using LWRP DSL, previous resource and provider can be written as:

{% codeblock lang:ruby %}
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

{% endcodeblock %}

Basically the DSL use dynamic programming to construct the method and create new resource and provider class.
The dsl syntax will generate into full resource and provider code same as the heavy version.

## Testing LWRP

The reason we dig into how LWRP generate, is mainly because we want to know how to test LWRP better in our refactor
We use chefspec to test the logic in our custom resource and provider

{% codeblock lang:ruby %}
require 'spec_helper'

# lwrp default use cookbook name as namespace, here assume the cookbook is `workstation`
describe 'github resource' do
  let(:github_resource) { Chef::Resource::WorkstationGithub.new('user_key') }
  it 'creates new resource with name' do
    expect(github_resource.name).to eq('user_key')
  end
end

{% endcodeblock %}

For testing provider part, it's much harder because provider depends on node, resource and run_context
However, we can either throw the checspec run context to provider or mock everything, and we choose the later one:

{% codeblock lang:ruby %}
describe 'github provider' do
  let(:node) { Chef::Node.new }

  let(:run_context) { double(:run_context, node: node) }

  let(:new_resource) do
    double(:new_resource, name: 'github_key',
        user: 'test@test.com',
        password: 'password',
        updated_by_last_action: false)
  end

  let(:provider) do
    Chef::Provider::WorkstationGithub.new(new_resource, run_context)
  end

  let(:github) {double(users: { keys: {} } )}

  it 'upload key to github' do
    allow(Github).to receive(:new)
      .with({login:'test@test.com',  password:'pass'})
      .and_return(github)

    expect(github.users.keys).to receive(:create)
      .with({ title: 'autogen:casecommons@desktop', key: 'my key' })
      .and_return(true)

    provider.action_upload
  end
end
{% endcodeblock %}

## Conclusion

Resource and provider is the foundamental concept of Chef.
while we refactor the cookbook, we found a lot of recipes is written like bash script.
Recipe should describe the state of our server but not the action taken,
and the action logic need to be seperate into provider.
This is also the target we want to achieve in the refactor. I will share more experience on how to test and build the infrastructure with chef later.
