import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

class Routes {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/status', AppController.getStatus);
    this.router.get('/stats', AppController.getStats);
    this.router.post('/users', UsersController.postNew);
    this.router.get('/connect', AuthController.getConnect);
    this.router.get('/disconnect', AuthController.getDisconnect);
    this.router.get('/users/me', UsersController.getMe);
    this.router.post('/files', FilesController.postUpload);
    this.router.get('/files/:id', FilesController.getShow);
    this.router.get('/files', FilesController.getIndex);
    this.router.put('/files/:id/publish', FilesController.putPublish);
    this.router.put('/files/:id/unpublish', FilesController.putUnpublish);
    this.router.get('/files/:id/data', FilesController.getFile);
  }

  getRouter() {
    return this.router;
  }
}

export default Routes;
