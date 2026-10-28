import type { NotificationGateway, NotificationMessage } from '@/application';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Live gateway. Hands the message to the `notify` Supabase Edge Function, which
 * fans it out to the configured SMS/WhatsApp provider (the provider adapter is
 * stubbed in /supabase/functions/notify — wire your own there). Nothing about
 * the provider leaks above this boundary.
 */
export class SupabaseNotificationGateway implements NotificationGateway {
  constructor(private readonly client: SupabaseClient) {}

  async send(message: NotificationMessage): Promise<void> {
    const { error } = await this.client.functions.invoke('notify', {
      body: { kind: message.kind, to: message.to, body: message.body },
    });
    if (error) throw error;
  }
}
