# What Twirl does

Twirl turns 3D models of products into interactive configurators. A merchant who sells products
that come in variations (a chair in several fabrics, a sofa with optional cushions, a table in
different lengths) uploads a 3D model once. Twirl turns it into a configurator that shoppers use
on the merchant's own website: they change the product in 3D, see the price update instantly,
and send a quote request for exactly the design they made.

This document describes the product from the point of view of the people who use it. For the
technical design, see [architecture.md](architecture.md) and the [ADRs](adr/).

## Who it's for

- **Merchants:** businesses that sell configurable products (furniture, lighting, outdoor
  gear, vehicles, fixtures) and already have, or can get, a 3D model of them.
- **Shoppers:** their customers, who want to see what they're buying before they ask for a
  price or order.
- **The Twirl team (admins):** who manage plans and handle requests for the 3D-modelling
  service.

## The shopper experience

Shoppers meet Twirl inside the merchant's website (or through a link they were sent). They never
need an account.

### The configurator

- **A 3D view of the product** that they can rotate, zoom and view from preset angles (front,
  three-quarter, side, back, top). It's lit like a photo studio, with soft shadows and an optional
  curved backdrop. After a few idle seconds it turns slowly on its own, like a turntable.
- **Options beside, below or over the product**, depending on the layout the merchant chose:
  - **Colours:** for each customisable part, the model's original finish plus the colours the
    merchant added, each with an optional extra cost. If the merchant allows it, shoppers can
    pick any colour with a colour picker. Colour changes fade smoothly on the model, and
    textures (fabric weave, wood grain) keep their detail.
  - **Show / hide:** optional parts, such as cushions or a headrest, that shoppers can include
    or leave out, each with its own price.
  - **Sizes:** sliders such as width or diameter. The model resizes as they drag. Some parts
    stretch, while others keep their size and move with the edge (legs stay legs-sized, and
    cushions stay on the seat).
- **A live price:** the total updates with every change, with a breakdown of the base price
  and each extra.
- **Rules that keep designs valid:** if a choice isn't available with another (brass frames
  only with dark fabrics, for example, or large sizes only with the reinforced frame), the
  configurator fixes the conflict automatically and explains why in a short message. Options
  can also be hidden or greyed out while another choice is selected.
- **Reset** returns everything to the merchant's defaults.

It works on phones (options in a bottom sheet), tablets and desktops, with touch, mouse and
keyboard.

### Actions

- **Get a quote:** a short form (name, email, optional phone and message). The design and its
  price go to the merchant by email and into their dashboard. The price is always worked out
  again by Twirl's servers, so it can't be tampered with.
- **Share:** creates a short link (`/c/…`) that opens the same product with exactly the same
  choices. The link keeps showing that design even after the merchant updates the product.
- **Download image:** saves a sharp PNG of the current view, with the backdrop. Products on the
  Free plan carry a small "Made with Twirl" mark.
- **View in your room (AR):** shown as "coming soon".

### Privacy

Twirl counts how products are used (views, option changes, shares, downloads, quotes) without
cookies or personal data: each visit has a random id that lives only in that browser tab. Quote
requests are the only place a shopper gives personal details, and those are visible only to the
merchant who received them.

## The merchant experience

### Getting started

1. **Sign in** with Google or with a link sent by email. The first sign-in creates the
   merchant's workspace automatically.
2. **Upload a 3D model** (.glb or .gltf, up to 15 MB) on the dashboard by dragging it in or
   choosing a file. Twirl checks the file straight away and reports its meshes, triangles and
   textures. It warns about things that may cause problems, such as very heavy models, huge
   textures or unnamed parts, and rejects files it can't use with a clear reason.
3. **Create a product** from the model. Twirl opens the editor with every part of the model
   listed.

A getting-started guide on the dashboard ticks off these steps as they're done.

### The editor

The editor has five steps on the left and a live 3D preview on the right.

1. **Product:** name, description, currency and price. Once published, it also shows the last
   30 days of activity: visitors, changes, shares, downloads and quotes.
2. **Parts:** every piece of the 3D file, each listed once. Untick pieces that shouldn't
   appear (props or helper objects left in the file), and give the rest names shoppers
   understand ("Seat cushion" instead of `Pillow_01`). Hovering a row highlights the piece in
   the preview.
3. **Options:** for each part, a **Customisable** switch, then two independent options:
   - **Colour:** the colours on offer (each with a name and extra cost), the default, and
     whether shoppers may pick any colour.
   - **Show / hide:** whether shoppers can remove the part, whether it's shown at first, and
     its price.

   Below the parts, **Sizes** adds sliders that resize the product. The merchant sets the
   range, step, default, the model's real size, which directions change, how each part
   responds (stretch, move or fixed), and the price per step.

4. **Rules:** combinations to prevent, in plain language:
   - **Requires:** if a shopper chooses X, they must also have Y.
   - **Not together:** X and Y can't be chosen together.
   - **Hide or disable:** while X is chosen, hide or disable Y.

   Each rule has a message that shoppers see when it changes their choice.

5. **Appearance:**
   - layout (sidebar, bottom bar or fullscreen), brand colour, font and logo;
   - the starting camera view, and which way the model's front faces;
   - lighting presets and studio environments, backdrop colours, shadows and the studio curve.

While editing:

- **Problems are flagged as you go.** A "things to fix" menu jumps straight to each one, and
  the preview keeps showing the last valid version.
- **Try as a shopper** opens the complete configurator exactly as shoppers will see it.
- **Save** keeps a draft without changing what shoppers see.

### Publishing and versions

- **Publish** makes the current draft live. Each publish creates a numbered version that never
  changes afterwards, so share links and quotes always refer to exactly what the shopper saw.
- **Versions** lists every published version. From there the merchant can roll back
  (**Make live**), start editing from an older version (**Copy to draft**) or take the product
  off their site (**Unpublish**).
- The editor shows whether there are changes that haven't been published yet.

### Putting it on a website

**Embed** gives a two-line snippet to paste into any website (Shopify, WordPress, Squarespace,
Webflow or custom HTML), plus a direct link:

```html
<div data-twirl-product="PRODUCT_ID"></div>
<script src="https://YOUR-TWIRL-DOMAIN/embed.js" async></script>
```

The configurator sizes itself to the page: wide on desktop, tall on phones. It sends events
(`twirl:ready`, and `twirl:change` with the choices and price) that the merchant's site can listen
to, for example to show the price elsewhere on the page.

### Quotes

Every quote request arrives:

- **by email**, with the design in plain words and the price; replying goes straight to the
  shopper;
- **in the Quotes inbox**, which shows a count of new requests and has Inbox and Archived tabs.
  Each quote shows the full design, the price breakdown and the contact details, with **Reply
  by email** and **Archive** buttons.

### Need a model?

Merchants without a 3D model can ask the Twirl team to make one through the **Need a 3D model?**
form: what the product is, plus links to product pages or photos.

## Plans

| Plan                 | Live products | Watermark | Price      |
| -------------------- | ------------- | --------- | ---------- |
| Free trial (14 days) | 1             | Yes       | $0         |
| Starter              | 10            | No        | Contact us |
| Pro                  | 50            | No        | Contact us |

- **Free is a 14-day trial**, counted from signup (workspaces that existed before trials got 14
  days from that release). When it ends, live products show a still image of their default design
  (no options, price, quotes or share links), nothing can be published, and a dashboard banner
  explains why. Upgrading (by an admin, for now) switches everything back on; nothing is deleted.
- **Drafts are unlimited.** Only live (published) products count towards the plan.
- **Limits are checked when publishing.** Downgrading never takes products offline; it only
  prevents publishing more until the workspace is back under its limit.
- **Upgrading:** the **Pricing** page has an "Upgrade, contact us" button that emails the
  Twirl team, who change the plan in the admin panel. There's no online checkout yet.
- **One place to change limits and prices:** `apps/web/src/config/plans.ts`.

## Admin

People whose email is in `ADMIN_EMAILS` get an **Admin panel**:

- **Overview:** totals for workspaces, users, live products, recent quotes and new model
  requests, plus workspaces per plan.
- **Workspaces:** search by name or owner email; open a workspace to see its people,
  products (with links to the live configurators) and activity, and change its plan.
- **Model requests:** every modelling request with contact details, description and links, and
  a status (New, In progress, Done, Declined).

## Safety and reliability

- **Model files go straight to storage.** They upload directly from the browser to Cloudflare
  R2 and never pass through Twirl's servers. Each upload is checked against what was declared.
- **Every workspace's data is private to it.** Each database query is scoped to the signed-in
  workspace, and quote requests are never exposed publicly.
- **Public forms and links are protected.** Requests from other websites are refused, every
  input is validated and size-limited, spam traps catch bots, and each visitor is rate-limited.
- **Pages can't be framed by other sites,** apart from the embed, which is meant to be framed.
- **Published versions are immutable,** so what a shopper shared or asked a quote for can always
  be shown exactly.

## Not in this version

These are planned for later and intentionally left out of v1:

- Shopify app and add-to-cart
- Online payments
- AR viewing
- Analytics dashboards
- Teams and invitations
- Swapping parts for alternatives
- Model optimisation
- Materials beyond colour
- Engraving
- Hotspots
- AI model generation
- Formats other than glTF/GLB
