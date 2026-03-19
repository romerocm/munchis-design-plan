-- WhatsApp messaging infrastructure for Twilio integration

-- Message log: tracks every WhatsApp send attempt
CREATE TABLE whatsapp_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  drop_id uuid REFERENCES drops(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  template_name text NOT NULL,
  content_sid text NOT NULL,
  twilio_sid text,
  status text DEFAULT 'queued',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_order ON whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_twilio_sid ON whatsapp_messages(twilio_sid);

-- Opt-out tracking: numbers that have sent STOP
CREATE TABLE whatsapp_opt_outs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp text NOT NULL UNIQUE,
  opted_out_at timestamptz DEFAULT now()
);

-- Payment reminder tracking
ALTER TABLE orders ADD COLUMN reminder_sent_at timestamptz;

-- RLS: service role only (these are server-side tables)
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;
