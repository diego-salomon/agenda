export type NotificationKind = 'confirmation' | 'reminder' | 'cancellation';

export interface NotificationMessage {
  kind: NotificationKind;
  /** Recipient phone in E.164. */
  to: string;
  body: string;
  /** True when nothing was actually sent (demo mode). */
  simulated: boolean;
}

/**
 * The outbound-notification boundary. In demo mode the gateway records messages
 * and marks them `simulated` so the UI can show them labelled "simulado". In
 * live mode a Supabase Edge Function fans these out to an SMS/WhatsApp provider.
 */
export interface NotificationGateway {
  send(message: NotificationMessage): Promise<void>;
  /** Demo convenience: the messages recorded so far (newest first). */
  recorded?(): readonly NotificationMessage[];
}
