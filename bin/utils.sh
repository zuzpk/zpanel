#!/bin/bash

#Check if BASH
if [ "x$BASH_VERSION" = "x" -a "x$INSTALLER_LOOP_BASH" = "x" ]; then
    if [ -x /bin/bash ]; then
        export INSTALLER_LOOP_BASH=1
        exec /bin/bash -- $0 $*
    else
        echo "bash must be installed at /bin/bash before proceeding!"
        exit 1
    fi
fi

if [ "$(id -u)" -ne 0 ]; then
    echo "Please run this script as root or using sudo"
    exit 1
fi

print_cmd_arg=""
if type printf > /dev/null; then
    print_cmd="printf"
elif test -x /usr/ucb/echo; then
    print_cmd="/usr/ucb/echo"
else
    print_cmd="echo"
fi

#Check If Debian
IS_UBUNTU=0
if [ -e /etc/debian_version ]; then
  IS_UBUNTU=1
  export DEBIAN_FRONTEND=noninteractive
fi

#Setup Installers
if [ "$IS_UBUNTU" -eq 1 ]; then
    installer="apt"
elif [ -x /usr/bin/yum ]; then
    installer="/usr/bin/yum"
fi

#Install tar
if ! type "tar" > /dev/null; then
    $installer -y install tar
fi

#If tar still not installed than exit
if ! type "tar" > /dev/null; then
    echo "tar must be installed before proceeding!"
    exit 1;
fi

#Base
BASEURL="https://cp.zuzcdn.net/"
PUBLIC_IP=$(curl -s ifconfig.me)
__DIRNAME=$(pwd)




MYSQL_ROOT_PASSWORD=$(tr -dc 'A-Za-z0-9!@#$%^&*()-_=+<>?' < /dev/urandom | head -c 30)

log() {
  local message="$1"
  local type="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local color
  local endcolor="\033[0m"

  case "$type" in
    "info") color="\033[38;5;79m" ;;
    "success") color="\033[1;32m" ;;
    "error") color="\033[1;31m" ;;
    *) color="\033[1;34m" ;;
  esac

  echo -e "${color}${timestamp} - ${message}${endcolor}"
}

_install(){
    $installer -y install $1
}

_print(){
    $print_cmd $print_cmd_arg "$1"
}

_untar(){
    tar $1vf - 2>&1 || { echo Extraction failed. > /dev/tty; kill -15 $$; }
}

_install(){
    $installer -y install $1
}

_update(){

    log "Updating..." "info"

    $installer -y update
    if ! command -v curl >/dev/null 2>&1; then
        log "Installing curl..." "info"
        _install curl
    fi
}

_mkdir(){
    mkdir -p "$1"
}