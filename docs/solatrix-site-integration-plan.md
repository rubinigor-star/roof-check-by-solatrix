# Solatrix site + Roof Check integration plan

Uploaded approved site files received:

- index.html
- private-homes.html
- solar-price.html
- roof-check.html
- storage.html
- business.html
- agriculture.html
- faq.html
- contact.html

Target structure:

- `/` — approved Solatrix main site
- `/private-homes.html` — private homes page
- `/solar-price.html` — transparent pricing page
- `/business.html` — business/commercial page
- `/agriculture.html` — agriculture/farms page
- `/storage.html` — batteries/storage page
- `/faq.html` — FAQ page
- `/contact.html` — contact page
- `/roof-check/` — live Roof Check calculator app
- `/roof-check.html` — legacy/marketing page can either redirect to `/roof-check/` or stay as SEO landing page

Integration steps:

1. Replace the current root calculator landing with the approved `index.html` site.
2. Move the calculator app into `/roof-check/`.
3. Update calculator internal routes to live under `/roof-check/`, for example `/roof-check/address`, `/roof-check/roof-type`, `/roof-check/report`, and `/roof-check/admin`.
4. Update site navigation and CTA links so the main website sends users to `/roof-check/` for the active calculator.
5. Keep existing PDF report, local CRM storage, and WhatsApp CTA logic from the calculator.
6. Validate mobile navigation on both the approved site and the calculator.

Note: the uploaded approved HTML files contain large inline images/data URLs. They should be committed as real site files or split into `/assets/` in a follow-up cleanup.