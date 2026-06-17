-- Add external booking URL to masters (DIKIDI / YClients / WhatsApp / etc.)
ALTER TABLE masters ADD COLUMN IF NOT EXISTS external_booking_url text;

-- Comment for reference
COMMENT ON COLUMN masters.external_booking_url IS
  'External booking link (DIKIDI, YClients, WhatsApp, etc.). When set, the client booking button redirects here instead of BeautyOS internal booking.';
