import type { NotificationGateway, NotificationMessage } from '@/application';

/**
 * Demo gateway: nothing leaves the browser. Messages are recorded (and forced
 * to `simulated: true`) so the admin panel can show them labelled "simulado".
 */
export class DemoNotificationGateway implements NotificationGateway {
  private messages: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    this.messages.unshift({ ...message, simulated: true });
  }

  recorded(): readonly NotificationMessage[] {
    return this.messages;
  }
}
