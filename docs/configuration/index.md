# Configuration of SliDesk

SliDesk uses a `.env` file to be configured for your presentation.

This file can be used for plugins (values are readable in an object `window.slidesk.env`) or presentation (values are readable with the syntax `++KEY++`).

Some keys are reserved for SliDesk:

## HTTPS

If this key is set to "true", you'll need to specify the "KEY", "CERT", and optionaly the "PASSPHRASE".

Then you can browse your presentation with https.

## KEY

The path of the certificat key file.

## CERT

The path of the certificat cert file.

## PASSPHRASE

The passphrase if needed.

## WIDTH

This parameter is used for responsive design. If this value is specified, then images are recalculated to fit the ratio with this original width of the presentation.

## TITLE

You can specify a title that will be displayed at the title tag.