# set up database
using docker + docker-compose
first generate a docker-compose using IoT stack, installing postgres and grafana.

connect to postgres and run
```sql
CREATE TABLE fake_data(  
    id SERIAL NOT NULL primary key,
    time TIMESTAMP WITH TIME ZONE,
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
    id SERIAL NOT NULL primary key,
    time TIMESTAMP WITH TIME ZONE,
    type varchar(255),
    devicename varchar(255)
)
```

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