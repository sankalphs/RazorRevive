# Encoding Fixes Summary

Fixed double-encoded UTF-8 characters that appeared as "Ã×", "Â·", and "â€" on screen.

## Changes Made

### 1. Multiplication Sign "×" → "x"
- `frontend/src/components/BatchSimulator.tsx:209` - ROI multiplier display
- `frontend/src/components/MetricsOverview.tsx:100` - ROI return label

### 2. Middle Dot "Â·" → "·" (via HTML entity &#x00B7;)
- `BatchSimulator.tsx:149,179,194` - "failed payments · types", "% · recovered", "% · recovered"
- `HinglishVoiceAgent.tsx:190,227,242,245` - "paused · scheduled", "· ·", "Priya · merchant", "· speaks Hinglish"
- `MandateSequencerView.tsx:125,162,172` - "mandate cancelled", "Detects · failure", "Debit succeeds · fees"

### 3. Em Dash "â€" → "—" (via HTML entity &#x2014;)
- `BatchSimulator.tsx:7,55,116,119,231,265` - section subtitles and body text
- `MetricsOverview.tsx:6,7,45` - card headers and descriptions
- `AuditTrailTable.tsx:7,108,146` - table headers and empty states
- `HinglishVoiceAgent.tsx:16,328` - component headers and messages
- `MandateSequencerView.tsx:7,163` - section headers and body text
- `WebhookTester.tsx:7,70,80,90,219` - panel headers and error messages

All fixes use HTML entities to ensure consistent UTF-8 rendering across environments.