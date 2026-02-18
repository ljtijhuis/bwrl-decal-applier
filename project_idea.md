- Project: Broken Wing Racing League Decal Applier (website)

- Context
  - League: Broken Wing Racing League
  - Platform: iRacing (using Trading Paints for custom liveries)
  - Cars/Series: GT3 cars and LMPs
  - Purpose of decals:
    - Promote the league (logos and sponsor)
    - Indicate driver class for some series (classes: AM, PRO-AM, PRO, ROOKIE)

- Current decal assets
  - Formats available: PNG, PSD, and one additional unknown format
  - Multiple versions for different cars
  - Stored in Google Drive

- Current workflow / pain points
  - Users manually apply decals:
    - Open their livery in image editing software
    - Open decal file
    - Paste decal onto livery
    - Export and upload to Trading Paints
  - New members frequently need help with this process
  - Existing resources:
    - YouTube tutorial video
    - Step-by-step guide

- Desired application functionality
  - Web app name: Broken Wing Racing League Decal Applier
  - User flow:
    - User uploads their livery file
    - App applies selected decal(s) to the uploaded livery
    - App serves the new livery (with decals applied) as a downloadable file
  - Support for multiple decal versions and car types
  - Minimize manual image-editing steps for users

- Technical preferences / constraints
  - Frontend: modern framework (suggested: React)
  - Backend: developer is thinking Node.js or Python; wants easy-to-open-source choice to encourage contributions
  - Image processing capability required (server-side or client-side)
  - Integration with Google Drive decal assets (source of decal files)
  - Output format(s) must be compatible with Trading Paints upload requirements (exact formats not specified)

- Unknowns / open questions (must extract only, not assume)
  - Exact file formats required by Trading Paints for uploads
  - Exact additional decal file format besides PNG and PSD
  - Required decal placement coordinates / scaling rules for each car model
  - Whether decals need transparency handling or layering options beyond simple overlay
  - Authentication/authorization requirements (user accounts, uploads, rate limits)
  - Desired deployment environment and hosting preferences
  - Whether to integrate directly with Trading Paints API (if available) or only provide downloadable liveries

- Deliverable requested by user
  - Write the application (frontend + backend) using recommended languages/frameworks (React + Node.js or Python) and make it easy to open-source for community contribution
