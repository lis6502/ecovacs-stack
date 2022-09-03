import 'dotenv/config';

import fs from 'fs';
import { connect } from 'mqtt';

import { charge, clean, getMajorMap, getMinorMap } from './commands/commands';
import { VacuumMap } from './map/map';
import { getColoredConsoleLog, getDatafromMessage, isTopic } from './mqtt.utils';
import { Maybe } from './types';

const ca = fs.readFileSync('/opt/app/src/ca.crt');

const client = connect('mqtts://request-listener:8883', { ca });
console.info('starting mqtts listener');
let vacuumMap: Maybe<VacuumMap> = null;
let botReady = false;

client.on('connect', () => {
  console.log('connected');

  client.subscribe('iot/atr/#');
  client.subscribe(`iot/cfg/#`);
  client.subscribe(`iot/dtcfg/#`);
  client.subscribe(`iot/dtgcfg/#`);

  client.subscribe(
    `iot/p2p/+/${process.env.BOTID}/${process.env.BOTCLASS}/${process.env.RESOURCE}/+/+/+/p/+/j`,
    (err) => {
      if (!err) {
        // clean(client);
        getMajorMap(client);
        charge(client);
      }
    },
  );
});

client.on('error', (err) => {
  console.log('error', err);
});

client.on('message', (topic, message) => {
  // log message
  console.log(getColoredConsoleLog(topic), message.toString());

  // check if bot is connected
  if (isTopic('iot/atr/', topic)) {
    console.info(`${process.env.BOTID} is ready!`);
  }

  // handle 'getMajorMap'
  handleMap(topic, message);
});

const handleMap = (topic: string, message: Buffer) => {
  if (isTopic('getMajorMap', topic)) {
    const res = getDatafromMessage(message);
    if (!vacuumMap) {
      vacuumMap = new VacuumMap(res);
    }
    if (!vacuumMap.piecesIDsList) {
      console.info('TODO: handle no name case.');
      return;
    }
    vacuumMap?.piecesIDsList.forEach((pieceID) => {
      console.log('ask minor map for ', pieceID);
      vacuumMap && getMinorMap(client, pieceID, vacuumMap.settings);
    });
  }

  if (isTopic('MinorMap', topic)) {
    const res = getDatafromMessage(message);
    vacuumMap?.addPiecesIDsList(res.pieceIndex);
    vacuumMap?.addMapDataList({ data: res.pieceValue, index: res.pieceIndex });
    if (vacuumMap?.mapDataList.length && vacuumMap?.mapDataList.length === vacuumMap?.piecesIDsList.length) {
      vacuumMap?.buildMap();
    }
  }
};
