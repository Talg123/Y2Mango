'use strict';
const AWS = require('aws-sdk');
const DB = require('../mongoose');
const rek = new AWS.Rekognition();
const q = require('../queue');

async function event(event, context) {
  const image = event.Records[0].s3.object;
  const details = await receiveRekognitionDetails(image.key);
  if (!Object.keys(details).length)
    return;
  await updateDB({...details, id: image.key});
  await sendToQueue(image.key);
  return {
    statusCode: 200,
    body: {}
  };
}

const receiveRekognitionDetails = async (key) => {
  try {
    const responseText = await rek.detectText({
      Image: {
        S3Object: {
          Bucket: process.env.S3_BUCKET,
          Name: key
        }
      }
    }).promise();
    const responseFaces = await rek.detectFaces({
      Image: {
        S3Object: {
          Bucket: process.env.S3_BUCKET,
          Name: key
        }
      },
      Attributes: [
        "ALL"
      ]
    }).promise();
    const responseModerations = await rek.detectModerationLabels({
      Image: {
        S3Object: {
          Bucket: process.env.S3_BUCKET,
          Name: key
        }
      }
    }).promise();
    return {
            responseModerations: responseModerations.ModerationLabels,
            responseFaces: responseFaces.FaceDetails, 
            responseText: responseText.TextDetections
          };
  } catch (error) {
    console.log(error);
  }

  return {};
}

const updateDB = async({ id, responseText, responseFaces, responseModerations }) => {
  const params = {
    id,
    textDetection: responseText,
    faceDetection: responseFaces,
    moderationsDetection: responseModerations
  }

  try {
    await DB.rekognition.create(params);
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}

const sendToQueue = async (id) => {
  try {
    await q.produce(q.cfg, id);
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}

export const handler = event;


