import express from 'express';
import Routes from './routes';

class App {
  constructor() {
    this.port = parseInt(process.env.PORT, 10) || 5000;
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  initializeMiddlewares() {
    this.app.use(express.json());
  }

  initializeRoutes() {
    const routes = new Routes();
    this.app.use('/', routes.getRouter());
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

const server = new App();
server.start();
