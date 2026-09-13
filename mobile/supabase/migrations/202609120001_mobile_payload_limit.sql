-- Apply only to the separate mobile project after checking existing row sizes.
-- Validation fails without modifying records if an existing payload is too big.
begin;
alter table public.mobile_records
  add constraint mobile_records_payload_size
  check (octet_length(payload::text) <= 65536) not valid;
alter table public.mobile_records validate constraint mobile_records_payload_size;
commit;
