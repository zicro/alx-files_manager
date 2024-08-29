import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

const thumbnail = async (width, localPath) => {
  const thumbnail = await imageThumbnail(localPath, { width });
  return thumbnail;
};

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const files = dbClient.db.collection('files');
  const file = await files.findOne({ _id: new ObjectID(fileId) });

  if (!file) {
    throw new Error('File not found');
  }

  const fileName = file.localPath;
  const thumbnail500 = await thumbnail(500, fileName);
  const thumbnail250 = await thumbnail(250, fileName);
  const thumbnail100 = await thumbnail(100, fileName);

  const image500 = `${file.localPath}_500`;
  const image250 = `${file.localPath}_250`;
  const image100 = `${file.localPath}_100`;

  await fs.writeFile(image500, thumbnail500);
  await fs.writeFile(image250, thumbnail250);
  await fs.writeFile(image100, thumbnail100);
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const users = dbClient.db.collection('users');
  const user = await users.findOne({ _id: new ObjectID(userId) });

  if (user) {
    console.log(`${user.email}!`);
  } else {
    throw new Error('User not found');
  }
});
