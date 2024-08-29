/* eslint-disable consistent-return */
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import mime from 'mime-types';
import dbClient from '../utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async postUpload(req, res) {
    const { user } = req;

    const {
      name,
      type,
      parentId,
      isPublic = false,
      data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');
    if (parentId) {
      const file = await files.findOne({
        _id: ObjectID(parentId),
        userId: user._id,
      });
      if (!file) return res.status(400).json({ error: 'Parent not found' });
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = `${filePath}/${uuidv4()}`;
    const buff = Buffer.from(data, 'base64');

    try {
      await fs.mkdir(filePath, { recursive: true });
      await fs.writeFile(fileName, buff, 'utf-8');

      const insertedFile = await files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: fileName,
      });

      res.status(201).json({
        id: insertedFile.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });

      if (type === 'image') {
        fileQueue.add({
          userId: user._id,
          fileId: insertedFile.insertedId,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getShow(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const files = dbClient.db.collection('files');

    try {
      const file = await files.findOne({
        _id: ObjectID(fileId),
        userId: user._id,
      });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      return res.status(200).json(file);
    } catch (error) {
      console.error('Error getting file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId, page } = req.query;
    const pageNum = parseInt(page, 10) || 0;

    const files = dbClient.db.collection('files');
    const query = { userId: user._id };

    if (parentId) {
      query.parentId = ObjectID(parentId);
    }

    try {
      const result = await files
        .aggregate([
          { $match: query },
          { $sort: { _id: -1 } },
          {
            $facet: {
              metadata: [
                { $count: 'total' },
                { $addFields: { page: pageNum } },
              ],
              data: [{ $skip: 20 * pageNum }, { $limit: 20 }],
            },
          },
        ])
        .toArray();

      if (!result || result.length === 0 || !result[0].data) {
        return res.status(404).json({ error: 'Files not found' });
      }

      const final = result[0].data.map((file) => ({
        ...file,
        id: file._id.toString(),
      }));

      return res.status(200).json(final);
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putPublish(req, res) {
    await FilesController.togglePublish(req, res, true);
  }

  static async putUnpublish(req, res) {
    await FilesController.togglePublish(req, res, false);
  }

  static async togglePublish(req, res, isPublic) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);

    try {
      const newValue = { $set: { isPublic } };
      const options = { returnOriginal: false };
      const updatedFile = await files.findOneAndUpdate(
        { _id: idObject, userId: user._id },
        newValue,
        options,
      );

      if (!updatedFile.value) {
        return res.status(404).json({ error: 'File not found' });
      }

      return res.status(200).json(updatedFile.value);
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const files = dbClient.db.collection('files');
    const file = await files.findOne({ _id: ObjectID(fileId) });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.isPublic) {
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }
      try {
        const data = await fs.readFile(file.localPath);
        const contentType = mime.contentType(file.name);
        return res.header('Content-Type', contentType).status(200).send(data);
      } catch (error) {
        console.error('Error getting file:', error);
        return res.status(404).json({ error: 'File not found' });
      }
    } else {
      const user = await FilesController.getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (file.userId.toString() !== user._id.toString()) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      try {
        const contentType = mime.contentType(file.name);
        return res
          .header('Content-Type', contentType)
          .status(200)
          .sendFile(file.localPath);
      } catch (error) {
        console.error('Error getting file:', error);
        return res.status(404).json({ error: 'File not found' });
      }
    }
  }
}

export default FilesController;
