# **App Name**: InvoiceFlow

## Core Features:

- Dashboard Summary: Display key stats (Total Spend, Total Items) based on a selected date range, defaulting to the current month.
- Invoice Creation Modal: Modal to add new invoices with fields for category, product name (autocomplete with product creation), quantity, unit price, date, and image upload.
- Product Autocomplete & Creation Tool: LLM-powered combobox autocompletes existing products; if a product is not found, it offers to create a new product on-the-fly, storing the data in Firestore.
- Invoice List View: Display invoices in a sortable, searchable table with columns for date, category, product name, quantity, price, total, and image thumbnail.
- Product Management (CRUD): Page to manage products, allowing to create, read, update, and delete product entries for use in invoice creation.
- Reporting (BIGC & SPLZD/Khác): Generate separate reports: one table detailing all BIGC transactions and one table showing aggregated quantity and amount for other transactions.
- Export: Offer buttons to export the displayed report data as .xlsx and .pdf files.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to evoke a sense of trust and reliability, contrasting effectively within a light UI.
- Background color: Very light gray (#F5F5F5), offering a clean backdrop that supports prolonged screen use.
- Accent color: Teal (#009688), carefully chosen because it's a very safe color for this app that also adds a touch of freshness and innovation.
- Font: 'Inter' (sans-serif) for both headings and body text, selected for its clean readability and modern aesthetic, promoting a professional appearance.
- Lucide React icons should be consistently used throughout the application to represent actions and data, enhancing user understanding.
- Responsive design with a sidebar or top navigation for page switching, optimized for both desktop and mobile screens.
- Subtle transitions and animations using framer-motion to provide a smooth, interactive user experience, improving perceived performance.