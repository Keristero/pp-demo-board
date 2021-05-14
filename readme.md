# install
first install node with nvm if it is not already installed
then add it to the sudo path by doing the following
`alias sudo='sudo '`
then open the nvm.sh script and add this to the last line
`alias node='$NVM_BIN/node'`

`npm install`

# running
`alias sudo='sudo '`
it needs to be run as root for GPIO access
`sudo node main.js`