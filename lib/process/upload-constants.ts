export const GENERATE_PROMPT =
  "Convert this P&ID or PFD into a complete process-hmi.yaml. Include all labeled equipment, flow edges, normalized positions matching the drawing layout, and inferred ISA instrument tags. Spread equipment to avoid overlap — minimum 0.11 horizontal and 0.13 vertical spacing between centers. Use smaller sizes for pumps, valves, and heat exchangers on dense diagrams.";

export const UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf";
