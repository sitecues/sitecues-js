# -*- mode: ruby -*-
# vi: set ft=ruby :

require 'etc'
require 'yaml'

# Build username.
$USERNAME = Etc.getlogin


# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Initialize the workspace
  initialize_workspace

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "sitecues-js"

  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "http://s3.amazonaws.com/vagrant.sitecues.com/boxes/sitecues-js.box"

  config.vm.provider :virtualbox do |vb|
    vb.name = "sitecues-js-vagrant-002"
  end

  # Perform

  # Set the build username.
  config.vm.provision :shell do |s|
    s.path = "tools/vagrant/set_build_user.sh"
    s.args = $USERNAME
  end

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network :forwarded_port, guest: 80, host: 8080

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network :private_network, ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network :public_network

  # If true, then any SSH connections made will enable agent forwarding.
  # Default value: false
  # config.ssh.forward_agent = true

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  # config.vm.provider :virtualbox do |vb|
  #   # Don't boot with headless mode
  #   vb.gui = true
  #
  #   # Use VBoxManage to customize the VM. For example to change memory:
  #   vb.customize ["modifyvm", :id, "--memory", "1024"]
  # end
  #
  # View the documentation for the provider you're using for more
  # information on available options.

  # Enable provisioning with Puppet stand alone.  Puppet manifests
  # are contained in a directory path relative to this Vagrantfile.
  # You will need to create the manifests directory and a manifest in
  # the file base.pp in the manifests_path directory.
  #
  # An example Puppet manifest to provision the message of the day:
  #
  # # group { "puppet":
  # #   ensure => "present",
  # # }
  # #
  # # File { owner => 0, group => 0, mode => 0644 }
  # #
  # # file { '/etc/motd':
  # #   content => "Welcome to your Vagrant-built virtual machine!
  # #               Managed by Puppet.\n"
  # # }
  #
  # config.vm.provision :puppet do |puppet|
  #   puppet.manifests_path = "manifests"
  #   puppet.manifest_file  = "init.pp"
  # end

  # Enable provisioning with chef solo, specifying a cookbooks path, roles
  # path, and data_bags path (all relative to this Vagrantfile), and adding
  # some recipes and/or roles.
  #
  # config.vm.provision :chef_solo do |chef|
  #   chef.cookbooks_path = "../my-recipes/cookbooks"
  #   chef.roles_path = "../my-recipes/roles"
  #   chef.data_bags_path = "../my-recipes/data_bags"
  #   chef.add_recipe "mysql"
  #   chef.add_role "web"
  #
  #   # You may also specify custom JSON attributes:
  #   chef.json = { :mysql_password => "foo" }
  # end

  # Enable provisioning with chef server, specifying the chef server URL,
  # and the path to the validation key (relative to this Vagrantfile).
  #
  # The Opscode Platform uses HTTPS. Substitute your organization for
  # ORGNAME in the URL and validation key.
  #
  # If you have your own Chef Server, use the appropriate URL, which may be
  # HTTP instead of HTTPS depending on your configuration. Also change the
  # validation key to validation.pem.
  #
  # config.vm.provision :chef_client do |chef|
  #   chef.chef_server_url = "https://api.opscode.com/organizations/ORGNAME"
  #   chef.validation_key_path = "ORGNAME-validator.pem"
  # end
  #
  # If you're using the Opscode platform, your validator client is
  # ORGNAME-validator, replacing ORGNAME with your organization name.
  #
  # If you have your own Chef Server, the default validation client name is
  # chef-validator, unless you changed the configuration.
  #
  #   chef.validation_client_name = "ORGNAME-validator"
end

# Perform any vagrant workspace initializations.
def initialize_workspace()
  workspace_data_dir = File.join('.vagrant', 'workspace')
  FileUtils.mkdir_p workspace_data_dir
  workspace_data_file = File.join(workspace_data_dir, 'data.yml')
  data = {}
  if File.exists? workspace_data_file
    data = YAML::load_file workspace_data_file
  end

  if !data[:git_attributes_applied]
    git_attributes_applied = false
    puts 'Appling .gitattributes to the workspace.'
    puts 'Stashing current updates...'
    if system 'git stash'
      puts "Changes stashed."

      puts 'Clearing file cache...'
      if system 'git rm --cached -r .'
        puts "File cache cleared."

        puts 'Resetting workspace...'
        if system 'git reset --hard'
          puts 'Workspace reset.'
          git_attributes_applied = true
        else
          puts 'Unable to reset workspace'
        end
      else
        puts 'Unable to clear file cache.'
      end

      puts 'Popping stash...'
      if system 'git stash pop'
        puts 'Stash popped.'
      else
        puts 'Unable to pop stash.'
      end

    else
      puts 'Unable to stash changes.'
    end

    data[:git_attributes_applied] = git_attributes_applied
  end

  File.open(workspace_data_file, 'w' ) do |out|
    YAML.dump(data, out)
  end
end