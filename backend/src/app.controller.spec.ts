import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('health', () => {
    it('should return service health payload', () => {
      const payload = appController.health();

      expect(payload.status).toBe('ok');
      expect(payload.service).toBe('calorion-backend');
      expect(typeof payload.timestamp).toBe('string');
      expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
