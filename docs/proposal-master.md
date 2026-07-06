# Solatrix Proposal Master

This document records the approved visual direction for the Roof Check proposal generator.

## Audience
Ordinary homeowners and families, not executives.

## Tone
Warm, clear, practical, confidence-building.

## Rules
- Hebrew only, RTL.
- Use the real Solatrix logo asset supplied by the app as `logoSrc`.
- Do not rely on AI-generated logo shapes in the final builder.
- Avoid overusing words like “premium”. The quality should be visible from the layout, spacing, graphics and clarity.
- Keep customer values dynamic: name, address, roof area, usable area, system size, annual production, annual savings, payback, profit, investment options and CTA.

## Approved visual master structure
1. Cover — home-focused opening: “the house can create value every day”.
2. Summary — key numbers in simple cards.
3. Digital roof — roof visualization with suitable area, direction and obstacles.
4. Financial overview — cost, annual savings, payback and long-term value.
5. Energy analytics — monthly production, self-use and export to grid.
6. Recommended system — system size, panels, inverter, future battery readiness and support.
7. Trust and process — why Solatrix and the 4-step path.
8. Next step — investment options and WhatsApp CTA.

## Implementation note
The current `src/pdfReport.js` is a code adaptation of this master. It recreates the visual language with HTML/CSS/SVG so values remain dynamic and the final PDF does not contain AI-generated Hebrew text artifacts.
