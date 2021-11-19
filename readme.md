# set up database
using docker + docker-compose
first generate a docker-compose using IoT stack, installing postgres and grafana.

connect to postgres and run
```sql
CREATE TABLE fake_data(  
    time TIMESTAMPTZ,
    phase NUMERIC,
    devicename varchar(255),
    voltagemin NUMERIC,
    voltagemax NUMERIC,
    voltagesma NUMERIC,
    currentmin NUMERIC,
    currentmax NUMERIC,
    currentsma NUMERIC,
    powermin NUMERIC,
    powermax NUMERIC,
    powersma NUMERIC
)
```

```sql
CREATE TABLE fake_alarms(  
    time TIMESTAMPTZ,
    type varchar(255),
    devicename varchar(255)
)
```
# set up grafana
log into the grafana web page and import `grafana-dashboard.json` to set up the dashboard
# set up arduino
## install nodebots interchange
`npm install -g nodebots-interchange`
## install standard firmata firmware
`interchange install StandardFirmata -a uno`

# install
first install node with nvm if it is not already installed
then add it to the sudo path by doing the following
`alias sudo='sudo '`
then open the nvm.sh script and add this to the last line
`alias node='$NVM_BIN/node'`

`npm install`

# running
`alias node='$NVM_BIN/node'`

`alias sudo='sudo '`

it needs to be run as root for GPIO access

`sudo node main.js`

# copy this device's sd
https://github.com/billw2/rpi-clone